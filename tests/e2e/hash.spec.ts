import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import {
  HASH_EXAMPLE_HEX,
  HASH_EXAMPLE_TEXT,
  HASH_EMPTY_HEX,
} from '../../src/data/hash-example';

async function openHash(page: Page) {
  await page.goto('/devtools-hub/ferramentas/hash/');
  await expect(page.getByLabel('Texto de entrada UTF-8')).toBeEnabled();
}
const reference = (text: string) =>
  createHash('sha256').update(text, 'utf8').digest('hex');

test('catálogo → exemplo → SHA-256 nativo → copiar → limpar', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          document.documentElement.setAttribute('data-test-copied', text);
        },
      },
    }),
  );
  await page.goto('/devtools-hub/');
  await page.getByRole('searchbox').fill('checksum');
  await page.getByRole('link', { name: /SHA-256 de texto UTF-8/ }).click();
  await expect(page).toHaveTitle('SHA-256 de texto UTF-8 — DevTools Hub');
  await expect(page.getByLabel('Texto de entrada UTF-8')).toBeEnabled();
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await expect(page.getByLabel('Texto de entrada UTF-8')).toHaveValue(
    HASH_EXAMPLE_TEXT,
  );
  await page
    .getByRole('button', { name: 'Calcular SHA-256', exact: true })
    .click();
  await expect(page.getByLabel('Hash SHA-256 em hexadecimal')).toHaveValue(
    HASH_EXAMPLE_HEX,
  );
  await page.getByRole('button', { name: 'Copiar resultado' }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-test-copied',
    HASH_EXAMPLE_HEX,
  );
  await expect(page.locator('.tool-feedback')).toHaveText('Resultado copiado.');
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  await expect(page.getByLabel('Texto de entrada UTF-8')).toHaveValue('');
  await expect(page.getByLabel('Hash SHA-256 em hexadecimal')).toHaveValue('');
  await expect(page.getByLabel('Texto de entrada UTF-8')).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Copiar resultado' }),
  ).toBeDisabled();
});

test('vazio, Unicode, espaços, BOM e quebras de linha têm bytes deliberados', async ({
  page,
}) => {
  await openHash(page);
  for (const [text, hash] of [
    ['', HASH_EMPTY_HEX],
    ['Olá, 世界 😀', reference('Olá, 世界 😀')],
    ['é', reference('é')],
    ['e\u0301', reference('e\u0301')],
    ['\uFEFFabc', reference('\uFEFFabc')],
    [' abc ', reference(' abc ')],
    ['abc\r\n', reference('abc\n')],
  ] as const) {
    await page.getByLabel('Texto de entrada UTF-8').fill(text);
    await page
      .getByRole('button', { name: 'Calcular SHA-256', exact: true })
      .click();
    await expect(page.getByLabel('Hash SHA-256 em hexadecimal')).toHaveValue(
      hash,
    );
    await expect(
      page.getByRole('button', { name: 'Copiar resultado' }),
    ).toBeEnabled();
  }
});

for (const action of ['editar', 'limpar', 'exemplo'] as const) {
  for (const outcome of ['resolve', 'reject'] as const) {
    test(`digest pendente: ${action} descarta ${outcome} anterior e permite recuperar`, async ({
      page,
    }) => {
      await page.addInitScript((outcome) => {
        const native = crypto.subtle.digest.bind(crypto.subtle);
        let calls = 0;
        Object.defineProperty(crypto.subtle, 'digest', {
          value: (algorithm: AlgorithmIdentifier, data: BufferSource) => {
            calls += 1;
            document.documentElement.setAttribute(
              'data-test-digest-calls',
              String(calls),
            );
            if (calls > 1) return native(algorithm, data);
            return new Promise<ArrayBuffer>((resolve, reject) =>
              window.addEventListener(
                'test-digest-finish',
                () => {
                  if (outcome === 'reject')
                    reject(
                      new DOMException('Synthetic failure', 'OperationError'),
                    );
                  else native(algorithm, data).then(resolve, reject);
                },
                { once: true },
              ),
            );
          },
        });
      }, outcome);
      await openHash(page);
      const input = page.getByLabel('Texto de entrada UTF-8');
      const calculate = page.getByRole('button', {
        name: 'Calcular SHA-256',
        exact: true,
      });
      await input.fill('entrada sintética anterior');
      await calculate.click();
      await expect(calculate).toBeDisabled();
      await expect(calculate).toHaveAttribute('aria-busy', 'true');
      await expect(page.locator('.tool-feedback')).toContainText(
        'Calculando SHA-256',
      );
      await calculate.evaluate((button: HTMLButtonElement) => button.click());
      await expect(page.locator('html')).toHaveAttribute(
        'data-test-digest-calls',
        '1',
      );
      if (action === 'editar') await input.fill('entrada nova');
      if (action === 'limpar')
        await page.getByRole('button', { name: 'Limpar', exact: true }).click();
      if (action === 'exemplo') {
        await page
          .getByRole('button', { name: 'Exemplo sintético', exact: true })
          .click();
        await page
          .getByRole('button', { name: 'Substituir entrada', exact: true })
          .click();
      }
      await page.evaluate(() =>
        window.dispatchEvent(new Event('test-digest-finish')),
      );
      await expect(calculate).toBeEnabled();
      await expect(page.getByLabel('Hash SHA-256 em hexadecimal')).toHaveValue(
        '',
      );
      await expect(page.locator('.tool-feedback')).toHaveText('');
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(input).toHaveValue(
        action === 'editar'
          ? 'entrada nova'
          : action === 'limpar'
            ? ''
            : HASH_EXAMPLE_TEXT,
      );
      await input.fill(HASH_EXAMPLE_TEXT);
      await calculate.click();
      await expect(page.getByLabel('Hash SHA-256 em hexadecimal')).toHaveValue(
        HASH_EXAMPLE_HEX,
      );
    });
  }
}

