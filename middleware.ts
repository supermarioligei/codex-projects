import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/auth";
import { getDefaultRouteForRole } from "@/lib/ui";

const publicPaths = ["/login", "/healthz"];

function hasRoleAccess(pathname: string, role: string | undefined) {
  if (!role) {
    return false;
  }

  if (role === "owner") {
    return true;
  }

  if (role === "sales") {
    return pathname === "/orders" || pathname.startsWith("/orders/") || pathname === "/alerts";
  }

  if (role === "production_manager") {
    return (
      pathname === "/orders" ||
      pathname.startsWith("/orders/") ||
      pathname === "/clothing" ||
      pathname === "/schedule" ||
      pathname === "/alerts" ||
      pathname === "/delivery"
    );
  }

  if (role === "finance_director") {
    return pathname === "/orders" || pathname.startsWith("/orders/") || pathname === "/finance" || pathname.startsWith("/finance/");
  }

  if (role === "delivery_manager") {
    return (
      pathname === "/orders" ||
      pathname.startsWith("/orders/") ||
      pathname === "/schedule" ||
      pathname === "/alerts" ||
      pathname === "/delivery"
    );
  }

  if (role === "photographer") {
    const orderDetailOnly = /^\/orders\/[^/]+$/.test(pathname);
    if (
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
    return NextResponse.redirect(new URL(getDefaultRouteForRole(role as UserRole), request.url));
  }

  if (role && pathname === "/" && role !== "owner") {
    return NextResponse.redirect(new URL(getDefaultRouteForRole(role as UserRole), request.url));
  }

  if (!isPublic && !hasRoleAccess(pathname, role)) {
    return NextResponse.redirect(new URL(role ? getDefaultRouteForRole(role as UserRole) : "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
