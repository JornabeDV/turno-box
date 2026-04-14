"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBar,
  CalendarBlank,
  Users,
  Barbell,
  CurrencyCircleDollar,
  Tag,
  Gear,
  Megaphone,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard/admin",             label: "Dashboard",     Icon: ChartBar },
  { href: "/dashboard/admin/classes",     label: "Clases",        Icon: CalendarBlank },
  { href: "/dashboard/admin/disciplines", label: "Disciplinas",   Icon: Tag },
  { href: "/dashboard/admin/students",    label: "Alumnos",       Icon: Users },
  { href: "/dashboard/admin/coaches",     label: "Coaches",       Icon: Barbell },
  { href: "/dashboard/admin/packs",       label: "Abonos",        Icon: CurrencyCircleDollar },
  { href: "/dashboard/admin/news",        label: "Noticias",      Icon: Megaphone },
  { href: "/dashboard/admin/settings",    label: "Configuración", Icon: Gear },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-dvh border-r border-white/[0.06] bg-[#0f0f0f] p-4 gap-1">
      {/* Brand */}
      <div className="flex justify-center gap-1 px-2 py-3 mb-4">
        <span className="bg-white rounded-xl px-2 py-1.5 flex items-center self-start">
          <img src="/icons/Logo-header.png" alt="Bee Box" className="h-20 w-auto" />
        </span>
      </div>

      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
              "active:scale-[0.97]",
              active
                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
            )}
          >
            <Icon weight={active ? "fill" : "regular"} size={18} />
            {label}
          </Link>
        );
      })}
    </aside>
  );
}