for (const mode of ['insecure', 'unsupported'] as const) {
  test(`SubtleCrypto indisponível (${mode}) mostra aviso e desabilita cálculo`, async ({
    page,
  }) => {
    await page.addInitScript((mode) => {
      if (mode === 'insecure')
        Object.defineProperty(window, 'isSecureContext', { value: false });
      else Object.defineProperty(crypto, 'subtle', { value: undefined });
    }, mode);
    await openHash(page);
    await expect(
      page.getByText(/SHA-256 indisponível: use um contexto seguro/),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Calcular SHA-256', exact: true }),
    ).toBeDisabled();
    await expect(page.getByLabel('Hash SHA-256 em hexadecimal')).toHaveValue(
      '',
    );
  });
}

test('digest rejeitado preserva entrada sem saída e permite nova tentativa', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const native = crypto.subtle.digest.bind(crypto.subtle);
    let first = true;
    Object.defineProperty(crypto.subtle, 'digest', {
      value: (algorithm: AlgorithmIdentifier, data: BufferSource) => {
        if (first) {
          first = false;
          return Promise.reject(
            new DOMException('Synthetic failure', 'OperationError'),
          );
        }
        return native(algorithm, data);
      },
    });
  });
  await openHash(page);
  await page.getByLabel('Texto de entrada UTF-8').fill(HASH_EXAMPLE_TEXT);
  await page
    .getByRole('button', { name: 'Calcular SHA-256', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível calcular SHA-256',
  );
  await expect(page.getByLabel('Texto de entrada UTF-8')).toHaveValue(
    HASH_EXAMPLE_TEXT,
  );
  await expect(page.getByLabel('Hash SHA-256 em hexadecimal')).toHaveValue('');
  await page
    .getByRole('button', { name: 'Calcular SHA-256', exact: true })
    .click();
  await expect(page.getByLabel('Hash SHA-256 em hexadecimal')).toHaveValue(
    HASH_EXAMPLE_HEX,
  );
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('limite UTF-8 permite 1 MiB exato e rejeita excesso', async ({ page }) => {
  await openHash(page);
  const input = page.getByLabel('Texto de entrada UTF-8');
  const calculate = page.getByRole('button', {
    name: 'Calcular SHA-256',
    exact: true,
  });
  await input.fill('é'.repeat(524288) + 'a');
  await expect(calculate).toBeDisabled();
  await expect(page.locator('#hash-input-help')).toContainText(
    'Reduza o texto',
  );
  for (const text of ['a'.repeat(1048576), 'é'.repeat(524288)]) {
    await input.fill(text);
    await calculate.click();
    await expect(page.getByLabel('Hash SHA-256 em hexadecimal')).toHaveValue(
      reference(text),
    );
  }
});

test('HTML hostil é texto e hash, sem rede, armazenamento ou URL de conteúdo', async ({
  page,
}) => {
  await openHash(page);
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
    'hash-sintetico-184 <img src="https://example.invalid/x" onerror="document.body.remove()"> 😀';
  await page.getByLabel('Texto de entrada UTF-8').fill(payload);
  await page
    .getByRole('button', { name: 'Calcular SHA-256', exact: true })
    .click();
  await expect(page.getByLabel('Hash SHA-256 em hexadecimal')).toHaveValue(
    reference(payload),
  );
  await expect(page.locator('img')).toHaveCount(0);
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
  expect(page.url()).toBe(
    'http://127.0.0.1:4321/devtools-hub/ferramentas/hash/',
  );
  await expect(page.locator('html')).not.toHaveAttribute('data-test-csp');
  await page.reload();
  await expect(page.getByLabel('Texto de entrada UTF-8')).toBeEnabled();
  await expect(page.getByLabel('Texto de entrada UTF-8')).toHaveValue('');
  await expect(page.getByLabel('Hash SHA-256 em hexadecimal')).toHaveValue('');
});

test('exemplo confirma substituição; cópia bloqueada oferece seleção manual', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new DOMException('Teste', 'NotAllowedError');
        },
      },
    }),
  );
  await openHash(page);
  await page.getByLabel('Texto de entrada UTF-8').fill('manter');
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Manter entrada', exact: true })
    .click();
  await expect(page.getByLabel('Texto de entrada UTF-8')).toHaveValue('manter');
  await page
    .getByRole('button', { name: 'Exemplo sintético', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Substituir entrada', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Calcular SHA-256', exact: true })
    .click();
  await expect(page.getByLabel('Hash SHA-256 em hexadecimal')).toHaveValue(
    HASH_EXAMPLE_HEX,
  );
  await page.getByRole('button', { name: 'Copiar resultado' }).click();
  await page
    .getByRole('button', { name: 'Selecionar resultado', exact: true })
    .click();
  const output = page.getByLabel('Hash SHA-256 em hexadecimal');
  await expect(output).toBeFocused();
  expect(
    await output.evaluate(
      (el: HTMLTextAreaElement) => el.selectionEnd - el.selectionStart,
    ),
  ).toBe(64);
});

