import { FAQ_ITEMS } from "./constants";

export function FAQ() {
  return (
    <section className="py-8 md:py-16 px-4 border-t border-border bg-card">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl text-center mb-10">
          Preguntas frecuentes
        </h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map(({ q, a }) => (
            <div key={q} className="border border-border bg-page p-5">
              <h3 className="text-sm lg:text-base font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight mb-1">
                {q}
              </h3>
              <p className="text-xs lg:text-sm text-secondary font-[family-name:var(--font-oswald)] leading-relaxed">
                {a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
