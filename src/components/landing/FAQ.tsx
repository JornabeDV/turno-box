import { FAQ_ITEMS } from "./constants";

export function FAQ() {
  return (
    <section className="py-16 px-4 border-t border-[#1A4A63] bg-[#0E2A38]">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl text-center mb-10">
          Preguntas frecuentes
        </h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map(({ q, a }) => (
            <div key={q} className="border border-[#1A4A63] bg-[#0A1F2A] p-5">
              <h3 className="text-sm lg:text-base font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight mb-1">
                {q}
              </h3>
              <p className="text-xs lg:text-sm text-[#6B8A99] font-[family-name:var(--font-oswald)] leading-relaxed">
                {a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
