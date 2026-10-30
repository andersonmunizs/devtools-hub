import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  URL_EXAMPLE_TEXT,
  URL_EXAMPLE_ENCODED,
} from '../../src/data/url-example';

async function openUrl(page: Page) {
  await page.goto('/devtools-hub/ferramentas/url/');
  await expect(page.getByLabel('Entrada do componente')).toBeEnabled();
}

test('catálogo → componente → exemplo → converter → copiar → limpar', async ({
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
  await page.getByRole('searchbox').fill('percent-encoding');
  await page.getByRole('link', { name: /Componente de URL/ }).click();
  await expect(page).toHaveTitle('Componente de URL — DevTools Hub');
  const input = page.getByLabel('Entrada do componente');
  const output = page.getByLabel('Resultado da conversão');
  await expect(input).toBeEnabled();
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await expect(input).toHaveValue(URL_EXAMPLE_TEXT);
  await page
    .getByRole('button', { name: 'Codificar componente', exact: true })
    .click();
  await expect(output).toHaveValue(URL_EXAMPLE_ENCODED);
  await input.fill(URL_EXAMPLE_ENCODED);
  await expect(output).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Copiar resultado' }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Decodificar componente', exact: true })
    .click();
  await expect(output).toHaveValue(URL_EXAMPLE_TEXT);
  await page.getByRole('button', { name: 'Copiar resultado' }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-test-copied',
    URL_EXAMPLE_TEXT,
  );
  await expect(page.locator('.tool-feedback')).toContainText(
    'Resultado copiado',
  );
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(output).toHaveValue('');
  await expect(input).toBeFocused();
});

test('erros são explícitos e não reutilizam resultado; uma camada e + literal', async ({
  page,
}) => {
  await openUrl(page);
  const input = page.getByLabel('Entrada do componente');
  const output = page.getByLabel('Resultado da conversão');
  const decode = page.getByRole('button', {
    name: 'Decodificar componente',
    exact: true,
  });
  await input.fill('a+b%20c%2520');
  await decode.click();
  await expect(output).toHaveValue('a+b c%20');
  for (const value of ['%', '%2', '%GG', '%FF', '%ED%A0%80']) {
    await input.fill(value);
    await decode.click();
    await expect(page.getByRole('alert')).toContainText('Componente inválido');
    await expect(input).toHaveValue(value);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(output).toHaveValue('');
    await expect(
      page.getByRole('button', { name: 'Copiar resultado' }),
    ).toBeDisabled();
  }
  await input.fill('%2520');
  await decode.click();
  await expect(output).toHaveValue('%20');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('vazio é válido nas duas direções', async ({ page }) => {
  await openUrl(page);
  for (const action of ['Codificar componente', 'Decodificar componente']) {
    await page.getByRole('button', { name: action, exact: true }).click();
    await expect(page.getByLabel('Resultado da conversão')).toHaveValue('');
    await expect(page.locator('.tool-feedback')).toContainText(
      'O resultado vazio é válido',
    );
    await expect(
      page.getByRole('button', { name: 'Copiar resultado' }),
    ).toBeEnabled();
  }
});

test('exemplo exige confirmação e falha de clipboard oferece seleção', async ({
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
  await openUrl(page);
  const input = page.getByLabel('Entrada do componente');
  await input.fill('manter');
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Manter entrada', exact: true })
    .click();
  await expect(input).toHaveValue('manter');
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Substituir entrada', exact: true })
    .click();
  await expect(input).toHaveValue(URL_EXAMPLE_TEXT);
  await page
    .getByRole('button', { name: 'Codificar componente', exact: true })
    .click();
  await page.getByRole('button', { name: 'Copiar resultado' }).click();
  await page
    .getByRole('button', { name: 'Selecionar resultado', exact: true })
    .click();
  const output = page.getByLabel('Resultado da conversão');
  await expect(output).toBeFocused();
  expect(
    await output.evaluate(
      (element: HTMLTextAreaElement) =>
        element.selectionEnd - element.selectionStart,
    ),
  ).toBe(URL_EXAMPLE_ENCODED.length);
});

test('HTML e links decodificados são texto sem requests, persistência ou execução', async ({
  page,
}) => {
  await openUrl(page);
  await page.evaluate(() =>
    document.addEventListener('securitypolicyviolation', () => {
      document.documentElement.setAttribute('data-test-csp', 'violation');
    }),
  );
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('pageerror', (error) => errors.push(error.message));
  const payload =
    'url-sintetico-183 <img src="https://example.invalid/x" onerror="document.body.remove()"> javascript:alert(1)';
  await page
    .getByLabel('Entrada do componente')
    .fill(encodeURIComponent(payload));
  await page
    .getByRole('button', { name: 'Decodificar componente', exact: true })
    .click();
  await expect(page.getByLabel('Resultado da conversão')).toHaveValue(payload);
  await expect(page.locator('img')).toHaveCount(0);
  expect(page.url()).not.toContain('sintetico');
  const storage = await page.evaluate(async () => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    databases: await indexedDB.databases(),
    cookie: document.cookie,
  }));
  expect(storage).toEqual({
    local: [],
    session: [],
    databases: [],
    cookie: '',
  });
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
  await expect(page.locator('html')).not.toHaveAttribute('data-test-csp');
  await page.reload();
  await expect(page.getByLabel('Entrada do componente')).toBeEnabled();
  await expect(page.getByLabel('Entrada do componente')).toHaveValue('');
  await expect(page.getByLabel('Resultado da conversão')).toHaveValue('');
});

test('limite de entrada e expansão máxima sem truncar', async ({ page }) => {
  await openUrl(page);
  const input = page.getByLabel('Entrada do componente');
  const encode = page.getByRole('button', {
    name: 'Codificar componente',
    exact: true,
  });
  const decode = page.getByRole('button', {
    name: 'Decodificar componente',
    exact: true,
  });
  await input.fill('é'.repeat(524288) + 'a');
  await expect(encode).toBeDisabled();
  await expect(decode).toBeDisabled();
  await expect(page.locator('#url-input-help')).toContainText('Reduza o texto');
  await input.fill('%'.repeat(1048576));
  await encode.click();
  const result = await page.getByLabel('Resultado da conversão').inputValue();
  expect(result).toBe('%25'.repeat(1048576));
  await input.fill(result);
  await expect(decode).toBeDisabled();
  await input.fill('%41'.repeat(349525) + 'a');
  await decode.click();
  expect(await page.getByLabel('Resultado da conversão').inputValue()).toBe(
    'A'.repeat(349525) + 'a',
  );
});

test('teclado converte e copia CR/CRLF original, preservando BOM', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          document.documentElement.setAttribute(
            'data-test-copied',
            JSON.stringify(text),
          );
        },
      },
    });
  });
  await openUrl(page);
  const input = page.getByLabel('Entrada do componente');
  await input.fill('\uFEFFtexto');
  await input.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Codificar componente', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Resultado da conversão')).toHaveValue(
    '%EF%BB%BFtexto',
  );
  await input.fill('%EF%BB%BFa%0Db%0D%0Ac');
  await input.press('Tab');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Decodificar componente', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Copiar resultado' }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-test-copied',
    JSON.stringify('\uFEFFa\rb\r\nc'),
  );
});

