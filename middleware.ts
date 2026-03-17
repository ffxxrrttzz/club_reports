import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow API routes for auth and combo-options without session
  if (path.startsWith("/api/auth/") || path.startsWith("/api/combo-options")) {
    return NextResponse.next();
  }

  // Check if route is public (pages)
  if (publicRoutes.some(route => path === route || path.startsWith(route + "/"))) {
    return NextResponse.next();
  }

  // Check for session cookie on protected routes
  const session = request.cookies.get("session");

  console.log(`[Middleware] Path: ${path}, Session exists: ${!!session}`);

  // If no session, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

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
