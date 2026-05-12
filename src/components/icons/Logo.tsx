import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center my-5 md:my-10 ${className ?? ""}`}>
      {/* Isotype */}
      <Image
        src="/icons/image.png"
        alt="Turno Box"
        width={208}
        height={197}
        className="w-20 h-auto"
        priority
      />

      {/* Wordmark */}
      <h1 className="font-[family-name:var(--font-oswald)] font-bold italic text-[#F78837] uppercase tracking-tight text-4xl mt-2 leading-none">
        Turno Box
      </h1>

      {/* Tagline */}
      <p className="font-[family-name:var(--font-oswald)] text-[#27C7B8] uppercase tracking-[0.1em] text-sm mt-1.5">
        Reservá tu entrenamiento
      </p>
    </div>
  );
}
