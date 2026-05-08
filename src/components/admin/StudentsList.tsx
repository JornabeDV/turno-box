"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToggleStudentButton } from "@/components/admin/ToggleStudentButton";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Student = {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  createdAt: Date;
  upcomingCount: number;
};

type Props = { students: Student[] };

export function StudentsList({ students }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? students.filter((s) => {
        const q = query.toLowerCase();
        return (
          s.name?.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
        );
      })
    : students;

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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-10 bg-[#0A1F2A] border border-[#1A4A63] rounded-[2px] pl-9 pr-4 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837]/50 transition-colors"
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-12 text-center">
          <p className="text-sm text-[#6B8A99]">
            {query
              ? "Sin resultados para esa búsqueda."
              : "No hay alumnos registrados."}
          </p>
        </div>
      ) : (
        <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
          <div className="divide-y divide-[#1A4A63]">
            {filtered.map((s, i) => {
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
                    "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors animate-in",
                    `stagger-${Math.min(i + 1, 6)}`,
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "size-9 rounded-[2px] border flex items-center justify-center text-xs font-semibold shrink-0",
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
                        "text-sm font-medium truncate leading-tight",
                        s.isActive ? "text-[#EAEAEA]" : "text-[#6B8A99]",
                      )}
                    >
                      {s.name ?? "Sin nombre"}
                    </p>
                    <p className="text-xs text-[#4A6B7A] truncate">{s.email}</p>
                  </div>

                  {/* Próximas reservas */}
                  <span
                    className={cn(
                      "text-xs font-mono tabular-nums shrink-0 hidden sm:block",
                      s.upcomingCount > 0 ? "text-[#27C7B8]" : "text-[#4A6B7A]",
                    )}
                  >
                    {s.upcomingCount > 0
                      ? `${s.upcomingCount} turno${s.upcomingCount !== 1 ? "s" : ""}`
                      : "Sin turnos"}
                  </span>

                  {/* Badge inactivo */}
                  {!s.isActive && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#0E2A38] text-[#6B8A99] shrink-0 hidden md:block">
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

      <p className="text-xs text-[#4A6B7A] px-1">
        {filtered.length} {filtered.length === 1 ? "alumno" : "alumnos"}
        {query && ` · filtrando por "${query}"`}
      </p>
    </div>
  );
}
