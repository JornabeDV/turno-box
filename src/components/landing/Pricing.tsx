import { CheckCircle, XCircle } from "@phosphor-icons/react/dist/ssr";
import { PLANS, PLAN_COMPARISON, WHATSAPP_URL } from "./constants";

function ComparisonValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <CheckCircle size={16} className="text-success mx-auto" />;
  }
  if (value === false) {
    return <XCircle size={16} className="text-muted mx-auto" />;
  }
  return (
    <span className="text-xs sm:text-sm text-secondary font-[family-name:var(--font-oswald)] text-center block">
      {value}
    </span>
  );
}

export function Pricing() {
  return (
    <section id="precios" className="py-8 md:py-16 px-4 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl">
            Planes simples
          </h2>
          <p className="mt-2 text-sm lg:text-base text-secondary font-[family-name:var(--font-oswald)]">
            Sin sorpresas. Elegí el que se adapte a tu box.
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`border p-6 flex flex-col ${
                plan.highlighted
                  ? "border-brand/50 bg-brand/5"
                  : "border-border bg-card"
              }`}
            >
              <h3 className="text-sm lg:text-base font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight">
                {plan.name}
              </h3>
              <p className="text-[11px] sm:text-xs text-secondary font-[family-name:var(--font-oswald)] uppercase tracking-wide mt-0.5">
                {plan.tagline}
              </p>
              <div className="mt-3 mb-4">
                <span className="text-2xl lg:text-3xl font-[family-name:var(--font-oswald)] font-bold text-primary">
                  {plan.price}
                </span>
                <span className="text-xs text-secondary font-[family-name:var(--font-jetbrains)]">
                  {plan.period}
                </span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-xs lg:text-sm text-secondary font-[family-name:var(--font-oswald)]"
                  >
                    <CheckCircle size={12} className="text-success shrink-0" />
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
                    ? "bg-brand text-page hover:bg-brand/90"
                    : "border border-border text-secondary hover:border-secondary hover:text-primary"
                }`}
              >
                Contactar
              </a>
            </div>
          ))}
        </div>

        {/* Comparativa */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h3 className="text-center text-sm sm:text-base font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight mb-6">
            Comparación de funcionalidades
          </h3>

          <div className="border border-border bg-card overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-[family-name:var(--font-oswald)] uppercase tracking-wide text-secondary">
                    Funcionalidad
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan.name}
                      className={`text-center px-4 py-3 text-xs font-[family-name:var(--font-oswald)] uppercase tracking-wide ${
                        plan.highlighted ? "text-brand" : "text-secondary"
                      }`}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_COMPARISON.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i % 2 === 0 ? "bg-page/40" : ""}
                  >
                    <td className="px-4 py-2.5 text-xs sm:text-sm text-primary font-[family-name:var(--font-oswald)]">
                      {row.feature}
                    </td>
                    <td className="px-4 py-2.5">
                      <ComparisonValue value={row.starter} />
                    </td>
                    <td className="px-4 py-2.5">
                      <ComparisonValue value={row.pro} />
                    </td>
                    <td className="px-4 py-2.5">
                      <ComparisonValue value={row.enterprise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
