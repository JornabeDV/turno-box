import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/landing", "/join", "/gyms", "/auth/login", "/auth/register", "/forgot-password", "/reset-password", "/api/auth", "/api/forgot-password", "/api/reset-password", "/api/webhooks", "/api/cron", "/offline"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  if (!req.auth?.user) {
    // Root sin sesión → landing page
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/landing", req.url));
    }
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (req.auth.user as { role?: string }).role;

  // Admin y coach que llegan a "/" → redirigir a su dashboard
  if (pathname === "/") {
    if (role === "ADMIN") return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    if (role === "COACH") return NextResponse.redirect(new URL("/dashboard/coach", req.url));
  }

  if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (
    pathname.startsWith("/dashboard/coach") &&
    !["ADMIN", "COACH"].includes(role ?? "")
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|.*\\.png$|manifest\\.json).*)"],
};
