import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
async function openUuid(page: Page) {
  await page.goto('/ferramentas/uuid/');
  await expect(page.getByLabel('Quantidade de UUIDs')).toBeEnabled();
}
async function mockClipboard(page: Page) {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          document.documentElement.setAttribute('data-test-copied', text);
        },
      },
    }),
  );
}

test('catálogo → exemplo → gerar via Web Crypto → cópia individual e lista → limpar', async ({
  page,
}) => {
  await mockClipboard(page);
  await page.goto('/');
  await page.getByRole('searchbox').fill('guid');
  await page.getByRole('link', { name: /Gerador UUID v4/ }).click();
  await expect(page).toHaveTitle('Gerador UUID v4 — DevTools Hub');
  await expect(page.getByLabel('Quantidade de UUIDs')).toBeEnabled();
  await expect(page.locator('.uuid-list code')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Copiar lista', exact: true }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Exemplo: 3 UUIDs', exact: true })
    .click();
  await expect(page.getByLabel('Quantidade de UUIDs')).toHaveValue('3');
  await expect(page.locator('.uuid-list code')).toHaveCount(0);
  await page.getByRole('button', { name: 'Gerar UUIDs', exact: true }).click();
  await expect(page.locator('.uuid-list code')).toHaveCount(3);
  const values = await page.locator('.uuid-list code').allTextContents();
  values.forEach((value) => expect(value).toMatch(pattern));
  await expect(page.locator('.tool-feedback')).toHaveText('3 UUIDs gerados.');
  await page
    .getByRole('button', { name: 'Copiar UUID 2', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-test-copied',
    values[1] ?? '',
  );
  await expect(page.locator('.tool-feedback')).toHaveText('UUID 2 copiado.');
  await page.getByRole('button', { name: 'Copiar lista', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-test-copied',
    values.join('\n'),
  );
  await expect(page.locator('.tool-feedback')).toHaveText('Lista copiada.');
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  await expect(page.locator('.uuid-list code')).toHaveCount(0);
  await expect(page.getByLabel('Quantidade de UUIDs')).toHaveValue('1');
  await expect(page.getByLabel('Quantidade de UUIDs')).toBeFocused();
  await expect(page.locator('.tool-feedback')).toHaveText('');
});

test('limites 1 e 20; edição invalida a lista e entradas inválidas são preservadas', async ({
  page,
}) => {
  await openUuid(page);
  const count = page.getByLabel('Quantidade de UUIDs');
  const generate = page.getByRole('button', {
    name: 'Gerar UUIDs',
    exact: true,
  });
  for (const value of ['1', '20']) {
    await count.fill(value);
    await generate.click();
    await expect(page.locator('.uuid-list code')).toHaveCount(Number(value));
    (await page.locator('.uuid-list code').allTextContents()).forEach((uuid) =>
      expect(uuid).toMatch(pattern),
    );
  }
  for (const value of [
    '',
    '0',
    '21',
    '100',
    '1.5',
    '01',
    '+1',
    ' 1',
    '1e1',
    'NaN',
  ]) {
    await count.fill(value);
    await expect(page.locator('.uuid-list code')).toHaveCount(0);
    await generate.click();
    await expect(page.getByRole('alert')).toContainText('inteiro de 1 a 20');
    await expect(count).toHaveValue(value);
    await expect(count).toHaveAttribute('aria-invalid', 'true');
    await expect(
      page.getByRole('button', { name: 'Copiar lista', exact: true }),
    ).toBeDisabled();
  }
  await count.fill('2');
  await generate.click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('.uuid-list code')).toHaveCount(2);
});

