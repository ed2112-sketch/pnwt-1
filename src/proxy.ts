import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/server/auth";

const publicPaths = ["/login", "/register", "/verify-email", "/api/auth", "/api/trpc", "/e", "/checkout", "/verify", "/s", "/r", "/gc", "/unsubscribe", "/discover", "/v"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow homepage
  if (pathname === "/") return NextResponse.next();

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
