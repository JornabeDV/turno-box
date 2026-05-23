import { TrendUp, Receipt, Users } from "@phosphor-icons/react/dist/ssr";

export function Demo() {
  return (
    <section className="py-16 px-4 border-t border-[#1A4A63] bg-[#0E2A38]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl sm:text-3xl">
            Tu box, más organizado
          </h2>
          <p className="mt-2 text-sm text-[#6B8A99] font-[family-name:var(--font-oswald)]">
            Métricas claras para tomar mejores decisiones.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-[#0A1F2A] border border-[#1A4A63] p-6 text-center">
            <TrendUp size={24} className="text-[#27C7B8] mx-auto mb-3" />
            <div className="text-3xl font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA]">
              +35%
            </div>
            <div className="text-[10px] text-[#6B8A99] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider mt-1">
              Ocupación promedio
            </div>
          </div>
          <div className="bg-[#0A1F2A] border border-[#1A4A63] p-6 text-center">
            <Receipt size={24} className="text-[#F78837] mx-auto mb-3" />
            <div className="text-3xl font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA]">
              -50%
            </div>
            <div className="text-[10px] text-[#6B8A99] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider mt-1">
              Tiempo admin por semana
            </div>
          </div>
          <div className="bg-[#0A1F2A] border border-[#1A4A63] p-6 text-center">
            <Users size={24} className="text-[#27C7B8] mx-auto mb-3" />
            <div className="text-3xl font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA]">
              100%
            </div>
            <div className="text-[10px] text-[#6B8A99] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider mt-1">
              Alumnos con app propia
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
