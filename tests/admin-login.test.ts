import assert from "node:assert/strict";
import test from "node:test";
import { hashAdminPassword } from "../lib/admin-password.ts";
import { validateAdminCredentials } from "../lib/admin-login.ts";

test("login validation accepts the correct user and password", async () => {
  const hash = await hashAdminPassword("correct-password");
  const result = await validateAdminCredentials(
    " admin ",
    "correct-password",
    "admin",
    hash,
    "test-secret-that-is-at-least-32-characters-long",
  );
  assert.deepEqual(result, { valid: true, configurationValid: true });
});

test("login validation rejects wrong credentials", async () => {
  const hash = await hashAdminPassword("correct-password");
  assert.equal(
    (
      await validateAdminCredentials(
        "wrong",
        "correct-password",
        "admin",
        hash,
        "secret",
      )
    ).valid,
    false,
  );
  assert.equal(
    (await validateAdminCredentials("admin", "wrong", "admin", hash, "secret"))
      .valid,
    false,
  );
});

test("login validation distinguishes missing and malformed configuration", async () => {
  const missing = await validateAdminCredentials(
    "admin",
    "password",
    "admin",
    "",
    "secret",
  );
  assert.deepEqual(missing, { valid: false, configurationValid: false });
  const malformed = await validateAdminCredentials(
    "admin",
    "password",
    "admin",
    "invalid",
    "secret",
  );
  assert.deepEqual(malformed, { valid: false, configurationValid: false });
});
