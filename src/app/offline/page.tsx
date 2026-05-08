"use client";

import { WifiSlash } from "@phosphor-icons/react";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center bg-[#0A1F2A]">
      <div className="size-16 border border-[#1A4A63] bg-[#0E2A38] flex items-center justify-center mb-5">
        <WifiSlash size={28} className="text-[#4A6B7A]" />
      </div>
      <h1 className="text-xl font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight mb-2">
        Sin conexión
      </h1>
      <p className="text-sm text-[#6B8A99] max-w-xs mb-6 font-[family-name:var(--font-oswald)]">
        No hay internet disponible. Revisá tu conexión e intentá de nuevo.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 border border-[#1A4A63] bg-[#0E2A38] text-sm text-[#6B8A99] hover:text-[#EAEAEA] hover:border-[#6B8A99] transition-colors font-[family-name:var(--font-oswald)] uppercase tracking-wide"
      >
        Reintentar
      </button>
    </div>
  );
}
