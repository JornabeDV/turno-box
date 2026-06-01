import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { PLANS, WHATSAPP_URL } from "./constants";

export function Pricing() {
  return (
    <section id="precios" className="py-16 px-4 border-t border-[#1A4A63]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl">
            Planes simples
          </h2>
          <p className="mt-2 text-sm lg:text-base text-[#6B8A99] font-[family-name:var(--font-oswald)]">
            Sin sorpresas. Cancelás cuando quieras.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`border p-6 flex flex-col ${
                plan.highlighted
                  ? "border-[#F78837]/50 bg-[#F78837]/5"
                  : "border-[#1A4A63] bg-[#0E2A38]"
              }`}
            >
              <h3 className="text-sm lg:text-base font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight">
                {plan.name}
              </h3>
              <div className="mt-3 mb-4">
                <span className="text-2xl lg:text-3xl font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA]">
                  {plan.price}
                </span>
                <span className="text-xs text-[#6B8A99] font-[family-name:var(--font-jetbrains)]">
                  {plan.period}
                </span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-xs lg:text-sm text-[#6B8A99] font-[family-name:var(--font-oswald)]"
                  >
                    <CheckCircle size={12} className="text-[#27C7B8] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full text-center py-2.5 text-xs lg:text-sm font-[family-name:var(--font-oswald)] font-bold uppercase tracking-wide transition-colors ${
                  plan.highlighted
                    ? "bg-[#F78837] text-[#0A1F2A] hover:bg-[#F78837]/90"
                    : "border border-[#1A4A63] text-[#6B8A99] hover:border-[#6B8A99] hover:text-[#EAEAEA]"
                }`}
              >
                {plan.price === "Consultar" ? "Contactar" : "Empezar"}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
