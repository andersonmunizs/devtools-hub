import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/devtools-hub/ferramentas/json/');
  await expect(page.getByLabel('Entrada JSON', { exact: true })).toBeEnabled();
});
async function convert(
  page: Page,
  format: 'CSV' | 'XML' | 'YAML',
  input: string,
) {
  await page.getByLabel('Entrada JSON', { exact: true }).fill(input);
  await page.getByLabel('Formato de conversão').selectOption(format);
  await page
    .getByRole('button', { name: `Converter para ${format}`, exact: true })
    .click();
  await expect(
    page.getByLabel(`Resultado ${format}`, { exact: true }),
  ).not.toHaveValue('');
}
test('conversões reais usam Worker/CSP e preservam formato de cópia, tela cheia e download', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          document.documentElement.setAttribute('data-copied', text);
        },
      },
    }),
  );
  await page.reload();
  const workers: string[] = [];
  const requests: { url: string; type: string; body: string | null }[] = [];
  const errors: string[] = [];
  page.on('worker', (worker) => workers.push(worker.url()));
  page.on('request', (request) =>
    requests.push({
      url: request.url(),
      type: request.resourceType(),
      body: request.postData(),
    }),
  );
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const input = '[{"nome":"é😀","n":-2},{"nome":"Bia","n":null}]';
  for (const [format, extension] of [
    ['CSV', 'csv'],
    ['XML', 'xml'],
    ['YAML', 'yaml'],
  ] as const) {
    await convert(page, format, input);
    const output = page.getByLabel(`Resultado ${format}`, { exact: true });
    const displayed = await output.inputValue();
    await page
      .getByRole('button', { name: 'Copiar resultado', exact: true })
      .click();
    const exact = await page.locator('html').getAttribute('data-copied');
    expect(exact).not.toBeNull();
    expect(exact!.replaceAll('\r\n', '\n')).toBe(displayed);
    await page
      .getByLabel('Formato de conversão')
      .selectOption(format === 'CSV' ? 'XML' : 'CSV');
    await expect(
      page.getByLabel(`Resultado ${format}`, { exact: true }),
    ).toHaveValue(displayed);
    await page.getByRole('button', { name: 'Tela cheia', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByLabel(`Resultado ${format} expandido`),
    ).toHaveValue(displayed);
    const event = page.waitForEvent('download');
    await dialog
      .getByRole('button', { name: `Baixar ${format}`, exact: true })
      .click();
    const download = await event;
    expect(download.suggestedFilename()).toBe(`resultado.${extension}`);
    const path = await download.path();
    if (!path) throw new Error('Download missing');
    expect(await readFile(path, 'utf8')).toBe(exact);
    await page.keyboard.press('Escape');
  }
  expect(workers).toHaveLength(3);
  for (const request of requests) {
    expect(new URL(request.url).origin).toBe('http://127.0.0.1:4321');
    expect(request.body).toBeNull();
    expect(['fetch', 'xhr', 'websocket']).not.toContain(request.type);
    expect(new URL(request.url).search).toBe('');
  }
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
      search: location.search,
      hash: location.hash,
    })),
  ).toEqual({ local: [], session: [], search: '', hash: '' });
  await page.screenshot({
    path: testInfo.outputPath('json-convert.png'),
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Formatar JSON', exact: true })
    .click();
  await expect(page.getByLabel('Resultado JSON', { exact: true })).toHaveValue(
    JSON.stringify(JSON.parse(input), null, 2),
  );
  await expect(
    page.getByRole('button', { name: 'Baixar JSON', exact: true }),
  ).toBeEnabled();
});

test('XML é parseável independentemente com chaves arbitrárias e CR preservado', async ({
  page,
}) => {
  await convert(
    page,
    'XML',
    JSON.stringify({
      '<a>\t\n\r': '<img src=x onerror=alert(1)>\ré😀',
      items: [null, {}, []],
    }),
  );
  const output = await page
    .getByLabel('Resultado XML', { exact: true })
    .inputValue();
  const parsed = await page.evaluate((xml) => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    return {
      errors: doc.querySelectorAll('parsererror').length,
      root: doc.documentElement.tagName,
      key: doc.querySelector('entry')?.getAttribute('key'),
      text: doc.querySelector('entry')?.textContent,
      types: Array.from(doc.querySelectorAll('item')).map((node) =>
        node.getAttribute('type'),
      ),
    };
  }, output);
  expect(parsed).toEqual({
    errors: 0,
    root: 'json',
    key: '<a>\t\n\r',
    text: '<img src=x onerror=alert(1)>\ré😀',
    types: ['null', 'object', 'array'],
  });
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
});

