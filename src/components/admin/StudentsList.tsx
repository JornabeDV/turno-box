"use client";

import { useState } from "react";
import Link from "next/link";
import { ToggleStudentButton } from "@/components/admin/ToggleStudentButton";
import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
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
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? students.filter((s) => {
        const q = query.toLowerCase();
        return (
          s.name?.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
        );
      })
    : students;

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <MagnifyingGlassIcon
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"
        />
        <input
          type="search"
          placeholder="Buscar por nombre o email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-10 bg-zinc-900 border border-white/[0.08] rounded-xl pl-9 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl px-4 py-12 text-center">
          <p className="text-sm text-zinc-500">
            {query ? "Sin resultados para esa búsqueda." : "No hay alumnos registrados."}
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((s, i) => {
              const initials = s.name
                ? s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                : s.email[0].toUpperCase();

              return (
                <div
                  key={s.id}
                  className={cn("flex items-center gap-3 px-4 py-3 animate-in", `stagger-${Math.min(i + 1, 6)}`)}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "size-9 rounded-xl border flex items-center justify-center text-xs font-semibold shrink-0",
                    s.isActive
                      ? "bg-zinc-800 border-white/[0.06] text-zinc-300"
                      : "bg-zinc-900 border-white/[0.04] text-zinc-600"
                  )}>
                    {initials}
                  </div>

                  {/* Nombre + email */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate leading-tight", s.isActive ? "text-zinc-100" : "text-zinc-500")}>
                      {s.name ?? "Sin nombre"}
                    </p>
                    <p className="text-xs text-zinc-600 truncate">{s.email}</p>
                  </div>

                  {/* Próximas reservas */}
                  <span className={cn(
                    "text-xs font-mono tabular-nums shrink-0 hidden sm:block",
                    s.upcomingCount > 0 ? "text-emerald-500" : "text-zinc-700"
                  )}>
                    {s.upcomingCount > 0 ? `${s.upcomingCount} turno${s.upcomingCount !== 1 ? "s" : ""}` : "Sin turnos"}
                  </span>

                  {/* Badge inactivo */}
                  {!s.isActive && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 shrink-0 hidden md:block">
                      Inactivo
                    </span>
                  )}

                  {/* Acciones */}
                  <ToggleStudentButton studentId={s.id} initialIsActive={s.isActive} />

                  <Link
                    href={`/dashboard/admin/students/${s.id}`}
                    className="size-7 rounded-lg flex items-center justify-center text-zinc-700 hover:text-zinc-400 hover:bg-white/[0.04] transition-all shrink-0"
                  >
                    <ArrowRightIcon size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-700 px-1">
        {filtered.length} {filtered.length === 1 ? "alumno" : "alumnos"}
        {query && ` · filtrando por "${query}"`}
      </p>
    </div>
  );
}