test('exemplo confirma descarte e permite manter a lista', async ({ page }) => {
  await openUuid(page);
  await page.getByLabel('Quantidade de UUIDs').fill('2');
  await page.getByRole('button', { name: 'Gerar UUIDs', exact: true }).click();
  const values = await page.locator('.uuid-list code').allTextContents();
  await page
    .getByRole('button', { name: 'Exemplo: 3 UUIDs', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Manter quantidade', exact: true })
    .click();
  await expect(page.getByLabel('Quantidade de UUIDs')).toHaveValue('2');
  expect(await page.locator('.uuid-list code').allTextContents()).toEqual(
    values,
  );
  await expect(
    page.getByRole('button', { name: 'Exemplo: 3 UUIDs', exact: true }),
  ).toBeFocused();
  await page
    .getByRole('button', { name: 'Exemplo: 3 UUIDs', exact: true })
    .click();
  await page.getByRole('button', { name: 'Usar exemplo', exact: true }).click();
  await expect(page.getByLabel('Quantidade de UUIDs')).toHaveValue('3');
  await expect(page.getByLabel('Quantidade de UUIDs')).toBeFocused();
  await expect(page.locator('.uuid-list code')).toHaveCount(0);
});

test('falha de clipboard oferece o texto exato para seleção individual ou total', async ({
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
  await openUuid(page);
  await page.getByLabel('Quantidade de UUIDs').fill('3');
  await page.getByRole('button', { name: 'Gerar UUIDs', exact: true }).click();
  const values = await page.locator('.uuid-list code').allTextContents();
  for (const [button, value] of [
    ['Copiar UUID 1', values[0] ?? ''],
    ['Copiar lista', values.join('\n')],
  ] as const) {
    await page.getByRole('button', { name: button, exact: true }).click();
    await expect(page.locator('.tool-feedback')).toContainText(
      'Não foi possível copiar automaticamente',
    );
    const manual = page.getByLabel('Texto para cópia manual');
    await expect(manual).toHaveValue(value ?? '');
    await page
      .getByRole('button', { name: 'Selecionar texto', exact: true })
      .click();
    await expect(manual).toBeFocused();
    expect(
      await manual.evaluate(
        (el: HTMLTextAreaElement) =>
          el.selectionStart === 0 && el.selectionEnd === el.value.length,
      ),
    ).toBe(true);
  }
});

for (const action of ['limpar', 'editar', 'gerar'] as const) {
  test(`cópia pendente não restaura feedback antigo após ${action}`, async ({
    page,
  }) => {
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: () =>
            new Promise<void>((resolve) =>
              window.addEventListener('test-copy-resolve', () => resolve(), {
                once: true,
              }),
            ),
        },
      }),
    );
    await openUuid(page);
    await page
      .getByRole('button', { name: 'Gerar UUIDs', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Copiar lista', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Copiar lista', exact: true }),
    ).toBeDisabled();
    if (action === 'limpar')
      await page.getByRole('button', { name: 'Limpar', exact: true }).click();
    if (action === 'editar')
      await page.getByLabel('Quantidade de UUIDs').fill('2');
    if (action === 'gerar')
      await page
        .getByRole('button', { name: 'Gerar UUIDs', exact: true })
        .click();
    await page.evaluate(() =>
      window.dispatchEvent(new Event('test-copy-resolve')),
    );
    await expect(
      page.getByRole('button', { name: 'Copiar lista', exact: true }),
    ).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('.tool-feedback')).toHaveText(
      action === 'gerar' ? '1 UUID gerado.' : '',
    );
    await expect(page.locator('.uuid-list code')).toHaveCount(
      action === 'gerar' ? 1 : 0,
    );
    await expect(page.getByLabel('Texto para cópia manual')).toHaveCount(0);
  });
}

for (const mode of ['insecure', 'unsupported'] as const) {
  test(`API indisponível (${mode}) impede geração sem fallback`, async ({
    page,
  }) => {
    await page.addInitScript((mode) => {
      if (mode === 'insecure')
        Object.defineProperty(window, 'isSecureContext', { value: false });
      else Object.defineProperty(crypto, 'randomUUID', { value: undefined });
    }, mode);
    await openUuid(page);
    await expect(
      page.getByText(/Geração indisponível: use um contexto seguro/),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Gerar UUIDs', exact: true }),
    ).toBeDisabled();
    await expect(page.locator('.uuid-list code')).toHaveCount(0);
  });
}

test('falha da API durante geração não disponibiliza lista parcial', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const native = crypto.randomUUID.bind(crypto);
    let calls = 0;
    Object.defineProperty(crypto, 'randomUUID', {
      value: () => {
        calls += 1;
        if (calls === 2) throw new Error('Synthetic failure');
        return native();
      },
    });
  });
  await openUuid(page);
  await page.getByLabel('Quantidade de UUIDs').fill('3');
  await page.getByRole('button', { name: 'Gerar UUIDs', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Nenhuma lista parcial');
  await expect(page.locator('.uuid-list code')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Copiar lista', exact: true }),
  ).toBeDisabled();
});

