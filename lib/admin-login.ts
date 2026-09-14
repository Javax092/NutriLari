import {
  isValidAdminPasswordHashFormat,
  verifyAdminPassword,
} from "./admin-password.ts";

export async function validateAdminCredentials(
  username: string,
  password: string,
  configuredUser: string | undefined,
  configuredHash: string,
  sessionSecret: string | undefined,
) {
  const normalizedUser = configuredUser?.trim() ?? "";
  const normalizedHash = configuredHash.trim().replace(/^"(.*)"$/, "$1");
  const configurationValid = Boolean(
    normalizedUser &&
    normalizedHash &&
    sessionSecret &&
    isValidAdminPasswordHashFormat(normalizedHash),
  );
  if (!configurationValid) return { valid: false, configurationValid: false };
  return {
    valid:
      username.trim() === normalizedUser &&
      (await verifyAdminPassword(password, normalizedHash)),
    configurationValid: true,
  };
}
