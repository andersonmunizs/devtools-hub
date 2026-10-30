import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  TIMESTAMP_EXAMPLE_SECONDS,
  TIMESTAMP_EXAMPLE_MILLISECONDS,
  TIMESTAMP_EXAMPLE_ISO,
} from '../../src/data/timestamp-example';

test.use({ timezoneId: 'America/Cuiaba' });

async function openTimestamp(page: Page) {
  await page.goto('/devtools-hub/ferramentas/timestamp/');
  await expect(page.getByLabel('Timestamp Unix de entrada')).toBeEnabled();
}

test('catálogo → exemplo → segundos e milissegundos → copiar → limpar', async ({
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
  await page.getByRole('searchbox').fill('epoch');
  await page.getByRole('link', { name: /Conversor de tempo Unix/ }).click();
  await expect(page).toHaveTitle('Conversor de tempo Unix — DevTools Hub');
  const input = page.getByLabel('Timestamp Unix de entrada');
  const output = page.getByLabel('Datas e valores Unix');
  await expect(input).toBeEnabled();
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await expect(input).toHaveValue(TIMESTAMP_EXAMPLE_SECONDS);
  await page
    .getByRole('button', { name: 'Converter segundos', exact: true })
    .click();
  const result = await output.inputValue();
  expect(result).toContain(`UTC (ISO 8601): ${TIMESTAMP_EXAMPLE_ISO}`);
  expect(result).toContain('Horário no navegador (America/Cuiaba):');
  expect(result).toContain('18:13:20');
  expect(result).toContain('GMT-04:00');
  expect(result).toContain(
    `Unix em milissegundos: ${TIMESTAMP_EXAMPLE_MILLISECONDS}`,
  );
  await input.fill(TIMESTAMP_EXAMPLE_MILLISECONDS);
  await expect(output).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Copiar resultado' }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Converter milissegundos', exact: true })
    .click();
  await expect(output).toHaveValue(result);
  await page.getByRole('button', { name: 'Copiar resultado' }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-test-copied',
    result,
  );
  await expect(page.locator('.tool-feedback')).toContainText(
    'Resultado copiado',
  );
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(output).toHaveValue('');
  await expect(input).toBeFocused();
});

