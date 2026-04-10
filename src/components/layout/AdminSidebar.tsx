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
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard/admin",             label: "Dashboard",     Icon: ChartBar },
  { href: "/dashboard/admin/classes",     label: "Clases",        Icon: CalendarBlank },
  { href: "/dashboard/admin/disciplines", label: "Disciplinas",   Icon: Tag },
  { href: "/dashboard/admin/students",    label: "Alumnos",       Icon: Users },
  { href: "/dashboard/admin/coaches",     label: "Coaches",       Icon: Barbell },
  { href: "/dashboard/admin/packs",       label: "Packs",         Icon: CurrencyCircleDollar },
  { href: "/dashboard/admin/settings",    label: "Configuración", Icon: Gear },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-dvh border-r border-white/[0.06] bg-[#0f0f0f] p-4 gap-1">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 py-3 mb-4">
        <span className="size-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5h11M6.5 17.5h11M12 2v20M2 12h4M18 12h4"/>
          </svg>
        </span>
        <div>
          <p className="text-xs font-bold text-zinc-100 leading-tight">CrossFit</p>
          <p className="text-[10px] text-zinc-500 leading-tight">Admin Panel</p>
        </div>
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
