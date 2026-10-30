import { expect, test } from '@playwright/test';

const routes = [
  '/devtools-hub/',
  '/devtools-hub/privacidade/',
  '/devtools-hub/ferramentas/json/',
  '/devtools-hub/ferramentas/base64/',
  '/devtools-hub/ferramentas/url/',
  '/devtools-hub/ferramentas/timestamp/',
  '/devtools-hub/ferramentas/uuid/',
  '/devtools-hub/ferramentas/hash/',
  '/devtools-hub/404.html',
] as const;

test('Pages usa canonical e sitemap reais e mantém 404 fora do índice', async ({
  page,
}) => {
  for (const route of routes) {
    await page.goto(route);
    const canonical = page.locator('link[rel="canonical"]');
    if (route.endsWith('404.html')) await expect(canonical).toHaveCount(0);
    else
      await expect(canonical).toHaveAttribute(
        'href',
        `https://andersonmunizs.github.io${route}`,
      );
  }
  const sitemap = await page.request.get('/devtools-hub/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml.match(/<loc>/g)).toHaveLength(8);
  for (const route of routes.filter((route) => !route.endsWith('404.html')))
    expect(xml).toContain(
      `<loc>https://andersonmunizs.github.io${route}</loc>`,
    );
  expect(xml).not.toContain('404');
  expect(
    await (await page.request.get('/devtools-hub/robots.txt')).text(),
  ).toContain(
    'Sitemap: https://andersonmunizs.github.io/devtools-hub/sitemap.xml',
  );
});

test('candidata estática tem metadata única, idioma, CSP e recursos locais', async ({
  page,
}) => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const path of routes) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByLabel('Tema', { exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const title = await page.title();
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(title.length).toBeGreaterThan(10);
    expect(description?.length).toBeGreaterThan(20);
    expect(titles.has(title)).toBe(false);
    expect(descriptions.has(description ?? '')).toBe(false);
    titles.add(title);
    descriptions.add(description ?? '');
    const csp = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain('sha256-');
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/);
    const resources = await page
      .locator('script[src],link[rel="stylesheet"],img[src]')
      .evaluateAll((elements) =>
        elements.map(
          (element) =>
            element.getAttribute('src') ?? element.getAttribute('href') ?? '',
        ),
      );
    for (const resource of resources)
      expect(new URL(resource, page.url()).origin).toBe(
        'http://127.0.0.1:4321',
      );
    if (path === '/devtools-hub/404.html')
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex, nofollow',
      );
    else await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  }
});

test('links internos e âncoras têm destinos reais no build', async ({
  page,
}) => {
  const links = new Set<string>();
  for (const route of routes) {
    await page.goto(route);
    const hrefs = await page
      .locator('a[href]')
      .evaluateAll((elements) =>
        elements.map((element) => (element as HTMLAnchorElement).href),
      );
    hrefs.forEach((href) => links.add(href));
  }
  for (const href of links) {
    const url = new URL(href);
    expect(url.origin).toBe('http://127.0.0.1:4321');
    expect(url.search).toBe('');
    const response = await page.request.get(url.origin + url.pathname);
    expect(response?.status()).toBe(200);
    if (url.hash) {
      await page.goto(href);
      expect(
        await page.evaluate(
          (id) => document.getElementById(id) !== null,
          decodeURIComponent(url.hash.slice(1)),
        ),
      ).toBe(true);
    }
  }
});

test('rotas mantêm reflow com raiz tipográfica ampliada em viewport de 320 px', async ({
  page,
}) => {
  // This checks CSS reflow, not native browser zoom or a screen reader.
  await page.setViewportSize({ width: 320, height: 900 });
  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByLabel('Tema', { exact: true })).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
    const controls = page.locator(
      'main button:visible, main input:visible, main textarea:visible',
    );
    for (const control of await controls.all()) {
      const box = await control.boundingBox();
      expect(box, route).not.toBeNull();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(321);
      }
    }
  }
});
