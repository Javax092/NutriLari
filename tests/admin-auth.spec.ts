import { expect, test } from "@playwright/test";

const baseURL = "http://localhost:3000";

test("admin: redireciona para login, autentica, abre analytics e faz logout", async ({
  page,
}) => {
  await page.goto(`${baseURL}/admin`);
  await expect(page).toHaveURL(/\/admin\/login$/);

  await page.getByLabel("Usuário").fill(process.env.ADMIN_USER || "");
  await page.getByLabel("Senha").fill(process.env.ADMIN_PASSWORD_E2E || "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("link", { name: "Analytics" }).click();
  await expect(page).toHaveURL(/\/admin\/analytics$/);
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto(`${baseURL}/admin`);
  await expect(page).toHaveURL(/\/admin\/login$/);
});
