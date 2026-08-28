// proxy.ts
import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const res = NextResponse.next();

  // Set visitor_id cookie jika belum ada
  if (!req.cookies.get("visitor_id")) {
    res.cookies.set("visitor_id", crypto.randomUUID(), {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  }

  return res;
}

export const config = {
  matcher: ["/n/:path*"],
};