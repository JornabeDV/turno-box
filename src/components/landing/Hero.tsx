import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { WHATSAPP_URL } from "./constants";

export function Hero() {
  return (
    <section className="pt-16 pb-12 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-4xl sm:text-5xl leading-none">
          Dejá de administrar tu box con{" "}
          <span className="text-[#F78837]">WhatsApp y Excel</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[#6B8A99] max-w-2xl mx-auto font-[family-name:var(--font-oswald)]">
          Turnos, pagos, cupos y alumnos. Todo en una sola app diseñada para
          boxes de CrossFit.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#F78837] text-[#0A1F2A] px-6 py-3 text-sm font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide hover:bg-[#F78837]/90 transition-colors"
          >
            Probar gratis
            <ArrowRight size={16} />
          </a>
          <a
            href="#como-funciona"
            className="inline-flex items-center gap-2 border border-[#1A4A63] text-[#6B8A99] px-6 py-3 text-sm font-[family-name:var(--font-oswald)] uppercase tracking-wide hover:border-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
          >
            Ver cómo funciona
          </a>
          <a
            href="/gyms"
            className="inline-flex items-center gap-2 border border-[#27C7B8]/40 text-[#27C7B8] px-6 py-3 text-sm font-[family-name:var(--font-oswald)] uppercase tracking-wide hover:border-[#27C7B8] hover:bg-[#27C7B8]/10 transition-colors"
          >
            Soy atleta
            <ArrowRight size={16} />
          </a>
        </div>

        {/* Mockup visual */}
        <div className="mt-12 max-w-3xl mx-auto border border-[#1A4A63] bg-[#0E2A38] p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E61919]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#F78837]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27C7B8]" />
            </div>
            <span className="text-[10px] font-[family-name:var(--font-jetbrains)] text-[#4A6B7A] uppercase tracking-wider ml-2">
              Panel de admin
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0A1F2A] border border-[#1A4A63] p-3">
              <div className="text-[10px] text-[#6B8A99] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider mb-1">
                Alumnos activos
              </div>
              <div className="text-xl font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA]">
                124
              </div>
            </div>
            <div className="bg-[#0A1F2A] border border-[#1A4A63] p-3">
              <div className="text-[10px] text-[#6B8A99] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider mb-1">
                Clases hoy
              </div>
              <div className="text-xl font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA]">
                8
              </div>
            </div>
            <div className="bg-[#0A1F2A] border border-[#1A4A63] p-3">
              <div className="text-[10px] text-[#6B8A99] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider mb-1">
                Ingresos mes
              </div>
              <div className="text-xl font-[family-name:var(--font-oswald)] font-bold text-[#27C7B8]">
                $1.2M
              </div>
            </div>
          </div>
          <div className="mt-3 bg-[#0A1F2A] border border-[#1A4A63] p-3">
            <div className="flex items-center gap-3">
              <div className="size-8 border border-[#F78837]/30 bg-[#F78837]/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-[family-name:var(--font-oswald)] font-bold text-[#F78837]">
                  12
                </span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight">
                  CrossFit Intenso
                </div>
                <div className="text-[10px] text-[#4A6B7A] font-[family-name:var(--font-jetbrains)]">
                  07:00 · 8/12 cupos
                </div>
              </div>
              <div className="text-[10px] font-[family-name:var(--font-jetbrains)] text-[#27C7B8] uppercase tracking-wider">
                4 libres
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
