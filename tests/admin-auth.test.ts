import test from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, isValidSessionToken } from "../lib/admin-auth.ts";
import {
  isValidAdminPasswordHashFormat,
  hashAdminPassword,
  normalizeAdminPasswordHash,
  verifyAdminPassword,
} from "../lib/admin-password.ts";
import { getAdminPasswordHashFingerprint } from "../lib/admin-fingerprint.ts";

test("session token accepts an untampered token and rejects tampering and expiry", async () => {
  process.env.SESSION_SECRET =
    "test-secret-that-is-at-least-32-characters-long";
  const now = Date.now();
  const token = await createSessionToken(now);
  assert.equal(await isValidSessionToken(token, now), true);
  assert.equal(await isValidSessionToken(`${token}x`, now), false);
  assert.equal(
    await isValidSessionToken(token, now + 8 * 60 * 60 * 1000 + 1),
    false,
  );
});

test("password hash verifies only the original password", async () => {
  const hash = await hashAdminPassword("correct horse battery staple");
  assert.equal(
    await verifyAdminPassword("correct horse battery staple", hash),
    true,
  );
  assert.equal(await verifyAdminPassword("wrong password", hash), false);
});

test("password verification rejects invalid and truncated hashes", async () => {
  assert.equal(await verifyAdminPassword("senha", "invalid"), false);
  assert.equal(
    await verifyAdminPassword("senha", "scrypt$16384$8$1$salt"),
    false,
  );
  const hash = await hashAdminPassword("senha");
  assert.equal(
    await verifyAdminPassword("senha", hash.split("$").slice(0, 5).join("$")),
    false,
  );
});

test("password hash format requires six valid scrypt parts", async () => {
  const hash = await hashAdminPassword("senha");
  assert.equal(isValidAdminPasswordHashFormat(hash), true);
  assert.equal(isValidAdminPasswordHashFormat(`${hash}$extra`), false);
  assert.equal(
    isValidAdminPasswordHashFormat("scrypt$bad$8$1$salt$key"),
    false,
  );
});

test("escaped local hash is normalized to the same logical hash", async () => {
  const hash = await hashAdminPassword("senha");
  const escapedHash = hash.replaceAll("$", "\\$");
  assert.equal(normalizeAdminPasswordHash(escapedHash), hash);
  assert.equal(await verifyAdminPassword("senha", escapedHash), true);
});

test("hash fingerprint is stable without exposing the hash", () => {
  const hash = "scrypt$16384$8$1$salt$key";
  assert.equal(getAdminPasswordHashFingerprint(hash), "7828d3b5e589");
  assert.equal(getAdminPasswordHashFingerprint(""), null);
});
