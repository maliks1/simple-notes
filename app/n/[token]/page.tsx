"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const MAX_LENGTH = 50_000;

export default function NotePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // ── Initial fetch ──
  useEffect(() => {
    async function fetchNote() {
      try {
        const { data, error } = await supabase
          .from("notes")
          .select("content")
          .eq("token", token)
          .single();

        if (error || !data) {
          router.replace("/n");
          return;
        }

        setContent(data.content ?? "");
        setLoading(false);
      } catch {
        setFetchError("Gagal memuat catatan. Periksa koneksi Anda.");
        setLoading(false);
      }
    }
    fetchNote();
  }, [router, token]);

  // ── Debounce save ──
  const handleChange = useCallback(
    (value: string) => {
      if (value.length > MAX_LENGTH) return;

      setContent(value);
      isTyping.current = true;
      setSaveStatus("saving");

      if (saveTimer.current) clearTimeout(saveTimer.current);

      saveTimer.current = setTimeout(async () => {
        isTyping.current = false;
        try {
          const { error } = await supabase
            .from("notes")
            .update({ content: value, updated_at: new Date().toISOString() })
            .eq("token", token);

          if (error) {
            setSaveStatus("error");
            console.error("Save failed:", error.message);
          } else {
            setSaveStatus("saved");
          }
        } catch {
          setSaveStatus("error");
          console.error("Save error: network issue");
        }
      }, 1000);
    },
    [token]
  );

  // ── Polling ──
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(async () => {
      if (isTyping.current) return;

      try {
        const { data } = await supabase
          .from("notes")
          .select("content")
          .eq("token", token)
          .single();

        if (data && data.content !== contentRef.current) {
          setContent(data.content);
        }
      } catch {
        // Polling gagal → abaikan, coba lagi di interval berikutnya
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loading, token]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // ── Error state ──
  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-screen text-red-400">
        {fetchError}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen p-6 flex flex-col">
      {/* Status bar */}
      <div className="text-xs text-gray-400 mb-2 h-4">
        {saveStatus === "saving" && "Menyimpan..."}
        {saveStatus === "saved" && "✓ Tersimpan"}
        {saveStatus === "error" && (
          <span className="text-red-400">⚠ Gagal menyimpan</span>
        )}
      </div>

      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        maxLength={MAX_LENGTH}
        placeholder="Tulis catatan..."
        className="w-full flex-1 resize-none text-lg leading-relaxed focus:outline-none"
      />
    </div>
  );
}