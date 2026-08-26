import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { supabase } from "@/lib/supabase";

export default async function NewNote() {
  let token = nanoid(32);

  for (let i = 0; i < 5; i++) { // Maksimal 5x percobaan
    const { error } = await supabase
      .from("notes")
      .insert({ token, content: "" });

    if (!error) {
      redirect(`/n/${token}`);
    }
    
    console.error("DB Insert Error:", error.message); // Lihat error di terminal
    token = nanoid(32);
  }

  // Kalau tetap gagal, tampilkan error
  return <div>Gagal membuat catatan. Cek terminal untuk detail error.</div>;
}