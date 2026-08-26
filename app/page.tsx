import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-zinc-800">
      {/* Navbar */}
      <nav className="max-w-4xl mx-auto px-6 py-6 flex justify-between items-center">
        <span className="text-lg font-semibold tracking-tight">simple notes<span className="text-zinc-500">.</span></span>
        <Link 
          href="/n" 
          className="text-sm bg-zinc-100 text-zinc-950 px-4 py-2 rounded-md hover:bg-white transition-colors"
        >
          Buat Catatan
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-32 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
          Tulis tanpa gangguan.<br />
          <span className="text-zinc-500">Simpan tanpa repot.</span>
        </h1>
        <p className="mt-6 text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
          Aplikasi catatan minimalis yang otomatis menyimpan setiap ketukan Anda. 
          Tanpa login, tanpa tombol save, langsung bagikan lewat URL.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link 
            href="/n" 
            className="bg-white text-zinc-950 px-6 py-3 rounded-md font-medium hover:bg-zinc-200 transition-colors"
          >
            Mulai Menulis →
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-4xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-2 gap-8">
          <FeatureCard 
            title="Auto-Save Cerdas" 
            desc="Debounce 1 detik memastikan catatan tersimpan ke database tanpa membebani jaringan saat Anda sedang mengetik cepat." 
          />
          <FeatureCard 
            title="Tanpa Autentikasi" 
            desc="Setiap catatan memiliki token URL unik. Buat, akses, dan bagikan secara instan tanpa perlu membuat akun." 
          />
          <FeatureCard 
            title="Sinkronisasi Real-time" 
            desc="Polling otomatis setiap 5 detik. Buka di dua perangkat berbeda dan lihat perubahan muncul secara langsung." 
          />
          <FeatureCard 
            title="Fokus Murni" 
            desc="Antarmuka gelap yang tenang dengan batas 50.000 karakter. Dirancang khusus untuk pemikiran yang panjang dan mendalam." 
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-8 border-t border-zinc-900 text-center text-zinc-600 text-sm">
        © 2026 simple notes. Dibuat untuk fokus.
      </footer>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950 hover:border-zinc-800 transition-colors">
      <h3 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}