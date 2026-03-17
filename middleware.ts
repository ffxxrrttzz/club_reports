import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow API routes and public routes without auth check
  if (
    path.startsWith("/api/") ||
    path.startsWith("/_next") ||
    path === "/favicon.ico" ||
    publicRoutes.some(route => path === route || path.startsWith(route + "/"))
  ) {
    return NextResponse.next();
  }

  // For all other routes, allow access - client will handle auth redirection
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
