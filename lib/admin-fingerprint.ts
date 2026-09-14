import { createHash } from "node:crypto";
import { normalizeAdminPasswordHash } from "./admin-password.ts";

export function getAdminPasswordHashFingerprint(hash: string) {
  const normalizedHash = normalizeAdminPasswordHash(hash);
  return hash
    ? createHash("sha256").update(normalizedHash).digest("hex").slice(0, 12)
    : null;
}
