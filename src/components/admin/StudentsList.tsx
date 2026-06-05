"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import Link from "next/link";
import { ToggleStudentButton } from "@/components/admin/ToggleStudentButton";
import {
  MagnifyingGlassIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Student = {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  createdAt: Date;
  upcomingCount: number;
};

type Props = {
  students: Student[];
  totalPages: number;
  currentPage: number;
  query: string;
  total: number;
};

export function StudentsList({
  students,
  totalPages,
  currentPage,
  query,
  total,
}: Props) {
  const router = useRouter();

  const buildLink = (page: number, q: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (q) params.set("q", q);
    const qs = params.toString();
    return `/dashboard/admin/students${qs ? `?${qs}` : ""}`;
  };

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      router.replace(buildLink(1, value.trim()));
    }, 300);
  };

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <MagnifyingGlassIcon
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6B7A] pointer-events-none"
        />
        <input
          type="search"
          placeholder="Buscar por nombre o email…"
          defaultValue={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full h-12 bg-[#0A1F2A] border border-[#1A4A63] rounded-[2px] pl-9 pr-4 text-sm sm:text-base text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837]/50 transition-colors"
        />
      </div>

      {/* Lista */}
      {students.length === 0 ? (
        <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-12 text-center">
          <p className="text-sm md:text-base text-[#6B8A99]">
            {query
              ? "Sin resultados para esa búsqueda."
              : "No hay alumnos registrados."}
          </p>
        </div>
      ) : (
        <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
          <div className="divide-y divide-[#1A4A63]">
            {students.map((s, i) => {
              const initials = s.name
                ? s.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : s.email[0].toUpperCase();

              return (
                <div
                  key={s.id}
                  onClick={() =>
                    router.push(`/dashboard/admin/students/${s.id}`)
                  }
                  className={cn(
                    "flex items-center gap-3 px-4 md:px-5 py-3 md:py-4 cursor-pointer hover:bg-white/[0.03] transition-colors animate-in",
                    `stagger-${Math.min(i + 1, 6)}`,
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "size-9 md:size-10 rounded-[2px] border flex items-center justify-center text-xs md:text-sm font-semibold shrink-0",
                      s.isActive
                        ? "bg-[#0E2A38] border-[#1A4A63] text-[#EAEAEA]"
                        : "bg-[#0A1F2A] border-[#1A4A63] text-[#4A6B7A]",
                    )}
                  >
                    {initials}
                  </div>

                  {/* Nombre + email */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm md:text-base font-medium truncate leading-tight",
                        s.isActive ? "text-[#EAEAEA]" : "text-[#6B8A99]",
                      )}
                    >
                      {s.name ?? "Sin nombre"}
                    </p>
                  </div>

                  {/* Próximas reservas */}
                  <span
                    className={cn(
                      "text-xs md:text-sm font-mono tabular-nums shrink-0 hidden sm:block",
                      s.upcomingCount > 0 ? "text-[#27C7B8]" : "text-[#4A6B7A]",
                    )}
                  >
                    {s.upcomingCount > 0
                      ? `${s.upcomingCount} turno${s.upcomingCount !== 1 ? "s" : ""}`
                      : "Sin turnos"}
                  </span>

                  {/* Badge inactivo */}
                  {!s.isActive && (
                    <span className="text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full bg-[#0E2A38] text-[#6B8A99] shrink-0 hidden md:block">
                      Inactivo
                    </span>
                  )}

                  {/* Acciones */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <ToggleStudentButton
                      studentId={s.id}
                      initialIsActive={s.isActive}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Link
            href={buildLink(currentPage - 1, query)}
            className={cn(
              "size-9 rounded-[2px] border border-[#1A4A63] bg-[#0E2A38] flex items-center justify-center text-[#6B8A99] hover:text-[#EAEAEA] hover:border-[#F78837] transition-colors shrink-0",
              currentPage <= 1 && "pointer-events-none opacity-30",
            )}
          >
            <CaretLeftIcon size={18} weight="bold" />
          </Link>
          <span className="text-xs md:text-sm text-[#6B8A99] tabular-nums">
            Página {currentPage} de {totalPages}
          </span>
          <Link
            href={buildLink(currentPage + 1, query)}
            className={cn(
              "size-9 rounded-[2px] border border-[#1A4A63] bg-[#0E2A38] flex items-center justify-center text-[#6B8A99] hover:text-[#EAEAEA] hover:border-[#F78837] transition-colors shrink-0",
              currentPage >= totalPages && "pointer-events-none opacity-30",
            )}
          >
            <CaretRightIcon size={18} weight="bold" />
          </Link>
        </div>
      )}
    </div>
  );
}
