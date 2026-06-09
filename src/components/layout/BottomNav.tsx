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
      className="fixed bottom-0 inset-x-0 z-50 bg-[#0A1F2A] border-t border-[#1A4A63]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4 max-w-5xl mx-auto">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 px-1 transition-all duration-150",
                "active:scale-[0.97]",
                active
                  ? "bg-[#F78837] text-[#0A1F2A]"
                  : "text-[#6B8A99] hover:text-[#EAEAEA]",
              )}
            >
              <Icon
                weight="regular"
                size={22}
                className="transition-transform duration-150"
              />
              <span className="text-[10px] font-medium uppercase tracking-wide font-[family-name:var(--font-oswald)]">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
