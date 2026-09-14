import { getAdminPasswordHashFingerprint } from "../lib/admin-fingerprint.ts";

const hash = process.env.ADMIN_PASSWORD_HASH?.trim() || "";
console.log(`Fingerprint: ${getAdminPasswordHashFingerprint(hash) ?? "none"}`);
