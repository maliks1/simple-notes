"use client";

import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { useState } from "react";

interface Props {
  className?: string;
  children: React.ReactNode;
}

export default function CreateNoteButton({ className, children }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreate = async () => {
    if (status === "loading") return;
    setStatus("loading");

    const token = nanoid(32);
    try {
      // Pre-flight: cek rate limit + buat catatan SEBELUM navigasi
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, content: "" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(
          res.status === 429
            ? (data.error ?? "Terlalu banyak catatan dibuat.")
            : "Gagal membuat catatan. Coba lagi."
        );
        setStatus("error");
        setTimeout(() => setStatus("idle"), 5000);
        return; // ← JANGAN navigasi
      }

      // Lolos → baru masuk ke editor
      router.push(`/notes/${token}?new=1`);
    } catch {
      setErrorMsg("Gagal terhubung ke server.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleCreate}
        className={className}
        disabled={status === "loading"}
      >
        {status === "loading" ? "Membuat..." : children}
      </button>

      {status === "error" && (
        <p className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs text-red-400 w-max max-w-[220px] text-center z-10">
          {errorMsg}
        </p>
      )}
    </div>
  );
}