test('teclado alcança cálculo e resultado', async ({ page }) => {
  await openHash(page);
  const input = page.getByLabel('Texto de entrada UTF-8');
  await input.fill(HASH_EXAMPLE_TEXT);
  await input.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Calcular SHA-256', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Hash SHA-256 em hexadecimal')).toHaveValue(
    HASH_EXAMPLE_HEX,
  );
});

test('sem JavaScript mantém explicações e controles desabilitados', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4321/devtools-hub/ferramentas/hash/');
    await expect(
      page.getByRole('heading', {
        name: 'SHA-256 de texto UTF-8',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/Ative o JavaScript para calcular SHA-256/),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Calcular SHA-256', exact: true }),
    ).toBeDisabled();
  } finally {
    await context.close();
  }
});

for (const theme of ['light', 'dark'] as const) {
  test(`hash acessível em vazio, sucesso e erro (${theme})`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const native = crypto.subtle.digest.bind(crypto.subtle);
      let calls = 0;
      Object.defineProperty(crypto.subtle, 'digest', {
        value: (algorithm: AlgorithmIdentifier, data: BufferSource) => {
          calls += 1;
          return calls === 2
            ? Promise.reject(new DOMException('Teste', 'OperationError'))
            : native(algorithm, data);
        },
      });
    });
    await page.emulateMedia({ colorScheme: theme });
    await openHash(page);
    for (const state of ['empty', 'success', 'error']) {
      if (state !== 'empty') {
        await page.getByLabel('Texto de entrada UTF-8').fill(HASH_EXAMPLE_TEXT);
        await page
          .getByRole('button', { name: 'Calcular SHA-256', exact: true })
          .click();
        if (state === 'success')
          await expect(
            page.getByLabel('Hash SHA-256 em hexadecimal'),
          ).toHaveValue(HASH_EXAMPLE_HEX);
        else await expect(page.getByRole('alert')).toBeVisible();
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

test('hash responsivo com resultado legível e capturas reais', async ({
  page,
}, testInfo) => {
  await openHash(page);
  await page.getByLabel('Texto de entrada UTF-8').fill(HASH_EXAMPLE_TEXT);
  await page
    .getByRole('button', { name: 'Calcular SHA-256', exact: true })
    .click();
  await expect(page.getByLabel('Hash SHA-256 em hexadecimal')).toHaveValue(
    HASH_EXAMPLE_HEX,
  );
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .getByLabel('Hash SHA-256 em hexadecimal')
        .evaluate(
          (el: HTMLTextAreaElement) => el.scrollWidth <= el.clientWidth + 1,
        ),
    ).toBe(true);
  }
  if (testInfo.project.name === 'chromium') {
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({
        path: testInfo.outputPath(`hash-${width}.png`),
        fullPage: true,
      });
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({
      path: testInfo.outputPath('hash-dark.png'),
      fullPage: true,
    });
  }
});
