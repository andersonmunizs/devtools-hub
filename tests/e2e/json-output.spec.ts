import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.goto('/devtools-hub/ferramentas/json/');
  await expect(page.getByLabel('Entrada JSON', { exact: true })).toBeEnabled();
});

test('tela cheia preserva texto, contém foco, oferece cópia manual e fecha com Esc', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('blocked');
        },
      },
    }),
  );
  await page.reload();
  await page.emulateMedia({
    colorScheme: testInfo.project.name === 'firefox' ? 'dark' : 'light',
  });
  const input = page.getByLabel('Entrada JSON', { exact: true });
  await input.fill('{"texto":"<img src=x onerror=alert(1)> é😀"}');
  await page
    .getByRole('button', { name: 'Formatar JSON', exact: true })
    .click();
  const expected = await page
    .getByLabel('Resultado JSON', { exact: true })
    .inputValue();
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.getByRole('button', { name: 'Tela cheia', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box?.x).toBe(0);
  expect(box?.y).toBe(0);
  const viewport = page.viewportSize();
  expect(box?.width).toBe(viewport?.width);
  expect(box?.height).toBe(viewport?.height);
  await expect(
    dialog.getByRole('button', { name: 'Fechar tela cheia' }),
  ).toBeFocused();
  const output = dialog.getByLabel('Resultado JSON expandido');
  await expect(output).toHaveValue(expected);
  await dialog.getByLabel('Quebrar linhas').check();
  await expect(output).toHaveAttribute('wrap', 'soft');
  await expect(output).toHaveValue(expected);
  await dialog
    .getByRole('button', { name: 'Copiar JSON', exact: true })
    .click();
  await expect(dialog.getByRole('status')).toContainText(
    'Não foi possível copiar',
  );
  await dialog.getByRole('button', { name: 'Selecionar JSON' }).click();
  expect(
    await output.evaluate(
      (element: HTMLTextAreaElement) =>
        element.selectionEnd - element.selectionStart,
    ),
  ).toBe(expected.length);
  await output.press('Tab');
  await expect(
    dialog.getByRole('button', { name: 'Fechar tela cheia' }),
  ).toBeFocused();
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
  await page.screenshot({
    path: testInfo.outputPath('json-expanded.png'),
    fullPage: false,
  });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('#json-expanded-output')).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Tela cheia', exact: true }),
  ).toBeFocused();
  await expect(page.getByLabel('Resultado JSON', { exact: true })).toHaveValue(
    expected,
  );
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('validação preserva original e indentação só é aplicada ao formatar', async ({
  page,
}) => {
  const input = page.getByLabel('Entrada JSON', { exact: true });
  const output = page.getByLabel('Resultado JSON', { exact: true });
  await expect(
    page.getByRole('button', { name: 'Tela cheia', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Baixar JSON', exact: true }),
  ).toBeDisabled();
  const source = '{ "id":9007199254740993, "a":1,"a":2 }';
  await input.fill(source);
  await page.getByRole('button', { name: 'Validar JSON', exact: true }).click();
  await expect(output).toHaveValue(source);
  for (const indentation of [3, 4]) {
    await page.getByLabel('Indentação JSON').selectOption(String(indentation));
    await page
      .getByRole('button', { name: 'Formatar JSON', exact: true })
      .click();
    await expect(output).toHaveValue(
      JSON.stringify(JSON.parse(source), null, indentation),
    );
  }
  await input.fill('{');
  await expect(
    page.getByRole('button', { name: 'Tela cheia', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Validar JSON', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('JSON inválido');
  await expect(output).toHaveValue('');
  await expect(input).toHaveValue('{');
});

test('download local preserva exatamente o resultado Unicode e limpar o invalida', async ({
  page,
}) => {
  await page
    .getByLabel('Entrada JSON', { exact: true })
    .fill('{"sintético":"é😀"}');
  await page
    .getByRole('button', { name: 'Formatar JSON', exact: true })
    .click();
  const expected = await page
    .getByLabel('Resultado JSON', { exact: true })
    .inputValue();
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar JSON', exact: true }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe('resultado.json');
  const path = await download.path();
  expect(path).not.toBeNull();
  expect(await readFile(path!, 'utf8')).toBe(expected);
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Baixar JSON', exact: true }),
  ).toBeDisabled();
});

test('falha de download informa alternativa sem perder o resultado', async ({
  page,
}) => {
  await page
    .getByLabel('Entrada JSON', { exact: true })
    .fill('{"exemplo":true}');
  await page
    .getByRole('button', { name: 'Formatar JSON', exact: true })
    .click();
  const expected = await page
    .getByLabel('Resultado JSON', { exact: true })
    .inputValue();
  await page.evaluate(() => {
    URL.createObjectURL = () => {
      throw new Error('unavailable');
    };
  });
  await page.getByRole('button', { name: 'Baixar JSON', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Não foi possível baixar.' }),
  ).toBeVisible();
  await expect(page.getByLabel('Resultado JSON', { exact: true })).toHaveValue(
    expected,
  );
});
