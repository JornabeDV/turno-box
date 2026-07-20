"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Calendar, Wallet, User } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Inicio", Icon: House },
  { href: "/bookings", label: "Reservas", Icon: Calendar },
  { href: "/credits", label: "Créditos", Icon: Wallet },
  { href: "/profile", label: "Perfil", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 w-full bg-page border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="grid grid-cols-4 max-w-5xl mx-auto">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 md:gap-1.5 py-2.5 px-1 md:py-4 md:px-2 transition-all duration-150",
                "active:scale-[0.97]",
                active
                  ? "bg-brand text-page"
                  : "text-secondary hover:text-primary",
              )}
            >
              <Icon
                weight="regular"
                size={22}
                className="transition-transform duration-150 md:size-7"
              />
              <span className="text-[10px] md:text-xs font-medium uppercase tracking-wide font-[family-name:var(--font-oswald)]">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
