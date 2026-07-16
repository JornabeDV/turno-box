"use client";

import { WifiSlash } from "@phosphor-icons/react";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center bg-page">
      <div className="size-16 border border-border bg-card flex items-center justify-center mb-5">
        <WifiSlash size={28} className="text-muted" />
      </div>
      <h1 className="text-xl font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight mb-2">
        Sin conexión
      </h1>
      <p className="text-sm text-secondary max-w-xs mb-6 font-[family-name:var(--font-oswald)]">
        No hay internet disponible. Revisá tu conexión e intentá de nuevo.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 border border-border bg-card text-sm text-secondary hover:text-primary hover:border-secondary transition-colors font-[family-name:var(--font-oswald)] uppercase tracking-wide"
      >
        Reintentar
      </button>
    </div>
  );
}
