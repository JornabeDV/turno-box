import {
  CalendarCheck,
  Coins,
  Users,
  Gear,
  Bell,
  Receipt,
} from "@phosphor-icons/react/dist/ssr";
import { FEATURES } from "./constants";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  CalendarCheck,
  Coins,
  Users,
  Gear,
  Bell,
  Receipt,
};

export function Features() {
  return (
    <section id="funciones" className="py-8 md:py-16 px-4 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-2xl sm:text-3xl lg:text-4xl">
            Todo lo que necesitás para tu gimnasio
          </h2>
          <p className="mt-2 text-sm lg:text-base text-secondary font-[family-name:var(--font-oswald)]">
            En un solo lugar, sin integraciones complicadas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ iconName, title, desc }) => {
            const Icon = ICON_MAP[iconName];
            return (
              <div
                key={title}
                className="border border-border bg-card p-5 hover:border-secondary transition-colors"
              >
                {Icon && <Icon size={24} className="text-brand mb-3" />}
                <h3 className="text-sm lg:text-base font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight mb-1">
                  {title}
                </h3>
                <p className="text-xs lg:text-sm text-secondary font-[family-name:var(--font-oswald)] leading-relaxed">
                  {desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
