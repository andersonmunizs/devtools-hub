import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { JSON_EXAMPLE } from '../../src/data/json-example';

async function openJson(page: Page) {
  await page.goto('/devtools-hub/ferramentas/json/');
  await expect(page.getByLabel('Entrada JSON', { exact: true })).toBeEnabled();
}

test('home → buscar JSON → formatar/minificar → copiar → limpar', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          document.documentElement.setAttribute('data-test-copied', text);
        },
      },
    });
  });
  await page.goto('/devtools-hub/');
  await page.getByRole('searchbox').fill('pretty print');
  await page.getByRole('link', { name: /Validador e formatador JSON/ }).click();
  await expect(page).toHaveTitle('Validador e formatador JSON — DevTools Hub');
  const input = page.getByLabel('Entrada JSON', { exact: true });
  const output = page.getByLabel('Resultado JSON', { exact: true });
  await expect(
    page.getByRole('button', { name: 'Copiar resultado' }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await expect(input).toHaveValue(JSON_EXAMPLE);
  await expect(output).toHaveValue('');
  await page
    .getByRole('button', { name: 'Formatar JSON', exact: true })
    .click();
  await expect(output).toHaveValue(
    JSON.stringify(JSON.parse(JSON_EXAMPLE), null, 2),
  );
  await page
    .getByRole('button', { name: 'Minificar JSON', exact: true })
    .click();
  await expect(output).toHaveValue(JSON_EXAMPLE);
  await page.getByRole('button', { name: 'Copiar resultado' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Resultado copiado.' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute(
    'data-test-copied',
    JSON_EXAMPLE,
  );
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(output).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Copiar resultado' }),
  ).toBeDisabled();
  await expect(page.locator('.tool-feedback')).toHaveText('');
});

test('cópia real do navegador após ação explícita', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Leitura automatizada de clipboard com permissões é específica de Chromium nesta suíte.',
  );
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openJson(page);
  await page
    .getByLabel('Entrada JSON', { exact: true })
    .fill('{"sintetico":42}');
  await page
    .getByRole('button', { name: 'Minificar JSON', exact: true })
    .click();
  await page.getByRole('button', { name: 'Copiar resultado' }).click();
  await expect(page.locator('.tool-feedback')).toHaveText('Resultado copiado.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '{"sintetico":42}',
  );
});

test('erros preservam entrada e edição invalida resultado antes de executar', async ({
  page,
}) => {
  await openJson(page);
  const input = page.getByLabel('Entrada JSON', { exact: true });
  const output = page.getByLabel('Resultado JSON', { exact: true });
  const format = page.getByRole('button', {
    name: 'Formatar JSON',
    exact: true,
  });
  await format.click();
  await expect(page.getByRole('alert')).toContainText('Insira um JSON');
  await input.fill('{"ativo":true}');
  await format.click();
  await expect(output).toHaveValue('{\n  "ativo": true\n}');
  await input.fill('{"ativo":}');
  await expect(output).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Copiar resultado' }),
  ).toBeDisabled();
  await format.click();
  await expect(page.getByRole('alert')).toContainText('JSON inválido');
  await expect(input).toHaveValue('{"ativo":}');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(output).toHaveValue('');
  await input.fill('null');
  await format.click();
  await expect(output).toHaveValue('null');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('exemplo exige consentimento para substituir conteúdo', async ({
  page,
}) => {
  await openJson(page);
  const input = page.getByLabel('Entrada JSON', { exact: true });
  await input.fill('true');
  await page
    .getByRole('button', { name: 'Formatar JSON', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await expect(input).toHaveValue('true');
  await page
    .getByRole('button', { name: 'Manter entrada', exact: true })
    .click();
  await expect(page.getByLabel('Resultado JSON', { exact: true })).toHaveValue(
    'true',
  );
  await expect(
    page.getByRole('button', { name: 'Exemplo sintético', exact: true }),
  ).toBeFocused();
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Substituir entrada', exact: true })
    .click();
  await expect(input).toHaveValue(JSON_EXAMPLE);
  await expect(page.getByLabel('Resultado JSON', { exact: true })).toHaveValue(
    '',
  );
});

test('clipboard bloqueado oferece seleção manual do resultado', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new DOMException('Cópia bloqueada no teste', 'NotAllowedError');
        },
      },
    });
  });
  await openJson(page);
  await page.getByLabel('Entrada JSON', { exact: true }).fill('[1,2]');
  await page
    .getByRole('button', { name: 'Minificar JSON', exact: true })
    .click();
  await page.getByRole('button', { name: 'Copiar resultado' }).click();
  await expect(page.locator('.tool-feedback')).toContainText(
    'Não foi possível copiar automaticamente',
  );
  await page.getByRole('button', { name: 'Selecionar resultado' }).click();
  const output = page.getByLabel('Resultado JSON', { exact: true });
  await expect(output).toBeFocused();
  expect(
    await output.evaluate((el: HTMLTextAreaElement) =>
      el.value.slice(el.selectionStart, el.selectionEnd),
    ),
  ).toBe('[1,2]');
});

test('limpar durante cópia pendente não restaura saída ou feedback antigo', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: () =>
          new Promise<void>((resolve) => {
            window.addEventListener('test-resolve-copy', () => resolve(), {
              once: true,
            });
          }),
      },
    });
  });
  await openJson(page);
  await page.getByLabel('Entrada JSON', { exact: true }).fill('true');
  await page
    .getByRole('button', { name: 'Formatar JSON', exact: true })
    .click();
  await page.getByRole('button', { name: 'Copiar resultado' }).click();
  await expect(page.getByRole('button', { name: 'Copiando…' })).toBeDisabled();
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  await page.evaluate(() =>
    window.dispatchEvent(new Event('test-resolve-copy')),
  );
  await expect(
    page.getByRole('button', { name: 'Copiar resultado' }),
  ).toBeDisabled();
  await expect(page.getByLabel('Entrada JSON', { exact: true })).toHaveValue(
    '',
  );
  await expect(page.getByLabel('Resultado JSON', { exact: true })).toHaveValue(
    '',
  );
  await expect(page.locator('.tool-feedback')).toHaveText('');
});

