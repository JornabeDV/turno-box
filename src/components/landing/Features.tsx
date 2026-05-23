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
    <section id="funciones" className="py-16 px-4 border-t border-[#1A4A63]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl sm:text-3xl">
            Todo lo que necesitás para tu box
          </h2>
          <p className="mt-2 text-sm text-[#6B8A99] font-[family-name:var(--font-oswald)]">
            En un solo lugar, sin integraciones complicadas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ iconName, title, desc }) => {
            const Icon = ICON_MAP[iconName];
            return (
              <div
                key={title}
                className="border border-[#1A4A63] bg-[#0E2A38] p-5 hover:border-[#6B8A99] transition-colors"
              >
                {Icon && <Icon size={24} className="text-[#F78837] mb-3" />}
                <h3 className="text-sm font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight mb-1">
                  {title}
                </h3>
                <p className="text-xs text-[#6B8A99] font-[family-name:var(--font-oswald)] leading-relaxed">
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
