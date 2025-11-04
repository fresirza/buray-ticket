import React, { useEffect, useMemo, useRef, useState } from "react";

// --- helpers ---
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return (h >>> 0).toString(36).toUpperCase();
}

const THEMES = {
  emerald: {
    label: "Zümrüt",
    accentDot: "bg-emerald-400",
    ring: "ring-emerald-400/50",
    glowA: "rgba(16,185,129,0.28)",
    glowB: "rgba(59,130,246,0.25)",
  },
  rose: {
    label: "Gül",
    accentDot: "bg-rose-400",
    ring: "ring-rose-400/50",
    glowA: "rgba(244,63,94,0.28)",
    glowB: "rgba(147,51,234,0.25)",
  },
  violet: {
    label: "Menekşe",
    accentDot: "bg-violet-400",
    ring: "ring-violet-400/50",
    glowA: "rgba(139,92,246,0.28)",
    glowB: "rgba(14,165,233,0.25)",
  },
  amber: {
    label: "Kehribar",
    accentDot: "bg-amber-400",
    ring: "ring-amber-400/50",
    glowA: "rgba(245,158,11,0.32)",
    glowB: "rgba(59,130,246,0.22)",
  },
  cyan: {
    label: "Camgöbeği",
    accentDot: "bg-cyan-400",
    ring: "ring-cyan-400/50",
    glowA: "rgba(34,211,238,0.30)",
    glowB: "rgba(125,211,252,0.25)",
  },
};