test('erros preservam entrada; vazio não é zero e precisão não é truncada', async ({
  page,
}) => {
  await openTimestamp(page);
  const input = page.getByLabel('Timestamp Unix de entrada');
  const output = page.getByLabel('Datas e valores Unix');
  const seconds = page.getByRole('button', {
    name: 'Converter segundos',
    exact: true,
  });
  for (const value of ['', 'NaN', 'Infinity', '1e3', '1.0001', '1\n']) {
    await input.fill(value);
    await seconds.click();
    await expect(page.getByRole('alert')).toContainText('Informe segundos');
    await expect(input).toHaveValue(value);
    await expect(output).toHaveValue('');
    await expect(
      page.getByRole('button', { name: 'Copiar resultado' }),
    ).toBeDisabled();
  }
  await input.fill('8640000000000.001');
  await seconds.click();
  await expect(page.getByRole('alert')).toContainText('fora da faixa');
  await input.fill('1.001');
  await page
    .getByRole('button', { name: 'Converter milissegundos', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('milissegundos inteiros');
  await seconds.click();
  expect(await output.inputValue()).toContain('1970-01-01T00:00:01.001Z');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await input.fill('-0.001');
  await seconds.click();
  expect(await output.inputValue()).toContain('1969-12-31T23:59:59.999Z');
  expect(await output.inputValue()).toContain('Unix em milissegundos: -1');
});

test('a unidade vem do botão, com fronteiras e datas estendidas explícitas', async ({
  page,
}) => {
  await openTimestamp(page);
  const input = page.getByLabel('Timestamp Unix de entrada');
  const output = page.getByLabel('Datas e valores Unix');
  await input.fill('1');
  await page
    .getByRole('button', { name: 'Converter segundos', exact: true })
    .click();
  expect(await output.inputValue()).toContain('1970-01-01T00:00:01.000Z');
  await page
    .getByRole('button', { name: 'Converter milissegundos', exact: true })
    .click();
  expect(await output.inputValue()).toContain('1970-01-01T00:00:00.001Z');
  for (const [value, iso] of [
    ['8640000000000000', '+275760-09-13T00:00:00.000Z'],
    ['-8640000000000000', '-271821-04-20T00:00:00.000Z'],
  ]) {
    await input.fill(value ?? '');
    await page
      .getByRole('button', { name: 'Converter milissegundos', exact: true })
      .click();
    expect(await output.inputValue()).toContain(iso);
  }
});

test('fuso do contexto e horário de verão refletem o instante sem deslocamento fixo', async ({
  browser,
}) => {
  for (const [zone, cases] of [
    [
      'America/New_York',
      [
        ['1710053999000', '01:59:59', 'GMT-05:00'],
        ['1710054000000', '03:00:00', 'GMT-04:00'],
        ['1730611800000', '01:30:00', 'GMT-04:00'],
        ['1730615400000', '01:30:00', 'GMT-05:00'],
      ],
    ],
    ['Asia/Colombo', [['0', '05:30:00', 'GMT+05:30']]],
  ] as const) {
    const context = await browser.newContext({ timezoneId: zone });
    const page = await context.newPage();
    try {
      await page.goto(
        'http://127.0.0.1:4321/devtools-hub/ferramentas/timestamp/',
      );
      await expect(page.getByLabel('Timestamp Unix de entrada')).toBeEnabled();
      for (const [input, time, offset] of cases) {
        await page.getByLabel('Timestamp Unix de entrada').fill(input);
        await page
          .getByRole('button', { name: 'Converter milissegundos', exact: true })
          .click();
        const value = await page
          .getByLabel('Datas e valores Unix')
          .inputValue();
        expect(value).toContain(`Horário no navegador (${zone}):`);
        expect(value).toContain(time);
        expect(value).toContain(offset);
      }
    } finally {
      await context.close();
    }
  }
});

test('exemplo exige confirmação; falha de cópia tem seleção manual', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new DOMException('Teste', 'NotAllowedError');
        },
      },
    });
  });
  await openTimestamp(page);
  const input = page.getByLabel('Timestamp Unix de entrada');
  await input.fill('123');
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Manter entrada', exact: true })
    .click();
  await expect(input).toHaveValue('123');
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Substituir entrada', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Converter segundos', exact: true })
    .click();
  await page.getByRole('button', { name: 'Copiar resultado' }).click();
  await expect(page.locator('.tool-feedback')).toContainText(
    'Não foi possível copiar automaticamente',
  );
  await page
    .getByRole('button', { name: 'Selecionar resultado', exact: true })
    .click();
  const output = page.getByLabel('Datas e valores Unix');
  await expect(output).toBeFocused();
  expect(
    await output.evaluate(
      (el: HTMLTextAreaElement) =>
        el.selectionStart === 0 && el.selectionEnd === el.value.length,
    ),
  ).toBe(true);
});

test('input hostil e resultado não geram rede, storage, URL ou execução', async ({
  page,
}) => {
  await openTimestamp(page);
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluate(() =>
    document.addEventListener('securitypolicyviolation', () =>
      document.documentElement.setAttribute('data-test-csp', 'violation'),
    ),
  );
  const payload =
    'timestamp-sintetico-742 <img src="https://example.invalid/x" onerror="document.body.remove()">';
  await page.getByLabel('Timestamp Unix de entrada').fill(payload);
  await page
    .getByRole('button', { name: 'Converter segundos', exact: true })
    .click();
  await expect(page.getByLabel('Timestamp Unix de entrada')).toHaveValue(
    payload,
  );
  await expect(page.getByRole('alert')).toContainText('Informe segundos');
  await expect(page.locator('img')).toHaveCount(0);
  await page
    .getByLabel('Timestamp Unix de entrada')
    .fill(TIMESTAMP_EXAMPLE_SECONDS);
  await page
    .getByRole('button', { name: 'Converter segundos', exact: true })
    .click();
  expect(await page.getByLabel('Datas e valores Unix').inputValue()).toContain(
    TIMESTAMP_EXAMPLE_ISO,
  );
  expect(page.url()).toBe(
    'http://127.0.0.1:4321/devtools-hub/ferramentas/timestamp/',
  );
  expect(
    await page.evaluate(async () => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
      databases: await indexedDB.databases(),
      cookie: document.cookie,
    })),
  ).toEqual({ local: [], session: [], databases: [], cookie: '' });
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
  await expect(page.locator('html')).not.toHaveAttribute('data-test-csp');
  await page.reload();
  await expect(page.getByLabel('Timestamp Unix de entrada')).toBeEnabled();
  await expect(page.getByLabel('Timestamp Unix de entrada')).toHaveValue('');
  await expect(page.getByLabel('Datas e valores Unix')).toHaveValue('');
});

