import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicPaths = ["/login", "/healthz"];

function hasRoleAccess(pathname: string, role: string | undefined) {
  if (!role) {
    return false;
  }

  if (role === "owner") {
    return true;
  }

  if (role === "sales") {
    if (pathname.startsWith("/staff")) {
      return false;
    }

    return !pathname.startsWith("/finance/") || pathname === "/finance";
  }

  if (role === "photographer") {
    const orderDetailOnly = /^\/orders\/[^/]+$/.test(pathname);
    if (
      pathname === "/" ||
      pathname === "/schedule" ||
      pathname === "/alerts" ||
      pathname === "/orders" ||
      orderDetailOnly
    ) {
      return true;
    }

    return false;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("ty_role")?.value;
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (!role && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (role && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isPublic && !hasRoleAccess(pathname, role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
