"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBar,
  Buildings,
  PlusCircle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard/super-admin", label: "Dashboard", Icon: ChartBar },
  { href: "/dashboard/super-admin/gyms", label: "Gimnasios", Icon: Buildings },
  { href: "/dashboard/super-admin/gyms/new", label: "Crear Gimnasio", Icon: PlusCircle },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-dvh border-r border-[#1A4A63] bg-[#0A1F2A] p-4 gap-1">
      {/* Brand */}
      <div className="flex justify-center gap-1 px-2 py-3 mb-3">
        <span className="rounded-[2px] px-2 py-1.5 flex items-center self-start">
          <img
            src="/icons/image.png?v=2"
            alt="Box Turno"
            className="h-28 w-auto"
          />
        </span>
      </div>

      <div className="px-3 py-2 mb-2">
        <span className="text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-widest text-[#F78837]">
          Super Admin
        </span>
      </div>

      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-[2px] text-sm font-medium transition-all duration-150",
              "active:scale-[0.97]",
              active
                ? "bg-[#F78837]/10 text-[#F78837] border border-[#F78837]/20"
                : "text-[#6B8A99] hover:text-[#EAEAEA] hover:bg-[#0A1F2A]",
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
