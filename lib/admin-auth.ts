export const ADMIN_SESSION_COOKIE = "larissa_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

function toBase64Url(value: Uint8Array | string) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(
    atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")),
    (character) => character.charCodeAt(0),
  );
}

async function sign(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("SESSION_SECRET ausente ou curto demais.");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)),
    ),
  );
}

export async function createSessionToken(now = Date.now()) {
  const payload = `v1.${Math.floor(now / 1000) + ADMIN_SESSION_MAX_AGE}`;
  return `${toBase64Url(payload)}.${await sign(payload)}`;
}

export async function isValidSessionToken(
  token: string | undefined,
  now = Date.now(),
) {
  if (!token) return false;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;
  try {
    const payload = new TextDecoder().decode(fromBase64Url(encodedPayload));
    const [version, expiresAt] = payload.split(".");
    if (
      version !== "v1" ||
      !Number.isInteger(Number(expiresAt)) ||
      Number(expiresAt) <= Math.floor(now / 1000)
    )
      return false;
    const expected = await sign(payload);
    if (expected.length !== signature.length) return false;
    let difference = 0;
    for (let index = 0; index < expected.length; index++)
      difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
    return difference === 0;
  } catch {
    return false;
  }
}

export function hasAdminConfiguration() {
  return Boolean(
    process.env.ADMIN_USER &&
    process.env.ADMIN_PASSWORD_HASH &&
    process.env.SESSION_SECRET,
  );
}

export async function requireAdminSession() {
  const { cookies } = await import("next/headers");
  const cookie = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!hasAdminConfiguration() || !(await isValidSessionToken(cookie))) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }
}
