"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, CalendarCheck, User, Barbell } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/",          label: "Inicio",    Icon: House },
  { href: "/bookings",  label: "Mis turnos", Icon: CalendarCheck },
  { href: "/packs",     label: "Packs",     Icon: Barbell },
  { href: "/profile",   label: "Perfil",    Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bottom-nav-safe">
      {/* double-bezel: outer shell */}
      <div className="mx-3 mb-3 rounded-2xl border border-white/[0.06] bg-zinc-900/80 p-1 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,.5)]">
        {/* inner core */}
        <div className="grid grid-cols-4 rounded-xl overflow-hidden">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 px-2 transition-all duration-200",
                  "active:scale-95",
                  active
                    ? "text-orange-500"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon
                  weight={active ? "fill" : "regular"}
                  size={22}
                  className="transition-transform duration-200"
                />
                <span className="text-[10px] font-medium tracking-wide">
                  {label}
                </span>
                {active && (
                  <span className="absolute bottom-[10px] h-[3px] w-6 rounded-full bg-orange-500 blur-[2px]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
