"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ListIcon,
  ChartBarIcon,
  CalendarBlankIcon,
  CalendarCheckIcon,
  UsersIcon,
  BarbellIcon,
  CurrencyCircleDollarIcon,
  TagIcon,
  GearIcon,
  MegaphoneIcon,
  ChartLineUpIcon,
  ReceiptIcon,
  ChartPieSliceIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard/admin", label: "Panel General", Icon: ChartBarIcon },
  {
    href: "/dashboard/admin/my-classes",
    label: "Mis clases",
    Icon: CalendarCheckIcon,
  },
  {
    href: "/dashboard/admin/classes",
    label: "Clases",
    Icon: CalendarBlankIcon,
  },
  { href: "/dashboard/admin/disciplines", label: "Disciplinas", Icon: TagIcon },
  { href: "/dashboard/admin/students", label: "Alumnos", Icon: UsersIcon },
  { href: "/dashboard/admin/coaches", label: "Profesores", Icon: BarbellIcon },
  {
    href: "/dashboard/admin/packs",
    label: "Abonos",
    Icon: CurrencyCircleDollarIcon,
  },
  {
    href: "/dashboard/admin/payments",
    label: "Pagos",
    Icon: ReceiptIcon,
  },
  {
    href: "/dashboard/admin/finances",
    label: "Finanzas",
    Icon: ChartLineUpIcon,
  },
  {
    href: "/dashboard/admin/metrics",
    label: "Métricas",
    Icon: ChartPieSliceIcon,
  },
  { href: "/dashboard/admin/news", label: "Noticias", Icon: MegaphoneIcon },
  { href: "/dashboard/admin/settings", label: "Configuración", Icon: GearIcon },
];

export function AdminMobileNav({ logoSrc }: { logoSrc?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el drawer cuando cambia la ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquea el scroll del body mientras el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Botón hamburguesa — solo mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center size-8 rounded-[2px] text-secondary hover:text-primary hover:bg-card transition-all active:scale-90"
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
              className="absolute inset-0 bg-black/60 "
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="relative w-72 max-w-[85vw] min-h-dvh bg-page border-r border-border flex flex-col p-3 gap-1"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Header del drawer */}
              <div className="flex items-center justify-center px-2 py-2">
                <div className="w-24 h-24 rounded-xl border border-border bg-card overflow-hidden flex items-center justify-center p-2">
                  <img
                    src={logoSrc ?? "/icons/image.png?v=2"}
                    alt="Box Turno"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Nav items */}
              {NAV_ITEMS.map(({ href, label, Icon }) => {
                const active =
                  pathname === href ||
                  (href !== "/dashboard/admin" &&
                    pathname.startsWith(href + "/"));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-[2px] text-base font-medium transition-colors duration-150",
                      "active:scale-[0.97]",
                      active
                        ? "bg-brand/10 text-brand border border-brand/20"
                        : "text-secondary hover:text-primary hover:bg-page",
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
