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
  ChartLineUp,
  Receipt,
  ChartPieSlice,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard/admin", label: "Dashboard", Icon: ChartBar },
  { href: "/dashboard/admin/classes", label: "Clases", Icon: CalendarBlank },
  { href: "/dashboard/admin/disciplines", label: "Disciplinas", Icon: Tag },
  { href: "/dashboard/admin/students", label: "Alumnos", Icon: Users },
  { href: "/dashboard/admin/coaches", label: "Coaches", Icon: Barbell },
  {
    href: "/dashboard/admin/packs",
    label: "Abonos",
    Icon: CurrencyCircleDollar,
  },
  {
    href: "/dashboard/admin/payments",
    label: "Pagos",
    Icon: Receipt,
  },
  {
    href: "/dashboard/admin/finances",
    label: "Finanzas",
    Icon: ChartLineUp,
  },
  {
    href: "/dashboard/admin/metrics",
    label: "Métricas",
    Icon: ChartPieSlice,
  },
  { href: "/dashboard/admin/news", label: "Noticias", Icon: Megaphone },
  { href: "/dashboard/admin/settings", label: "Configuración", Icon: Gear },
];

export function AdminSidebar({ logoSrc }: { logoSrc?: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-dvh border-r border-[#1A4A63] bg-[#0A1F2A] p-4 gap-1">
      {/* Brand */}
      <div className="flex justify-center gap-1 px-2 py-3 mb-3">
        <div className="w-28 h-28 rounded-xl border border-[#1A4A63] bg-[#0E2A38] overflow-hidden flex items-center justify-center p-2">
          <img
            src={logoSrc ?? "/icons/image.png?v=2"}
            alt="Box Turno"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-[2px] text-sm lg:text-base font-medium transition-all duration-150",
              "active:scale-[0.97]",
              active
                ? "bg-[#F78837]/10 text-[#F78837] border border-[#F78837]/20"
                : "text-[#6B8A99] hover:text-[#EAEAEA] hover:bg-[#0A1F2A]",
            )}
          >
            <Icon weight={active ? "fill" : "regular"} size={18} className="lg:size-5" />
            {label}
          </Link>
        );
      })}
    </aside>
  );
}