test('JSON hostil permanece texto, sem envio, storage ou URL de conteúdo', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await openJson(page);
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  const input =
    '{"__proto__":{"polluted":"sintetico"},"constructor":{"prototype":{"polluted":"sintetico"}},"html":"<img src=x onerror=alert(1)><script>alert(1)</script>","unicode":"Olá, 世界 😀"}';
  await page.getByLabel('Entrada JSON', { exact: true }).fill(input);
  await page
    .getByRole('button', { name: 'Minificar JSON', exact: true })
    .click();
  await expect(page.getByLabel('Resultado JSON', { exact: true })).toHaveValue(
    input,
  );
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => Object.hasOwn(Object.prototype, 'polluted')),
  ).toBe(false);
  expect(page.url()).toBe(
    'http://127.0.0.1:4321/devtools-hub/ferramentas/json/',
  );
  const storage = await page.evaluate(async () => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
    databases:
      typeof indexedDB.databases === 'function'
        ? await indexedDB.databases()
        : [],
    cookie: document.cookie,
  }));
  expect(storage).toEqual({
    local: {},
    session: {},
    databases: [],
    cookie: '',
  });
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
  await page.reload();
  await expect(page.getByLabel('Entrada JSON', { exact: true })).toHaveValue(
    '',
  );
  await expect(page.getByLabel('Resultado JSON', { exact: true })).toHaveValue(
    '',
  );
});

test('limite UTF-8 bloqueia excesso e permite exatamente 1 MiB', async ({
  page,
}) => {
  await openJson(page);
  const input = page.getByLabel('Entrada JSON', { exact: true });
  await input.fill('"' + '😀'.repeat(262144) + '"');
  await expect(
    page.getByRole('button', { name: 'Formatar JSON', exact: true }),
  ).toBeDisabled();
  await expect(page.locator('#json-input-help')).toContainText(
    'Reduza o texto',
  );
  const exact = '"' + 'x'.repeat(1048574) + '"';
  await input.fill(exact);
  await expect(page.locator('#json-input-help')).toHaveText(
    '1.048.576 bytes UTF-8 de 1.048.576 permitidos.',
  );
  await page
    .getByRole('button', { name: 'Minificar JSON', exact: true })
    .click();
  await expect(page.getByLabel('Resultado JSON', { exact: true })).toHaveValue(
    exact,
  );
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  await expect(input).toHaveValue('');
});

test('expansão excessiva preserva entrada e permite minificar', async ({
  page,
}) => {
  await openJson(page);
  const input =
    '['.repeat(1024) +
    '[' +
    Array<string>(5001).fill('0').join(',') +
    ']' +
    ']'.repeat(1024);
  await page.getByLabel('Entrada JSON', { exact: true }).fill(input);
  await page
    .getByRole('button', { name: 'Formatar JSON', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('8 MiB');
  await expect(page.getByLabel('Entrada JSON', { exact: true })).toHaveValue(
    input,
  );
  await expect(page.getByLabel('Resultado JSON', { exact: true })).toHaveValue(
    '',
  );
  await page
    .getByRole('button', { name: 'Minificar JSON', exact: true })
    .click();
  await expect(page.getByLabel('Resultado JSON', { exact: true })).toHaveValue(
    input,
  );
});

test('processamento por teclado com ordem entrada → ações → resultado', async ({
  page,
}) => {
  await openJson(page);
  const input = page.getByLabel('Entrada JSON', { exact: true });
  await input.fill('{"teclado":true}');
  await input.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Formatar JSON', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Resultado JSON', { exact: true })).toHaveValue(
    '{\n  "teclado": true\n}',
  );
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Minificar JSON', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Resultado JSON', { exact: true })).toHaveValue(
    '{"teclado":true}',
  );
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`JSON acessível nos estados vazio, sucesso e erro — ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await openJson(page);
    for (const input of ['', JSON_EXAMPLE, '{"invalido":}']) {
      if (input) {
        await page.getByLabel('Entrada JSON', { exact: true }).fill(input);
        await page
          .getByRole('button', { name: 'Formatar JSON', exact: true })
          .click();
      }
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(result.violations).toEqual([]);
    }
  });
}

test('JSON responsivo e capturas reais, inclusive saída longa', async ({
  page,
}, testInfo) => {
  await openJson(page);
  await page
    .getByLabel('Entrada JSON', { exact: true })
    .fill('"' + 'sintetico'.repeat(250) + '"');
  await page
    .getByRole('button', { name: 'Minificar JSON', exact: true })
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
    await page.getByLabel('Entrada JSON', { exact: true }).fill(JSON_EXAMPLE);
    await page
      .getByRole('button', { name: 'Formatar JSON', exact: true })
      .click();
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({
        path: testInfo.outputPath(`json-${width}.png`),
        fullPage: true,
      });
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({
      path: testInfo.outputPath('json-dark-1440.png'),
      fullPage: true,
    });
    await page.getByLabel('Entrada JSON', { exact: true }).fill('{');
    await page
      .getByRole('button', { name: 'Formatar JSON', exact: true })
      .click();
    await page.screenshot({
      path: testInfo.outputPath('json-error.png'),
      fullPage: true,
    });
  }
});