test('limite de 1 MiB em bytes é mantido sem parse de número gigante', async ({
  page,
}) => {
  await openTimestamp(page);
  const input = page.getByLabel('Timestamp Unix de entrada');
  await input.fill('é'.repeat(524288) + 'a');
  await expect(
    page.getByRole('button', { name: 'Converter segundos', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Converter milissegundos', exact: true }),
  ).toBeDisabled();
  await expect(page.locator('#timestamp-input-help')).toContainText(
    'Reduza o texto',
  );
  await input.fill('0'.repeat(1048576));
  await page
    .getByRole('button', { name: 'Converter segundos', exact: true })
    .click();
  expect(await page.getByLabel('Datas e valores Unix').inputValue()).toContain(
    '1970-01-01T00:00:00.000Z',
  );
  await input.fill('9'.repeat(1048576));
  await page
    .getByRole('button', { name: 'Converter segundos', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('fora da faixa');
});

test('ações de teclado operam zero e data negativa', async ({ page }) => {
  await openTimestamp(page);
  const input = page.getByLabel('Timestamp Unix de entrada');
  await input.fill('0');
  await input.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Converter segundos', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await page.getByLabel('Datas e valores Unix').inputValue()).toContain(
    '1970-01-01T00:00:00.000Z',
  );
  await input.fill('-1');
  await input.press('Tab');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Converter milissegundos', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Space');
  expect(await page.getByLabel('Datas e valores Unix').inputValue()).toContain(
    '1969-12-31T23:59:59.999Z',
  );
});

test('fuso indisponível retorna erro sem fallback silencioso', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(Intl, 'DateTimeFormat', {
      value: class {
        constructor() {
          throw new RangeError('Indisponível no teste');
        }
      },
    }),
  );
  await openTimestamp(page);
  await page.getByLabel('Timestamp Unix de entrada').fill('0');
  await page
    .getByRole('button', { name: 'Converter segundos', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('Nenhum fuso substituto');
  await expect(page.getByLabel('Datas e valores Unix')).toHaveValue('');
});

test('sem JavaScript mantém conteúdo e controles desabilitados', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(
      'http://127.0.0.1:4321/devtools-hub/ferramentas/timestamp/',
    );
    await expect(
      page.getByRole('heading', {
        name: 'Conversor de tempo Unix',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/Ative o JavaScript para converter/),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Converter segundos', exact: true }),
    ).toBeDisabled();
  } finally {
    await context.close();
  }
});

for (const theme of ['light', 'dark'] as const) {
  test(`timestamp acessível nos estados vazio, sucesso e erro (${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openTimestamp(page);
    for (const input of [null, TIMESTAMP_EXAMPLE_SECONDS, 'NaN']) {
      if (input !== null) {
        await page.getByLabel('Timestamp Unix de entrada').fill(input);
        await page
          .getByRole('button', { name: 'Converter segundos', exact: true })
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

test('timestamp responsivo e capturas reais em claro e escuro', async ({
  page,
}, testInfo) => {
  await openTimestamp(page);
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Converter segundos', exact: true })
    .click();
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page
        .getByLabel('Datas e valores Unix')
        .evaluate(
          (el: HTMLTextAreaElement) => el.scrollWidth <= el.clientWidth + 1,
        ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  if (testInfo.project.name === 'chromium') {
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({
        path: testInfo.outputPath(`timestamp-${width}.png`),
        fullPage: true,
      });
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({
      path: testInfo.outputPath('timestamp-dark.png'),
      fullPage: true,
    });
    await page.getByLabel('Timestamp Unix de entrada').fill('NaN');
    await page
      .getByRole('button', { name: 'Converter segundos', exact: true })
      .click();
    await page.screenshot({
      path: testInfo.outputPath('timestamp-error.png'),
      fullPage: true,
    });
  }
});
