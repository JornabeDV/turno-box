import { TrendUp, Receipt, Users } from "@phosphor-icons/react/dist/ssr";

export function Demo() {
  return (
    <section className="py-8 md:py-16 px-4 border-t border-border bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl">
            Tu gimnasio, más organizado
          </h2>
          <p className="mt-2 text-sm lg:text-base text-secondary font-[family-name:var(--font-oswald)]">
            Métricas claras para tomar mejores decisiones.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-page border border-border p-6 text-center">
            <TrendUp size={24} className="text-success mx-auto mb-3" />
            <div className="text-3xl lg:text-4xl font-[family-name:var(--font-oswald)] font-bold text-primary">
              +35%
            </div>
            <div className="text-[10px] lg:text-xs text-secondary font-[family-name:var(--font-jetbrains)] uppercase tracking-wider mt-1">
              Ocupación promedio
            </div>
          </div>
          <div className="bg-page border border-border p-6 text-center">
            <Receipt size={24} className="text-brand mx-auto mb-3" />
            <div className="text-3xl lg:text-4xl font-[family-name:var(--font-oswald)] font-bold text-primary">
              -50%
            </div>
            <div className="text-[10px] text-secondary font-[family-name:var(--font-jetbrains)] uppercase tracking-wider mt-1">
              Tiempo admin por semana
            </div>
          </div>
          <div className="bg-page border border-border p-6 text-center">
            <Users size={24} className="text-success mx-auto mb-3" />
            <div className="text-3xl lg:text-4xl font-[family-name:var(--font-oswald)] font-bold text-primary">
              100%
            </div>
            <div className="text-[10px] text-secondary font-[family-name:var(--font-jetbrains)] uppercase tracking-wider mt-1">
              Alumnos con app propia
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
