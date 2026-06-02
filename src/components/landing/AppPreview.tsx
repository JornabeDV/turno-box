export function AppPreview() {
  const mobileSlides = [
    {
      src: "/landing_mobile_1.png",
      alt: "Vista del alumno en BoxTurno",
      label: "App del alumno",
    },
    {
      src: "/landing_mobile_2.png",
      alt: "Dashboard admin en BoxTurno",
      label: "Dashboard admin",
    },
    {
      src: "/landing_mobile_3.png",
      alt: "Vista de clases en BoxTurno",
      label: "Gestión de clases",
    },
  ];

  return (
    <section className="py-8 md:py-16 px-4 border-t border-[#1A4A63]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl">
            Tu gimnasio, en una pantalla
          </h2>
          <p className="mt-2 text-sm lg:text-base text-[#6B8A99] font-[family-name:var(--font-oswald)]">
            Organizá clases, actividades y profesores desde un solo lugar.
          </p>
        </div>

        {/* Desktop screenshot */}
        <div className="hidden sm:block max-w-5xl mx-auto border border-[#1A4A63] bg-[#0E2A38] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A4A63]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E61919]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#F78837]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27C7B8]" />
            </div>
            <span className="text-[10px] lg:text-xs font-[family-name:var(--font-jetbrains)] text-[#4A6B7A] uppercase tracking-wider ml-2">
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
                <div className="border border-[#1A4A63] bg-[#0E2A38] overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1A4A63]">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#E61919]" />
                      <div className="w-2 h-2 rounded-full bg-[#F78837]" />
                      <div className="w-2 h-2 rounded-full bg-[#27C7B8]" />
                    </div>
                    <span className="text-[10px] font-[family-name:var(--font-jetbrains)] text-[#4A6B7A] uppercase tracking-wider ml-1">
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
                  i === 0 ? "bg-[#F78837]" : "bg-[#1A4A63]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
