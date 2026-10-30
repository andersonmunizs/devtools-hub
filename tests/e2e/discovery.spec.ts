import { expect, test } from '@playwright/test';

test('busca por tarefa, filtros combinados e recuperação sem perder foco', async ({
  page,
}) => {
  await page.goto('/devtools-hub/');
  const search = page.getByRole('searchbox');
  await search.fill('converter data');
  await expect(
    page.getByRole('link', { name: /Conversor de tempo Unix/ }),
  ).toBeVisible();
  await expect(page.locator('.tool-list a')).toHaveCount(1);
  await page.getByRole('button', { name: 'Hashes', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Nenhuma ferramenta encontrada' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Limpar busca e filtros', exact: true })
    .click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');
  await expect(page.locator('.tool-list a')).toHaveCount(6);
  await expect(page.locator('.tool-icon svg')).toHaveCount(6);
  await page
    .getByRole('button', { name: 'Dados e formatos', exact: true })
    .click();
  await expect(page.locator('.tool-list a')).toHaveCount(3);
  await expect(
    page.getByRole('button', { name: 'Dados e formatos', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await search.fill('parametro url');
  await expect(page.locator('.tool-list a')).toHaveCount(1);
  await page.getByRole('link', { name: /Componente de URL/ }).click();
  await expect(page).toHaveURL('/devtools-hub/ferramentas/url/');
});
