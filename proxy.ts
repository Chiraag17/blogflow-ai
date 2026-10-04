// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Global middleware to protect API routes.
 * Allows unauthenticated access to authentication endpoints (`/api/auth/*`).
 * For all other `/api/*` routes, it verifies a valid JWT session token.
 * If the token is missing or invalid, the request is rejected with 401.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public auth routes and nextjs static files
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/_next") || pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }

  // Only protect API routes – other routes (pages) can handle auth client‑side.
  if (pathname.startsWith("/api")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", token.sub ?? "");
    requestHeaders.set("x-user-role", (token as any).role ?? "");
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
