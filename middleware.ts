// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const createNoteLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 m"),
  prefix: "rl:create-note",
});

function getIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/n") {
    // Lewati prefetch & RSC requests — hanya hitung navigasi dokumen nyata
    const isPrefetch =
      req.headers.get("next-router-prefetch") === "1" ||
      req.headers.get("purpose") === "prefetch";
    const isRSC = req.headers.get("rsc") === "1";

    if (isPrefetch || isRSC) {
      return NextResponse.next();
    }

    try {
      const ip = getIP(req);
      const { success } = await createNoteLimit.limit(ip);

      if (!success) {
        return new NextResponse(
          "Terlalu banyak catatan dibuat. Silakan coba lagi dalam beberapa menit.",
          { status: 429 }
        );
      }
    } catch (error) {
      console.error("Rate limit error:", error);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/n"],
};