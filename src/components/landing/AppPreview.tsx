export function AppPreview() {
  const mobileSlides = [
    {
      src: "/landing_mobile_1.png",
      alt: "Vista del alumno en BoxTurno",
      label: "App del alumno",
    },
    {
      src: "/landing_mobile_2.png",
      alt: "Panel General de admin en BoxTurno",
      label: "Panel General de admin",
    },
    {
      src: "/landing_mobile_3.png",
      alt: "Vista de clases en BoxTurno",
      label: "Gestión de clases",
    },
  ];

  return (
    <section className="py-8 md:py-16 px-4 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl">
            Tu gimnasio, en una pantalla
          </h2>
          <p className="mt-2 text-sm lg:text-base text-secondary font-[family-name:var(--font-oswald)]">
            Organizá clases, actividades y profesores desde un solo lugar.
          </p>
        </div>

        {/* Desktop screenshot */}
        <div className="hidden sm:block max-w-5xl mx-auto border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-danger" />
              <div className="w-2.5 h-2.5 rounded-full bg-brand" />
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
            </div>
            <span className="text-[10px] lg:text-xs font-[family-name:var(--font-jetbrains)] text-muted uppercase tracking-wider ml-2">
              Vista semanal de clases
            </span>
          </div>
          <img
            src="/landing_4.png"
            alt="Vista semanal de clases en BoxTurno"
            className="w-full"
          />
        </div>

        {/* Mobile carousel */}
        <div className="sm:hidden">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-6 scrollbar-hide">
            {mobileSlides.map((slide) => (
              <div
                key={slide.src}
                className="snap-center shrink-0 w-[78%] first:pl-4 last:pr-4"
              >
                <div className="border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-danger" />
                      <div className="w-2 h-2 rounded-full bg-brand" />
                      <div className="w-2 h-2 rounded-full bg-success" />
                    </div>
                    <span className="text-[10px] font-[family-name:var(--font-jetbrains)] text-muted uppercase tracking-wider ml-1">
                      {slide.label}
                    </span>
                  </div>
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-1.5 mt-2">
            {mobileSlides.map((slide, i) => (
              <div
                key={slide.src + "-dot"}
                className={`w-1.5 h-1.5 rounded-full ${
                  i === 0 ? "bg-brand" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
