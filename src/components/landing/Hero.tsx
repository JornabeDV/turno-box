import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { WHATSAPP_URL } from "./constants";

export function Hero() {
  return (
    <section className="py-8 md:py-16 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-none max-w-5xl mx-auto">
          Dejá de administrar tu gimnasio con{" "}
          <span className="text-brand">WhatsApp y Excel</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg lg:text-xl text-secondary max-w-3xl mx-auto font-[family-name:var(--font-oswald)]">
          Turnos, pagos, cupos y alumnos. Todo en una sola app diseñada para
          gimnasios, boxes y centros deportivos.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs sm:max-w-none mx-auto sm:mx-0">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center w-48 justify-center gap-2 bg-brand text-page px-6 py-3 text-sm font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide hover:bg-brand/90 transition-colors"
          >
            Probar gratis
            <ArrowRight size={16} />
          </a>
          <a
            href="#como-funciona"
            className="inline-flex items-center w-48 justify-center gap-2 border border-border text-secondary px-6 py-3 text-sm font-[family-name:var(--font-oswald)] uppercase tracking-wide hover:border-secondary hover:text-primary transition-colors"
          >
            Ver cómo funciona
          </a>
          <a
            href="/gyms"
            className="inline-flex items-center w-48 justify-center gap-2 border border-success/40 text-success px-6 py-3 text-sm font-[family-name:var(--font-oswald)] uppercase tracking-wide hover:border-success hover:bg-success/10 transition-colors"
          >
            Soy alumno
            <ArrowRight size={16} />
          </a>
        </div>

        {/* Mockup visual */}
        <div className="mt-12 max-w-5xl mx-auto border border-border bg-card overflow-hidden hidden sm:block">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-danger" />
              <div className="w-2.5 h-2.5 rounded-full bg-brand" />
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
            </div>
            <span className="text-[10px] lg:text-xs font-[family-name:var(--font-jetbrains)] text-muted uppercase tracking-wider ml-2">
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
