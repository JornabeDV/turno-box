export function TrustBar() {
  return (
    <section className="py-8 border-y border-[#1A4A63] bg-[#0E2A38]">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-[10px] lg:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-widest text-[#6B8A99] mb-4">
          Boxes que confían en BoxTurno
        </p>
        <div className="flex items-center justify-center gap-8 sm:gap-12 opacity-60">
          {["CrossFit Norte", "Box Central", "Iron Tribe", "Delta Fit"].map(
            (name) => (
              <span
                key={name}
                className="text-sm lg:text-base font-[family-name:var(--font-oswald)] font-bold text-[#6B8A99] uppercase tracking-tight"
              >
                {name}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}
