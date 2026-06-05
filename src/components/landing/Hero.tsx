import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { WHATSAPP_URL } from "./constants";

export function Hero() {
  return (
    <section className="py-8 md:py-16 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-none max-w-5xl mx-auto">
          Dejá de administrar tu gimnasio con{" "}
          <span className="text-[#F78837]">WhatsApp y Excel</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg lg:text-xl text-[#6B8A99] max-w-3xl mx-auto font-[family-name:var(--font-oswald)]">
          Turnos, pagos, cupos y alumnos. Todo en una sola app diseñada para
          gimnasios, boxes y centros deportivos.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs sm:max-w-none mx-auto sm:mx-0">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center w-48 justify-center gap-2 bg-[#F78837] text-[#0A1F2A] px-6 py-3 text-sm font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide hover:bg-[#F78837]/90 transition-colors"
          >
            Probar gratis
            <ArrowRight size={16} />
          </a>
          <a
            href="#como-funciona"
            className="inline-flex items-center w-48 justify-center gap-2 border border-[#1A4A63] text-[#6B8A99] px-6 py-3 text-sm font-[family-name:var(--font-oswald)] uppercase tracking-wide hover:border-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
          >
            Ver cómo funciona
          </a>
          <a
            href="/gyms"
            className="inline-flex items-center w-48 justify-center gap-2 border border-[#27C7B8]/40 text-[#27C7B8] px-6 py-3 text-sm font-[family-name:var(--font-oswald)] uppercase tracking-wide hover:border-[#27C7B8] hover:bg-[#27C7B8]/10 transition-colors"
          >
            Soy alumno
            <ArrowRight size={16} />
          </a>
        </div>

        {/* Mockup visual */}
        <div className="mt-12 max-w-5xl mx-auto border border-[#1A4A63] bg-[#0E2A38] overflow-hidden hidden sm:block">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A4A63]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E61919]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#F78837]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27C7B8]" />
            </div>
            <span className="text-[10px] lg:text-xs font-[family-name:var(--font-jetbrains)] text-[#4A6B7A] uppercase tracking-wider ml-2">
              Panel General de admin
            </span>
          </div>
          <img
            src="/landing_3.png"
            alt="Panel General de BoxTurno con métricas del gimnasio"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}
