import { CheckCircle, XCircle } from "@phosphor-icons/react/dist/ssr";

export function ProblemSolution() {
  return (
    <section id="como-funciona" className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Problem */}
          <div className="border border-border bg-card p-6">
            <h3 className="text-sm lg:text-base font-[family-name:var(--font-oswald)] font-bold text-danger uppercase tracking-tight mb-4 flex items-center gap-2">
              <XCircle size={16} />
              Así trabajás hoy
            </h3>
            <ul className="space-y-3">
              {[
                "Listas de alumnos en Excel que nadie actualiza",
                "Reservas por WhatsApp que se pierden entre chats",
                "No sabés cuántos van a ir a cada clase",
                "Los pagos los anotás en un cuaderno",
                "Los alumnos no saben cuántos créditos les quedan",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm lg:text-base text-secondary font-[family-name:var(--font-oswald)]"
                >
                  <span className="text-danger mt-0.5">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Solution */}
          <div className="border border-success/30 bg-success/5 p-6">
            <h3 className="text-sm lg:text-base font-[family-name:var(--font-oswald)] font-bold text-success uppercase tracking-tight mb-4 flex items-center gap-2">
              <CheckCircle size={16} />
              Con BoxTurno
            </h3>
            <ul className="space-y-3">
              {[
                "Reservas online 24/7 desde el celular del alumno",
                "Cupos actualizados en tiempo real",
                "Sistema de créditos y packs automático",
                "Historial de pagos y abonos siempre disponible",
                "Panel General de admin con métricas de tu gimnasio",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm lg:text-base text-primary font-[family-name:var(--font-oswald)]"
                >
                  <span className="text-success mt-0.5">+</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
