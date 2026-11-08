"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Logo da ArtBrown. Coloque o arquivo da marca em `public/logo.png`
 * (o original "logo fundo branco .png"). Enquanto o arquivo não existir,
 * é exibida uma versão tipográfica.
 */
export function Logo({ className = "h-12", light = false }: { className?: string; light?: boolean }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // A imagem pode falhar antes da hidratação (onError não dispara): verifica ao montar.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <span className={`inline-flex flex-col items-center leading-none ${light ? "text-white" : "text-gold-700"}`}>
        <span className="font-script text-3xl">ArtBrown</span>
        <span className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.35em]">Company</span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src="/logo.png"
      alt="ArtBrown Company"
      className={`${className} w-auto`}
      onError={() => setFailed(true)}
    />
  );
}
