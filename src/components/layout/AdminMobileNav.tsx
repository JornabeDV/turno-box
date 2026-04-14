"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ListIcon,
  XIcon,
  ChartBarIcon,
  CalendarBlankIcon,
  UsersIcon,
  BarbellIcon,
  CurrencyCircleDollarIcon,
  TagIcon,
  GearIcon,
  MegaphoneIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard/admin",             label: "Dashboard",     Icon: ChartBarIcon },
  { href: "/dashboard/admin/classes",     label: "Clases",        Icon: CalendarBlankIcon },
  { href: "/dashboard/admin/disciplines", label: "Disciplinas",   Icon: TagIcon },
  { href: "/dashboard/admin/students",    label: "Alumnos",       Icon: UsersIcon },
  { href: "/dashboard/admin/coaches",     label: "Coaches",       Icon: BarbellIcon },
  { href: "/dashboard/admin/packs",       label: "Abonos",        Icon: CurrencyCircleDollarIcon },
  { href: "/dashboard/admin/news",        label: "Noticias",      Icon: MegaphoneIcon },
  { href: "/dashboard/admin/settings",    label: "Configuración", Icon: GearIcon },
];

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el drawer cuando cambia la ruta
  useEffect(() => { setOpen(false); }, [pathname]);

  // Bloquea el scroll del body mientras el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Botón hamburguesa — solo mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center size-8 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all active:scale-90"
        aria-label="Abrir menú"
      >
        <ListIcon size={20} />
      </button>

      {/* Overlay + Drawer con animación */}
      <AnimatePresence>
        {open && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="relative w-72 max-w-[85vw] min-h-dvh bg-[#0f0f0f] border-r border-white/[0.06] flex flex-col p-4 gap-1"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Header del drawer */}
              <div className="flex items-center justify-between px-2 py-3 mb-4">
                <div className="flex flex-col gap-1">
                  <span className="bg-white rounded-xl px-2 py-1.5 flex items-center self-start">
                    <img src="/icons/Logo-header.png" alt="Bee Box" className="h-14 w-auto" />
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="size-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                  aria-label="Cerrar menú"
                >
                  <XIcon size={18} />
                </button>
              </div>

              {/* Nav items */}
              {NAV_ITEMS.map(({ href, label, Icon }) => {
                const active = pathname === href || (href !== "/dashboard/admin" && pathname.startsWith(href + "/"));
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
