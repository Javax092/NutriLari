import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  hasAdminConfiguration,
  isValidSessionToken,
} from "@/lib/admin-auth";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login")
    return withAdminHeaders(NextResponse.next());
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (hasAdminConfiguration() && (await isValidSessionToken(token)))
    return withAdminHeaders(NextResponse.next());
  return withAdminHeaders(
    NextResponse.redirect(new URL("/admin/login", request.url)),
  );
}

function withAdminHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export const config = {
  matcher: "/admin/:path*",
};
