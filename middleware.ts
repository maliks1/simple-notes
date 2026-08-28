// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Batasi pembuatan catatan baru: 3 catatan per 1 menit per IP
const createNoteLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  prefix: "rl:create-note",
});

function getIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Hanya lindungi route pembuatan catatan
  if (pathname === "/n") {
    const ip = getIP(req);
    const { success } = await createNoteLimit.limit(ip);

    if (!success) {
      return new NextResponse(
        "Terlalu banyak catatan dibuat. Silakan coba lagi dalam beberapa menit.",
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/n"], // Hanya route /n yang dilindungi
};