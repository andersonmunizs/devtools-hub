import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('catálogo honesto, busca e navegação de privacidade', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/devtools-hub/');
  await expect(page).toHaveTitle(/Ferramentas para dados e debugging/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(
    page.getByText('6 ferramentas encontradas', { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('a[href*="/devtools-hub/ferramentas/json"]'),
  ).toHaveCount(1);
  const search = page.getByRole('searchbox', { name: 'Buscar ferramentas' });
  await search.fill('JSON');
  await expect(
    page.getByRole('heading', { name: 'Nenhuma ferramenta encontrada' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: /Validador e formatador JSON/ }),
  ).toBeVisible();
  await search.fill('sem-correspondencia-sintetica');
  await expect(
    page.getByRole('heading', { name: 'Nenhuma ferramenta encontrada' }),
  ).toBeVisible();
  await search.fill('');
  await expect(
    page.getByText('6 ferramentas encontradas', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Privacidade', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Privacidade, em termos claros.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Voltar ao catálogo' }).click();
  await expect(page).toHaveURL('/devtools-hub/');
  expect(errors).toEqual([]);
});

test('busca não envia ou persiste o termo, nem interpreta HTML', async ({
  page,
}) => {
  await page.goto('/devtools-hub/');
  await expect(page.getByLabel('Tema', { exact: true })).toBeVisible();
  const unexpectedRequests: string[] = [];
  const violations: string[] = [];
  await page.evaluate(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      document.documentElement.setAttribute(
        'data-csp-violation',
        event.violatedDirective,
      );
    });
  });
  page.on('request', (request) => unexpectedRequests.push(request.url()));
  page.on('console', (message) => {
    if (message.type() === 'error') violations.push(message.text());
  });
  const payload = 'sintetico-privacidade-839 <img src=x onerror=alert(1)> 😀';
  await page.getByRole('searchbox').fill(payload);
  await expect(
    page.getByText('Nenhuma ferramenta encontrada', { exact: true }),
  ).toBeVisible();
  expect(page.url()).not.toContain('sintetico');
  await expect(page.locator('img')).toHaveCount(0);
  const storage = await page.evaluate(async () => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    databases:
      typeof indexedDB.databases === 'function'
        ? await indexedDB.databases()
        : [],
    cookie: document.cookie,
  }));
  expect(storage).toEqual({
    local: [],
    session: [],
    databases: [],
    cookie: '',
  });
  expect(unexpectedRequests).toEqual([]);
  await expect(page.locator('html')).not.toHaveAttribute('data-csp-violation');
  await page.reload();
  await expect(page.getByRole('searchbox')).toHaveValue('');
  expect(violations).toEqual([]);
});

test('tema segue sistema, permite escolha e só salva essa preferência', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/devtools-hub/');
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Tema', { exact: true }).selectOption('light');
  await expect(root).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(page.getByLabel('Tema', { exact: true })).toHaveValue('light');
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual({
    'devtools-theme': 'light',
  });
  await page.getByLabel('Tema', { exact: true }).selectOption('system');
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(root).toHaveAttribute('data-theme', 'light');
});

test('tema continua funcionando quando o navegador bloqueia armazenamento', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException(
          'Storage bloqueado para teste sintético',
          'SecurityError',
        );
      },
    });
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/devtools-hub/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Tema', { exact: true }).selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#theme-status')).toContainText(
    'Não foi possível salvar',
  );
});

test('JSON funcional e 404 não apresentam rotas falsas', async ({ page }) => {
  await page.goto('/devtools-hub/ferramentas/json/');
  await expect(page.getByLabel('Entrada JSON', { exact: true })).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Formatar JSON', exact: true }),
  ).toBeEnabled();
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  const response = await page.goto('/devtools-hub/pagina-inexistente/');
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole('heading', { name: 'Página não encontrada.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Voltar ao catálogo' }).click();
  await expect(page).toHaveURL('/devtools-hub/');
});

test('teclado alcança conteúdo e busca', async ({ page }) => {
  await page.goto('/devtools-hub/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Pular para o conteúdo' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.keyboard.type('teste');
  await expect(
    page.getByText('Nenhuma ferramenta encontrada', { exact: true }),
  ).toBeVisible();
});

test('CSP do build restringe rede, execução e objetos', async ({ page }) => {
  await page.goto('/devtools-hub/');
  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content');
  expect(csp).toContain("connect-src 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain('sha256-');
  expect(csp).not.toContain('unsafe-eval');
  expect(csp).not.toContain('unsafe-inline');
  await expect(page.getByLabel('Tema', { exact: true })).toBeVisible();
  await page.getByRole('searchbox').fill('csp');
  await expect(
    page.getByText('Nenhuma ferramenta encontrada', { exact: true }),
  ).toBeVisible();
});

test('páginas têm HTML útil sem JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/devtools-hub/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Validador e formatador JSON/ }),
  ).toBeVisible();
  // Playwright text selectors skip noscript even when JavaScript is disabled.
  await expect(page.locator('noscript .notice')).toBeVisible();
  await expect(page.locator('noscript .notice')).toContainText(
    'Ative o JavaScript para usar a busca.',
  );
  await expect(page.getByLabel('Tema', { exact: true })).toBeHidden();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Privacidade', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Privacidade, em termos claros.',
  );
  await page.goto('http://127.0.0.1:4321/devtools-hub/ferramentas/json/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Validador e formatador JSON',
  );
  await expect(page.getByLabel('Entrada JSON', { exact: true })).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Formatar JSON', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Copiar resultado' }),
  ).toBeDisabled();
  await expect(page.locator('noscript .notice')).toBeVisible();
  await context.close();
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`acessibilidade automática das páginas no tema ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    for (const path of [
      '/devtools-hub/',
      '/devtools-hub/privacidade/',
      '/devtools-hub/ferramentas/json/',
      '/devtools-hub/ferramentas/base64/',
      '/devtools-hub/ferramentas/url/',
      '/devtools-hub/ferramentas/timestamp/',
      '/devtools-hub/ferramentas/uuid/',
      '/devtools-hub/ferramentas/hash/',
      '/devtools-hub/404.html',
    ]) {
      await page.goto(path);
      await expect(page.getByLabel('Tema', { exact: true })).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations, `Acessibilidade de ${path}`).toEqual([]);
    }
  });
}

test('layout sem overflow de 320 a 1440 px e texto ampliado', async ({
  page,
}, testInfo) => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/devtools-hub/');
    await expect(page.getByLabel('Tema', { exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  // A 320 px layout approximates the CSS viewport at 400% zoom on 1280 px.
  // Enlarged text is checked separately; this is not a manual browser-zoom audit.
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto('/devtools-hub/');
  if (testInfo.project.name === 'chromium') {
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({
        path: testInfo.outputPath(`home-${width}.png`),
        fullPage: true,
      });
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.screenshot({
      path: testInfo.outputPath('home-dark-1440.png'),
      fullPage: true,
    });
  }
});
