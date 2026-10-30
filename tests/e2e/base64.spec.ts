import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  BASE64_EXAMPLE_TEXT,
  BASE64_EXAMPLE_ENCODED,
} from '../../src/data/base64-example';

async function openBase64(page: Page) {
  await page.goto('/devtools-hub/ferramentas/base64/');
  await expect(page.getByLabel('Entrada de texto ou Base64')).toBeEnabled();
}

test('catálogo → Base64 → codificar/decodificar Unicode → copiar → limpar', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          document.documentElement.setAttribute('data-test-copied', text);
        },
      },
    });
  });
  await page.goto('/devtools-hub/');
  await page.getByRole('searchbox').fill('unicode');
  await expect(
    page.getByText('1 ferramenta encontrada', { exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: /Base64 ↔ UTF-8/ }).click();
  await expect(page).toHaveTitle('Base64 ↔ UTF-8 — DevTools Hub');
  const input = page.getByLabel('Entrada de texto ou Base64');
  const output = page.getByLabel('Resultado da conversão');
  await expect(
    page.getByRole('button', { name: 'Copiar resultado' }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await expect(input).toHaveValue(BASE64_EXAMPLE_TEXT);
  await page
    .getByRole('button', { name: 'Codificar em Base64', exact: true })
    .click();
  await expect(output).toHaveValue(BASE64_EXAMPLE_ENCODED);
  await input.fill(BASE64_EXAMPLE_ENCODED);
  await expect(output).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Copiar resultado' }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Decodificar para UTF-8', exact: true })
    .click();
  await expect(output).toHaveValue(BASE64_EXAMPLE_TEXT);
  await page.getByRole('button', { name: 'Copiar resultado' }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-test-copied',
    BASE64_EXAMPLE_TEXT,
  );
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(output).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(page.locator('.tool-feedback')).toHaveText('');
});

test('erros de formato e UTF-8 preservam entrada e não reutilizam saída', async ({
  page,
}) => {
  await openBase64(page);
  const input = page.getByLabel('Entrada de texto ou Base64');
  const output = page.getByLabel('Resultado da conversão');
  const decode = page.getByRole('button', {
    name: 'Decodificar para UTF-8',
    exact: true,
  });
  for (const malformed of ['Zg', 'TR==', ' Zg==', 'AA-_']) {
    await input.fill(malformed);
    await decode.click();
    await expect(page.getByRole('alert')).toContainText('Base64 inválido');
    await expect(input).toHaveValue(malformed);
    await expect(output).toHaveValue('');
    await expect(
      page.getByRole('button', { name: 'Copiar resultado' }),
    ).toBeDisabled();
  }
  await input.fill('/w==');
  await decode.click();
  await expect(page.getByRole('alert')).toContainText('UTF-8 válido');
  await expect(input).toHaveValue('/w==');
  await input.fill('Zg==');
  await decode.click();
  await expect(output).toHaveValue('f');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('vazio é um resultado válido e pode ser copiado explicitamente', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          document.documentElement.setAttribute('data-test-copied', text);
        },
      },
    });
  });
  await openBase64(page);
  for (const label of ['Codificar em Base64', 'Decodificar para UTF-8']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('.tool-feedback')).toContainText(
      'O resultado vazio é válido',
    );
    await expect(
      page.getByRole('button', { name: 'Copiar resultado' }),
    ).toBeEnabled();
    await page.getByRole('button', { name: 'Copiar resultado' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-test-copied', '');
    await page.getByRole('button', { name: 'Limpar', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Copiar resultado' }),
    ).toBeDisabled();
  }
});

test('exemplo preenchido exige confirmação e cópia bloqueada tem alternativa', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new DOMException('Bloqueado no teste', 'NotAllowedError');
        },
      },
    });
  });
  await openBase64(page);
  const input = page.getByLabel('Entrada de texto ou Base64');
  await input.fill('original');
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Manter entrada', exact: true })
    .click();
  await expect(input).toHaveValue('original');
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Substituir entrada', exact: true })
    .click();
  await expect(input).toHaveValue(BASE64_EXAMPLE_TEXT);
  await page
    .getByRole('button', { name: 'Codificar em Base64', exact: true })
    .click();
  await page.getByRole('button', { name: 'Copiar resultado' }).click();
  await expect(page.locator('.tool-feedback')).toContainText(
    'Não foi possível copiar automaticamente',
  );
  await page.getByRole('button', { name: 'Selecionar resultado' }).click();
  const output = page.getByLabel('Resultado da conversão');
  await expect(output).toBeFocused();
  expect(
    await output.evaluate((el: HTMLTextAreaElement) =>
      el.value.slice(el.selectionStart, el.selectionEnd),
    ),
  ).toBe(BASE64_EXAMPLE_ENCODED);
});

