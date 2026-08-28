// app/api/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { supabase } from "@/lib/supabase";

const redis = Redis.fromEnv();

// Limit per visitor (cookie)
const visitorLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 m"),
  prefix: "rl:visitor",
});

// Limit per IP (backstop untuk NAT/shared IP)
const ipLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "10 m"),
  prefix: "rl:ip",
});

function getIP(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  // 1. Ambil atau buat visitor_id dari cookie
  let visitorId = req.cookies.get("visitor_id")?.value;
  const isNewVisitor = !visitorId;
  if (!visitorId) visitorId = crypto.randomUUID();

  const ip = getIP(req);

  // 2. Cek rate limit (visitor + IP)
  try {
    const [vRes, ipRes] = await Promise.all([
      visitorLimit.limit(visitorId),
      ipLimit.limit(ip),
    ]);

    if (!vRes.success || !ipRes.success) {
      return NextResponse.json(
        { error: "Terlalu banyak catatan dibuat. Coba lagi dalam beberapa menit." },
        { status: 429 }
      );
    }
  } catch (err) {
    console.error("Rate limit error:", err);
    // fail-open: jika Upstash down, jangan blokir user
  }

  // 3. Validasi input
  const { token, content } = await req.json();
  if (!token || typeof token !== "string" || token.length !== 32) {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
  }

  // 4. Insert ke Supabase
  const { error } = await supabase
    .from("notes")
    .insert({ token, content: content ?? "" });

  if (error) {
    // Duplicate key = sudah ada (idempotent, anggap sukses)
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, existed: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 5. Response + set cookie untuk visitor baru
  const res = NextResponse.json({ ok: true });
  if (isNewVisitor) {
    res.cookies.set("visitor_id", visitorId, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  }
  return res;
}