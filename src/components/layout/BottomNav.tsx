"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Calendar, ShoppingCart, User } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", Icon: Trophy },
  { href: "/bookings", label: "Clases", Icon: Calendar },
  { href: "/packs", label: "Abonos", Icon: ShoppingCart },
  { href: "/profile", label: "Perfil", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bottom-nav-safe">
      <div className="border-t border-[#1A4A63] bg-[#0A1F2A]">
        <div className="grid grid-cols-4">
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
      </div>
    </nav>
  );
}
