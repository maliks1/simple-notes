"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function NotePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function fetchNote() {
      const { data } = await supabase
        .from("notes")
        .select("content")
        .eq("token", token)
        .single();

      if (!data) {
        router.replace("/n");
        return;
      }

      setContent(data.content ?? "");
      setLoading(false);
    }
    fetchNote();
  }, [router, token]);

  useEffect(() => {
    if (loading) return;
    timer.current = setTimeout(async () => {
      await supabase
        .from("notes")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("token", token);
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [content, loading, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen p-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Tulis catatan..."
        className="w-full h-full resize-none text-lg leading-relaxed focus:outline-none"
      />
    </div>
  );
}
