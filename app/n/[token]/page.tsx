"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export default function NotePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);
  const contentRef = useRef(content); // sinkronkan ref dengan state

  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  // ── Initial fetch ──
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

  // ── Debounce save: 1 detik setelah berhenti mengetik ──
  const handleChange = useCallback(
    (value: string) => {
      setContent(value);
      isTyping.current = true;

      if (saveTimer.current) clearTimeout(saveTimer.current);

      saveTimer.current = setTimeout(async () => {
        isTyping.current = false;
        await supabase
          .from("notes")
          .update({ content: value, updated_at: new Date().toISOString() })
          .eq("token", token);
      }, 1000); // ← 1 detik
    },
    [token],
  );

  // ── Polling: ambil data dari DB setiap 5 detik ──
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(async () => {
      // Jangan overwrite saat user sedang mengetik
      if (isTyping.current) return;

      const { data } = await supabase
        .from("notes")
        .select("content")
        .eq("token", token)
        .single();

      if (data && data.content !== contentRef.current) {
        setContent(data.content);
      }
    }, 5000); // ← 5 detik

    return () => clearInterval(interval);
  }, [loading, token]);

  // ── Cleanup timer saat unmount ──
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

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
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Tulis catatan..."
        className="w-full h-full resize-none text-lg leading-relaxed focus:outline-none"
      />
    </div>
  );
}
