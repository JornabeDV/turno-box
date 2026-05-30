import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { WHATSAPP_URL } from "./constants";

export function CTA() {
  return (
    <section className="py-16 px-4 border-t border-[#1A4A63]">
      <div className="max-w-3xl mx-auto text-center">
        <img
          src="/icons/image.png"
          alt="BoxTurno"
          className="h-40 w-auto mx-auto mb-4"
        />
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl sm:text-3xl">
          Empezá a organizar tu box hoy
        </h2>
        <p className="mt-2 text-sm text-[#6B8A99] font-[family-name:var(--font-oswald)]">
          14 días de prueba gratis. Sin tarjeta. Sin compromiso.
        </p>
        <div className="mt-6">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#F78837] text-[#0A1F2A] px-8 py-3 text-sm font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide hover:bg-[#F78837]/90 transition-colors"
          >
            Probar gratis
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
