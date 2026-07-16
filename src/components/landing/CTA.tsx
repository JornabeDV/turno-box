import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { WHATSAPP_URL } from "./constants";

export function CTA() {
  return (
    <section className="py-8 md:py-16 px-4 border-t border-border">
      <div className="max-w-4xl mx-auto text-center">
        <img
          src="/icons/image.png"
          alt="BoxTurno"
          className="h-40 w-auto mx-auto mb-4"
        />
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl">
          Empezá a organizar tu gimnasio hoy
        </h2>
        <p className="mt-2 text-sm lg:text-base text-secondary font-[family-name:var(--font-oswald)]">
          14 días de prueba gratis. Sin tarjeta. Sin compromiso.
        </p>
        <div className="mt-6">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand text-page px-8 py-3 text-sm font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide hover:bg-brand/90 transition-colors"
          >
            Probar gratis
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
