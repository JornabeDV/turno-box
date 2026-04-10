"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Discipline = { id: string; name: string; color: string | null };

interface Props {
  disciplines: Discipline[];
  weekParam: string;
  basePath?: string;
}

export function DisciplinesManager({ disciplines, weekParam, basePath = "/dashboard/admin/classes" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDiscipline = searchParams.get("discipline") ?? "";

  function navigate(discipline?: string) {
    const params = new URLSearchParams();
    params.set("week", weekParam);
    if (discipline) params.set("discipline", discipline);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => navigate()}
        className={[
          "inline-flex items-center px-3 h-7 rounded-full text-xs font-medium transition-colors",
          !currentDiscipline
            ? "bg-zinc-100 text-zinc-900"
            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
        ].join(" ")}
      >
        Todos
      </button>

      {disciplines.map((d) => {
        const isActive = currentDiscipline === d.name;
        return (
          <button
            key={d.id}
            onClick={() => navigate(d.name)}
            className={[
              "inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-medium transition-colors",
              isActive
                ? "text-zinc-900"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
            ].join(" ")}
            style={isActive ? { backgroundColor: d.color ?? "#f97316" } : undefined}
          >
            {!isActive && (
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: d.color ?? "#f97316" }}
              />
            )}
            {d.name}
          </button>
        );
      })}
    </div>
  );
}