export default function App() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [generated, setGenerated] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [theme, setTheme] = useState("emerald");
  const [format, setFormat] = useState(
    typeof window !== "undefined" && window.innerWidth < 640 ? "story" : "wide"
  ); // 'wide' (21:9) or 'story' (9:16)
  const [countdown, setCountdown] = useState("");
  const ticketRef = useRef(null);

  const fullName = useMemo(
    () => `${firstName.trim()} ${lastName.trim()}`.trim(),
    [firstName, lastName]
  );
  const activeTheme = THEMES[theme];
  const isStory = format === "story";

  // Countdown to Nov 7, 2025 21:00 TRT (UTC+3)
  useEffect(() => {
    const target = new Date("2025-11-07T21:00:00+03:00");
    const update = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("Şimdi!");
        return;
      }
      const day = 24 * 60 * 60 * 1000;
      const hour = 60 * 60 * 1000;
      const min = 60 * 1000;
      const d = Math.floor(diff / day);
      const h = Math.floor((diff % day) / hour);
      const m = Math.floor((diff % hour) / min);
      setCountdown(`${d}g ${String(h).padStart(2, "0")}s ${String(m).padStart(2, "0")}d`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const handleGenerate = () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert("Lütfen ad ve soyadı girin.");
      return;
    }
    const code = `HRB25-${hashCode(`${firstName}|${lastName}|7-Nov-2025`)}`;
    setTicketId(code);
    setGenerated(true);
    setTimeout(() => {
      if (!ticketRef.current) return;
      ticketRef.current.classList.add("ring-2", ...activeTheme.ring.split(" "));
      setTimeout(
        () => ticketRef.current?.classList.remove("ring-2", ...activeTheme.ring.split(" ")),
        900
      );
    }, 50);
  };

  async function exportPNG() {
    const { toPng } = await import("html-to-image");
    const pixelRatio = isStory ? 2.5 : 2;
    return await toPng(ticketRef.current, {
      pixelRatio,
      cacheBust: true,
      backgroundColor: "#0a0a0a",
    });
  }

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    try {
      const dataUrl = await exportPNG();
      const link = document.createElement("a");
      const suffix = isStory ? "-Story-1080x1920" : "-Wide-21x9";
      link.download = `${fullName || "ticket"}-Buray-Harbiye-2025${suffix}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert("İndirirken bir sorun oluştu. Lütfen tekrar deneyin.");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Buray — Harbiye Hatıra Bileti",
          text: `${fullName || "Misafir"} için hatıra bileti hazır! #BurayHarbiye #7Kasım`,
          url: window.location.href,
        });
        return;
      }
      const text = `${fullName || "Misafir"} için hatıra biletimi oluşturdum! Buray — Harbiye (7 Kasım)\n${window.location.href}`;
      const wa = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(wa, "_blank");
    } catch (e) {
      console.error(e);
      alert("Paylaşım başarısız oldu. Lütfen tekrar deneyin.");
    }
  };

  const handleShareImage = async () => {
    try {
      const dataUrl = await exportPNG();
      if (navigator.clipboard && window.ClipboardItem) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new window.ClipboardItem({ [blob.type]: blob })]);
        alert("Görsel panoya kopyalandı. Uygulamada yapıştırarak paylaşabilirsiniz.");
        return;
      }
      window.open(dataUrl, "_blank");
    } catch (e) {
      console.error(e);
      alert("Görsel paylaşımında sorun oluştu. PNG indirip manuel paylaşabilirsiniz.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 antialiased">
      {/* Top Banner */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            Buray — Harbiye Hatıra Bileti
          </h1>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400">Tema</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="h-9 rounded-lg bg-zinc-900 border border-white/10 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              {Object.entries(THEMES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <label className="ml-3 text-xs text-zinc-400">Bilet Boyutu</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="h-9 rounded-lg bg-zinc-900 border border-white/10 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="wide">Yatay 21:9</option>
              <option value="story">Story 9:16 (1080×1920)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-6 grid gap-6 md:grid-cols-2">
        {/* Form */}
        <section className="p-4 md:p-6 rounded-2xl bg-zinc-900/60 border border-white/10 shadow-lg">
          <h2 className="text-lg font-medium mb-4">Bilgilerini Gir</h2>
          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-sm text-zinc-300">Ad</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ör. Ayşe"
                className="h-11 px-3 rounded-xl bg-zinc-800 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-zinc-300">Soyad</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value.toUpperCase())}
                placeholder="Ör. YILMAZ"
                className="h-11 px-3 rounded-xl bg-zinc-800 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </label>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleGenerate}
                className="h-11 px-4 rounded-xl bg-white text-zinc-900 font-semibold hover:bg-zinc-200 transition"
              >
                Bileti Oluştur
              </button>
              <button
                onClick={handleDownload}
                disabled={!generated}
                className={`h-11 px-4 rounded-xl font-semibold transition ${
                  generated
                    ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                    : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                }`}
              >
                PNG İndir
              </button>
              <button
                onClick={handleShare}
                className="h-11 px-4 rounded-xl bg-zinc-800 border border-white/10 hover:bg-zinc-700 transition"
              >
                Paylaş (Mobil)
              </button>
              <button
                onClick={handleShareImage}
                className="h-11 px-4 rounded-xl bg-zinc-800 border border-white/10 hover:bg-zinc-700 transition"
              >
                Görseli Paylaş/Kopyala
              </button>
            </div>
            <p className="text-xs text-zinc-400 pt-1">
              Not: Bilgileriniz sunucuya gönderilmez; bilet tarayıcınızda oluşturulur.
            </p>
          </div>
        </section>

        {/* Ticket Preview */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Önizleme</h2>
          <div
            ref={ticketRef}
            className={`relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black shadow-2xl ${
              isStory ? "aspect-[9/16]" : "aspect-[21/9]"
            }`}
            style={{ minHeight: isStory ? 420 : 260 }}
          >
            {/* Glow & Texture */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  `radial-gradient(1200px 500px at 20% -10%, ${activeTheme.glowA}, transparent 60%),` +
                  `radial-gradient(800px 400px at 120% 120%, ${activeTheme.glowB}, transparent 60%)`,
              }}
            />
            <div
              className="absolute inset-0 mix-blend-overlay opacity-20"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 6px)",
              }}
            />

            {/* COUNTDOWN BADGE */}
            <div className={`absolute ${isStory ? "top-4 left-1/2 -translate-x-1/2" : "top-3 right-3"} z-10`}>
              <div className="px-3 py-1 rounded-full backdrop-blur bg-black/50 border border-white/15 shadow-lg flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-300/90">Geri Sayım</span>
                <span className="text-xs font-semibold text-white/95 tabular-nums">{countdown || "—"}</span>
              </div>
            </div>

            {/* Content */}
            <div
              className={`relative h-full w-full ${
                isStory ? "p-7" : "p-5 md:p-8"
              } flex ${isStory ? "flex-col items-center justify-between" : "items-center justify-between"}`}
            >
              {/* Branding */}
              <div className={`flex ${isStory ? "flex-col items-center text-center gap-2" : "flex-col gap-3"}`}>
                <div className="text-[10px] tracking-widest text-zinc-300/80 uppercase">Commemorative Ticket</div>
                <div className={`${isStory ? "text-3xl" : "text-2xl md:text-3xl"} font-black tracking-tight`}>
                  Buray — Harbiye
                </div>
                <div className={`${isStory ? "text-xs" : "text-sm"} text-zinc-300/90`}>
                  7 November 2025 • Harbiye Cemil Topuzlu Open-Air Theatre • Istanbul
                </div>
                <div className="mt-1 inline-flex items-center gap-2 text-xs text-zinc-400">
                  <span className={`h-2 w-2 rounded-full ${activeTheme.accentDot} animate-pulse`} />
                  <span>
                    Ad Soyad: <span className="font-semibold text-zinc-100">{fullName || "—"}</span>
                  </span>
                </div>
              </div>

              {/* Code & QR */}
              <div className={`flex ${isStory ? "flex-col items-center gap-3" : "items-center gap-5"}`}>
                <div className={`${isStory ? "text-center" : "pr-5 md:pr-7 border-r border-dashed border-white/20"}`}>
                  <div className="text-[10px] tracking-widest text-zinc-400/80 uppercase">Ticket ID</div>
                  <div className={`${isStory ? "text-2xl" : "text-xl md:text-2xl"} font-bold tracking-[0.15em] text-white/95 select-all`}>
                    {ticketId || "HRB25-XXXXXX"}
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-500">
                    This is a keepsake ticket and does not grant entry.
                  </div>
                </div>
                <div className={`${isStory ? "h-28 w-28" : "h-24 w-24"} rounded-lg bg-white/95 p-2 grid grid-cols-3 gap-1`}>
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className={`w-full h-full ${i % 2 === 0 ? "bg-zinc-900" : "bg-white"}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Ribbon */}
            <div
              className={`absolute left-0 right-0 px-5 md:px-8 py-3 backdrop-blur-sm bg-black/30 ${
                isStory ? "bottom-3 mx-5 rounded-xl" : "bottom-0 flex items-center justify-between"
              }`}
            >
              <div className="text-xs text-zinc-300/80">Keep this image as a memory of the night.</div>
              {!isStory && <div className="text-xs text-zinc-400">#BurayHarbiye #7Kasım</div>}
            </div>
          </div>

          <div className="text-xs text-zinc-400">
            İpucu: Boyut seç (Yatay/Story), ad-soyad gir, “Bileti Oluştur” de → PNG indir veya paylaş.
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-zinc-500">
        Bu site fikri, hatıra amaçlı kişiselleştirilmiş görsel üretir; giriş bileti yerine geçmez.
      </footer>
    </div>
  );
}