test('YAML escapa caracteres não imprimíveis e preserva strings ambíguas', async ({
  page,
}) => {
  await convert(
    page,
    'YAML',
    JSON.stringify({
      data: '2026-10-30',
      bool: 'true',
      unicode: '\u0080\ufffe\ufeff',
    }),
  );
  const value = await page
    .getByLabel('Resultado YAML', { exact: true })
    .inputValue();
  expect(value).toContain('"data": "2026-10-30"');
  expect(value).toContain('"bool": "true"');
  expect(value).toContain('"unicode": "\\u0080\\ufffe\\ufeff"');
});

test('erros de forma, fórmula e XML preservam entrada sem saída antiga', async ({
  page,
}) => {
  for (const [format, source, message] of [
    ['CSV', '[1]', 'Para CSV'],
    ['CSV', '{"text":"=1+2"}', 'fórmula'],
    ['XML', '{"text":"\\u0000"}', 'XML 1.0'],
    ['YAML', '{"text":"\\ud800"}', 'Unicode válido'],
  ] as const) {
    await page.getByLabel('Entrada JSON', { exact: true }).fill(source);
    await page.getByLabel('Formato de conversão').selectOption(format);
    await page
      .getByRole('button', { name: `Converter para ${format}`, exact: true })
      .click();
    await expect(page.getByRole('alert')).toContainText(message);
    await expect(page.getByLabel('Entrada JSON', { exact: true })).toHaveValue(
      source,
    );
    await expect(
      page.getByLabel('Resultado JSON', { exact: true }),
    ).toHaveValue('');
    await expect(
      page.getByRole('button', { name: 'Tela cheia', exact: true }),
    ).toBeDisabled();
  }
});

test('indisponibilidade de Worker é explícita e não bloqueia formatação', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'Worker', {
      configurable: true,
      value: undefined,
    }),
  );
  await page.reload();
  await page.getByLabel('Entrada JSON', { exact: true }).fill('{"x":1}');
  await page
    .getByRole('button', { name: 'Converter para CSV', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'não disponibiliza Worker',
  );
  await page
    .getByRole('button', { name: 'Formatar JSON', exact: true })
    .click();
  await expect(page.getByLabel('Resultado JSON', { exact: true })).toHaveValue(
    '{\n  "x": 1\n}',
  );
});

async function pendingWorker(page: Page) {
  await page.addInitScript(() => {
    class PendingWorker {
      onmessage:
        ((event: { data: { ok: true; value: string } }) => void) | null = null;
      constructor() {
        document.addEventListener('test-late-result', () =>
          this.onmessage?.({ data: { ok: true, value: 'stale' } }),
        );
      }
      postMessage() {
        document.documentElement.setAttribute('data-worker-started', 'yes');
      }
      terminate() {
        document.documentElement.setAttribute('data-worker-terminated', 'yes');
      }
    }
    Object.defineProperty(window, 'Worker', {
      configurable: true,
      value: PendingWorker,
    });
  });
  await page.reload();
  await page.getByLabel('Entrada JSON', { exact: true }).fill('{"x":1}');
  await page
    .getByRole('button', { name: 'Converter para CSV', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-worker-started',
    'yes',
  );
}
test('cancelar, editar e limpar encerram Worker e descartam resposta antiga', async ({
  page,
}) => {
  for (const action of ['cancel', 'edit', 'clear']) {
    await pendingWorker(page);
    if (action === 'cancel')
      await page
        .getByRole('button', { name: 'Cancelar conversão', exact: true })
        .click();
    else if (action === 'edit')
      await page.getByLabel('Entrada JSON', { exact: true }).fill('{"novo":2}');
    else
      await page.getByRole('button', { name: 'Limpar', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-worker-terminated',
      'yes',
    );
    await page.evaluate(() =>
      document.dispatchEvent(new Event('test-late-result')),
    );
    await expect(
      page.getByLabel('Resultado JSON', { exact: true }),
    ).toHaveValue('');
    await expect(
      page.getByRole('button', { name: 'Converter para CSV', exact: true }),
    ).toBeEnabled();
  }
});
test('timeout encerra Worker e permite recuperar a ferramenta', async ({
  page,
}) => {
  await page.clock.install();
  await pendingWorker(page);
  await page.clock.fastForward(5_001);
  await expect(page.getByRole('alert')).toContainText('5 segundos');
  await expect(page.locator('html')).toHaveAttribute(
    'data-worker-terminated',
    'yes',
  );
  await page
    .getByRole('button', { name: 'Formatar JSON', exact: true })
    .click();
  await expect(
    page.getByLabel('Resultado JSON', { exact: true }),
  ).not.toHaveValue('');
});
test('CSV com ponto e vírgula funciona por teclado e UI mantém acessibilidade', async ({
  page,
}) => {
  await page
    .getByLabel('Entrada JSON', { exact: true })
    .fill('{"x":"é😀","y":false}');
  await page.getByLabel('Separador CSV').selectOption(';');
  await page
    .getByRole('button', { name: 'Converter para CSV', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Resultado CSV', { exact: true })).toHaveValue(
    '"x";"y"\n"é😀";"false"\n',
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