test('decodificar HTML continua sendo texto sem rede, storage ou URL de conteúdo', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await openBase64(page);
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  const text = '<img src=x onerror=alert(1)><script>alert(1)</script> Olá 😀';
  const encoded = Buffer.from(text, 'utf8').toString('base64');
  await page.getByLabel('Entrada de texto ou Base64').fill(encoded);
  await page
    .getByRole('button', { name: 'Decodificar para UTF-8', exact: true })
    .click();
  await expect(page.getByLabel('Resultado da conversão')).toHaveValue(text);
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  const storage = await page.evaluate(async () => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
    cookie: document.cookie,
    databases:
      typeof indexedDB.databases === 'function'
        ? await indexedDB.databases()
        : [],
  }));
  expect(storage).toEqual({
    local: {},
    session: {},
    cookie: '',
    databases: [],
  });
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
  expect(page.url()).toBe(
    'http://127.0.0.1:4321/devtools-hub/ferramentas/base64/',
  );
  await page.reload();
  await expect(page.getByLabel('Entrada de texto ou Base64')).toHaveValue('');
  await expect(page.getByLabel('Resultado da conversão')).toHaveValue('');
});

test('limite em bytes, expansão previsível e reuso de saída acima do limite', async ({
  page,
}) => {
  await openBase64(page);
  const input = page.getByLabel('Entrada de texto ou Base64');
  const encode = page.getByRole('button', {
    name: 'Codificar em Base64',
    exact: true,
  });
  const decode = page.getByRole('button', {
    name: 'Decodificar para UTF-8',
    exact: true,
  });
  await input.fill('é'.repeat(524289));
  await expect(encode).toBeDisabled();
  await expect(decode).toBeDisabled();
  await expect(page.locator('#base64-input-help')).toContainText(
    'Reduza o texto',
  );
  await input.fill('a'.repeat(1048576));
  await encode.click();
  const output = await page.getByLabel('Resultado da conversão').inputValue();
  expect(output.length).toBe(1398104);
  expect(output).toBe(Buffer.from('a'.repeat(1048576)).toString('base64'));
  await input.fill(output);
  await expect(decode).toBeDisabled();
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  await input.fill('YWFh'.repeat(262144));
  await decode.click();
  await expect(page.getByLabel('Resultado da conversão')).toHaveValue(
    'a'.repeat(786432),
  );
});

test('teclado alcança as ações e usa BOM sem perda de texto', async ({
  page,
}) => {
  await openBase64(page);
  const input = page.getByLabel('Entrada de texto ou Base64');
  await input.fill('\uFEFFtexto');
  await input.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Codificar em Base64', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  const encoded = await page.getByLabel('Resultado da conversão').inputValue();
  await input.fill(encoded);
  await input.press('Tab');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Decodificar para UTF-8', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Resultado da conversão')).toHaveValue(
    '\uFEFFtexto',
  );
});

test('conteúdo útil e controles honestos sem JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/devtools-hub/ferramentas/base64/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Base64 ↔ UTF-8',
  );
  await expect(page.getByLabel('Entrada de texto ou Base64')).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Codificar em Base64', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Decodificar para UTF-8', exact: true }),
  ).toBeDisabled();
  await expect(page.locator('noscript .notice')).toBeVisible();
  await context.close();
});

test('CRLF original é preservado para copiar, com LF no campo do navegador', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          document.documentElement.setAttribute('data-test-copied', text);
        },
      },
    });
  });
  await openBase64(page);
  const original = 'linha 1\r\nlinha 2\rfim';
  await page
    .getByLabel('Entrada de texto ou Base64')
    .fill(Buffer.from(original, 'utf8').toString('base64'));
  await page
    .getByRole('button', { name: 'Decodificar para UTF-8', exact: true })
    .click();
  expect(await page.getByLabel('Resultado da conversão').inputValue()).toBe(
    'linha 1\nlinha 2\nfim',
  );
  await page.getByRole('button', { name: 'Copiar resultado' }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-test-copied',
    original,
  );
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Base64 acessível vazio/sucesso/erro — ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await openBase64(page);
    for (const input of ['', BASE64_EXAMPLE_ENCODED, '/w==']) {
      if (input) {
        await page.getByLabel('Entrada de texto ou Base64').fill(input);
        await page
          .getByRole('button', { name: 'Decodificar para UTF-8', exact: true })
          .click();
      }
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(result.violations).toEqual([]);
    }
  });
}

test('Base64 responsivo com texto longo e capturas desktop/mobile', async ({
  page,
}, testInfo) => {
  await openBase64(page);
  await page
    .getByLabel('Entrada de texto ou Base64')
    .fill('texto sintético '.repeat(300));
  await page
    .getByRole('button', { name: 'Codificar em Base64', exact: true })
    .click();
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  if (testInfo.project.name === 'chromium') {
    await page
      .getByLabel('Entrada de texto ou Base64')
      .fill(BASE64_EXAMPLE_TEXT);
    await page
      .getByRole('button', { name: 'Codificar em Base64', exact: true })
      .click();
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({
        path: testInfo.outputPath(`base64-${width}.png`),
        fullPage: true,
      });
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({
      path: testInfo.outputPath('base64-dark.png'),
      fullPage: true,
    });
    await page.getByLabel('Entrada de texto ou Base64').fill('/w==');
    await page
      .getByRole('button', { name: 'Decodificar para UTF-8', exact: true })
      .click();
    await page.screenshot({
      path: testInfo.outputPath('base64-error.png'),
      fullPage: true,
    });
  }
});
