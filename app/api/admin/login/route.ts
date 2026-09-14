import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import {
  createSessionToken,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
} from "@/lib/admin-auth";
import {
  isValidAdminPasswordHashFormat,
  normalizeAdminPasswordHash,
  verifyAdminPassword,
} from "@/lib/admin-password";

export const runtime = "nodejs";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const attempt = failures.get(ip);
  if (attempt && attempt.resetAt > now && attempt.count >= MAX_FAILURES)
    return invalidLogin(request);
  if (attempt && attempt.resetAt <= now) failures.delete(ip);

  const form = await request.formData();
  const username = String(form.get("username") || "").trim();
  const password = String(form.get("password") || "");
  const configuredUser = process.env.ADMIN_USER?.trim() || "";
  const configuredHash = normalizeAdminPasswordHash(
    process.env.ADMIN_PASSWORD_HASH || "",
  );
  const hashFingerprint = configuredHash
    ? createHash("sha256").update(configuredHash).digest("hex").slice(0, 12)
    : null;
  const hashParts = configuredHash.split("$");
  if (
    hashParts.length !== 6 ||
    !isValidAdminPasswordHashFormat(configuredHash)
  ) {
    console.error("Admin auth configuration invalid: malformed password hash", {
      hashAlgorithm: hashParts[0],
      hashParts: hashParts.length,
      hashFingerprint,
    });
    return invalidLogin(request);
  }
  const usernameMatches = username === configuredUser;
  const passwordMatches = await verifyAdminPassword(password, configuredHash);
  console.log("Admin login diagnostic", {
    hasAdminUser: Boolean(configuredUser),
    hasPasswordHash: Boolean(configuredHash),
    hasSessionSecret: Boolean(process.env.SESSION_SECRET),
    hashAlgorithm: hashParts[0],
    hashParts: hashParts.length,
    hashFingerprint,
    usernameMatches,
    passwordMatches,
  });
  const valid = usernameMatches && passwordMatches;
  if (!valid) {
    const current = failures.get(ip);
    failures.set(ip, {
      count: (current?.count || 0) + 1,
      resetAt: current?.resetAt || now + WINDOW_MS,
    });
    return invalidLogin(request);
  }
  failures.delete(ip);
  let sessionToken: string;
  try {
    sessionToken = await createSessionToken();
  } catch {
    console.error("Admin session creation failed", {
      hasSessionSecret: Boolean(process.env.SESSION_SECRET),
      sessionMaxAge: ADMIN_SESSION_MAX_AGE,
    });
    return invalidLogin(request);
  }
  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  console.log("Admin session created", {
    hasSessionSecret: Boolean(process.env.SESSION_SECRET),
    sessionMaxAge: ADMIN_SESSION_MAX_AGE,
  });
  return response;
}

function invalidLogin(request: NextRequest) {
  return NextResponse.redirect(new URL("/admin/login?error=1", request.url));
}