test('sem JavaScript mantém explicações e desabilita ações', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4321/devtools-hub/ferramentas/url/');
    await expect(
      page.getByRole('heading', { name: 'Componente de URL', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(/Ative o JavaScript para codificar/),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Codificar componente', exact: true }),
    ).toBeDisabled();
    await expect(page.getByLabel('Entrada do componente')).toBeDisabled();
  } finally {
    await context.close();
  }
});

for (const theme of ['light', 'dark'] as const) {
  test(`URL acessível em vazio, sucesso e erro (${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openUrl(page);
    for (const input of [null, URL_EXAMPLE_ENCODED, '%FF']) {
      if (input !== null) {
        await page.getByLabel('Entrada do componente').fill(input);
        await page
          .getByRole('button', { name: 'Decodificar componente', exact: true })
          .click();
      }
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
  });
}

test('URL responsivo com saída longa e capturas reais', async ({
  page,
}, testInfo) => {
  await openUrl(page);
  await page
    .getByLabel('Entrada do componente')
    .fill('texto sintético & '.repeat(300));
  await page
    .getByRole('button', { name: 'Codificar componente', exact: true })
    .click();
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  if (testInfo.project.name === 'chromium') {
    await page.getByLabel('Entrada do componente').fill(URL_EXAMPLE_TEXT);
    await page
      .getByRole('button', { name: 'Codificar componente', exact: true })
      .click();
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({
        path: testInfo.outputPath(`url-${width}.png`),
        fullPage: true,
      });
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({
      path: testInfo.outputPath('url-dark.png'),
      fullPage: true,
    });
    await page.getByLabel('Entrada do componente').fill('%FF');
    await page
      .getByRole('button', { name: 'Decodificar componente', exact: true })
      .click();
    await page.screenshot({
      path: testInfo.outputPath('url-error.png'),
      fullPage: true,
    });
  }
});
