"use client";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <div className="size-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="2" y1="2" x2="22" y2="22" />
          <path d="M8.5 16.5a5 5 0 0 1 7 0" />
          <path d="M5 12.5a10 10 0 0 1 5.17-2.69" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a16 16 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-zinc-100 mb-2">Sin conexión</h1>
      <p className="text-sm text-zinc-500 max-w-xs mb-6">
        No hay internet disponible. Revisá tu conexión e intentá de nuevo.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 active:bg-zinc-700 transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}