test('gera e copia sem rede, storage ou URL de conteúdo; reload descarta lista', async ({
  page,
}) => {
  await mockClipboard(page);
  await openUuid(page);
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluate(() =>
    document.addEventListener('securitypolicyviolation', () =>
      document.documentElement.setAttribute('data-test-csp', 'violation'),
    ),
  );
  const count = page.getByLabel('Quantidade de UUIDs');
  const payload =
    'uuid-sintetico-781 <img src="https://example.invalid/x" onerror="document.body.remove()">';
  await count.fill(payload);
  await page.getByRole('button', { name: 'Gerar UUIDs', exact: true }).click();
  await expect(count).toHaveValue(payload);
  await expect(page.locator('img')).toHaveCount(0);
  await count.fill('20');
  await page.getByRole('button', { name: 'Gerar UUIDs', exact: true }).click();
  await expect(page.locator('.uuid-list code')).toHaveCount(20);
  await page.getByRole('button', { name: 'Copiar lista', exact: true }).click();
  await expect(page.locator('.tool-feedback')).toHaveText('Lista copiada.');
  expect(
    await page.evaluate(async () => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
      databases: await indexedDB.databases(),
      cookie: document.cookie,
    })),
  ).toEqual({ local: [], session: [], databases: [], cookie: '' });
  expect(page.url()).toBe('http://127.0.0.1:4321/ferramentas/uuid/');
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
  await expect(page.locator('html')).not.toHaveAttribute('data-test-csp');
  await page.reload();
  await expect(count).toBeEnabled();
  await expect(count).toHaveValue('1');
  await expect(page.locator('.uuid-list code')).toHaveCount(0);
});

test('cópia real individual e da lista após ação explícita', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName === 'firefox',
    'Runner Firefox não concede leitura nativa de clipboard.',
  );
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openUuid(page);
  await page.getByLabel('Quantidade de UUIDs').fill('2');
  await page.getByRole('button', { name: 'Gerar UUIDs', exact: true }).click();
  const values = await page.locator('.uuid-list code').allTextContents();
  await page
    .getByRole('button', { name: 'Copiar UUID 1', exact: true })
    .click();
  await expect(page.locator('.tool-feedback')).toHaveText('UUID 1 copiado.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    values[0],
  );
  await page.getByRole('button', { name: 'Copiar lista', exact: true }).click();
  await expect(page.locator('.tool-feedback')).toHaveText('Lista copiada.');
  // Windows may return CRLF from the OS clipboard. The instrumented test above
  // separately verifies the exact LF string passed to writeText.
  const clipboardText = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  expect(clipboardText.replace(/\r\n/g, '\n')).toBe(values.join('\n'));
});

test('teclado gera pelo formulário e alcança cópia individual', async ({
  page,
}) => {
  await mockClipboard(page);
  await openUuid(page);
  const count = page.getByLabel('Quantidade de UUIDs');
  await count.fill('1');
  await count.press('Enter');
  await expect(page.locator('.uuid-list code')).toHaveCount(1);
  await count.focus();
  for (let i = 0; i < 5; i += 1) await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Copiar UUID 1', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.locator('.tool-feedback')).toHaveText('UUID 1 copiado.');
});

test('sem JavaScript mantém conteúdo estático e controles desabilitados', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4321/ferramentas/uuid/');
    await expect(
      page.getByRole('heading', { name: 'Gerador UUID v4', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(/Ative o JavaScript para gerar UUIDs/),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Gerar UUIDs', exact: true }),
    ).toBeDisabled();
  } finally {
    await context.close();
  }
});

for (const theme of ['light', 'dark'] as const) {
  test(`UUID acessível em vazio, sucesso, erro e fallback (${theme})`, async ({
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
    await page.emulateMedia({ colorScheme: theme });
    await openUuid(page);
    for (const state of ['empty', 'success', 'fallback', 'error']) {
      if (state === 'success') {
        await page.getByLabel('Quantidade de UUIDs').fill('3');
        await page
          .getByRole('button', { name: 'Gerar UUIDs', exact: true })
          .click();
      }
      if (state === 'fallback')
        await page
          .getByRole('button', { name: 'Copiar lista', exact: true })
          .click();
      if (state === 'error') {
        await page.getByLabel('Quantidade de UUIDs').fill('21');
        await page
          .getByRole('button', { name: 'Gerar UUIDs', exact: true })
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

test('UUID responsivo de 320 a 1440 px com lista máxima e capturas reais', async ({
  page,
}, testInfo) => {
  await openUuid(page);
  await page.getByLabel('Quantidade de UUIDs').fill('20');
  await page.getByRole('button', { name: 'Gerar UUIDs', exact: true }).click();
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  if (testInfo.project.name === 'chromium') {
    await page.getByLabel('Quantidade de UUIDs').fill('3');
    await page
      .getByRole('button', { name: 'Gerar UUIDs', exact: true })
      .click();
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({
        path: testInfo.outputPath(`uuid-${width}.png`),
        fullPage: true,
      });
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({
      path: testInfo.outputPath('uuid-dark.png'),
      fullPage: true,
    });
    await page.getByLabel('Quantidade de UUIDs').fill('21');
    await page
      .getByRole('button', { name: 'Gerar UUIDs', exact: true })
      .click();
    await page.screenshot({
      path: testInfo.outputPath('uuid-error.png'),
      fullPage: true,
    });
  }
});
