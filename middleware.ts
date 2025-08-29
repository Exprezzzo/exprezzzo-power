import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  if (path.startsWith("/admin")) {
    const authToken = request.cookies.get("auth-token");
    const adminClaim = request.cookies.get("admin-claim");
    
    if (!authToken || adminClaim?.value !== "true") {
      console.log("[AUDIT] Unauthorized admin access:", {
        path,
        ip: request.ip,
        timestamp: new Date().toISOString()
      });
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  
  const ref = request.nextUrl.searchParams.get("ref");
  if (ref) {
    const response = NextResponse.next();
    response.cookies.set("referral", ref, {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      secure: true
    });
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/chat", "/((?!_next/static|_next/image|favicon.ico).*)"]
};