// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Limit per identitas anonim (cookie)
const visitorLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 m"),
  prefix: "rl:visitor",
});

// Limit per IP sebagai backstop (lebih longgar)
const ipLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "10 m"),
  prefix: "rl:ip",
});

function getIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/n") {
    // Lewati prefetch & RSC requests
    const isPrefetch =
      req.headers.get("next-router-prefetch") === "1" ||
      req.headers.get("purpose") === "prefetch";
    const isRSC = req.headers.get("rsc") === "1";
    if (isPrefetch || isRSC) {
      return NextResponse.next();
    }

    // 1. Ambil atau buat anonymous visitor ID dari cookie
    let visitorId = req.cookies.get("visitor_id")?.value;
    const isNewVisitor = !visitorId;
    if (isNewVisitor) {
      visitorId = crypto.randomUUID();
    }

    const ip = getIP(req);

    // Helper untuk set cookie di response
    const attachCookie = (res: NextResponse) => {
      if (isNewVisitor) {
        res.cookies.set("visitor_id", visitorId!, {
          maxAge: 60 * 60 * 24 * 365, // 1 tahun
          path: "/",
          sameSite: "lax",
        });
      }
      return res;
    };

    try {
      // 2. Cek kedua lapisan limit
      const [visitorResult, ipResult] = await Promise.all([
        visitorLimit.limit(visitorId!),
        ipLimit.limit(ip),
      ]);

      if (!visitorResult.success || !ipResult.success) {
        return attachCookie(
          new NextResponse(
            "Terlalu banyak catatan dibuat. Silakan coba lagi dalam beberapa menit.",
            { status: 429 }
          )
        );
      }

      return attachCookie(NextResponse.next());
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