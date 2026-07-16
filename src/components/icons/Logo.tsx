export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center mb-3 md:my-10 ${className ?? ""}`}>
      {/* Isotype */}
      <img
        src="/icons/image.png?v=2"
        alt="Box Turno"
        width={208}
        height={197}
        className="w-28 md:w-36 h-auto"
      />

      {/* Tagline */}
      <p className="font-[family-name:var(--font-oswald)] text-success uppercase tracking-[0.1em] text-sm mt-1.5">
        Reservá tu entrenamiento
      </p>
    </div>
  );
}
