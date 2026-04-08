import Link from "next/link";
import { formatTime } from "@/lib/utils";
import { OccupancyBar } from "@/components/admin/OccupancyBar";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";

type ClassRow = {
  id: string;
  name: string;
  startTime: string;
  maxCapacity: number;
  color?: string | null;
  coach: { name: string | null } | null;
  bookings: { status: string }[];
};

type Props = {
  classes: ClassRow[];
  classDate: Date;
  gymId: string;
  basePath?: string;
};

export function TodayClassesTable({ classes, classDate, basePath = "/dashboard/admin/classes" }: Props) {
  if (classes.length === 0) {
    return (
      <div className="glass-card rounded-2xl px-4 py-10 text-center">
        <p className="text-sm text-zinc-500">No hay clases programadas para hoy.</p>
      </div>
    );
  }

  const dateParam = classDate.toISOString().split("T")[0];

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="divide-y divide-white/[0.04]">
        {classes.map((c) => {
          const confirmed  = c.bookings.filter((b) => b.status === "CONFIRMED").length;
          const waitlisted = c.bookings.filter((b) => b.status === "WAITLISTED").length;

          return (
            <Link
              key={c.id}
              href={`${basePath}/${c.id}?date=${dateParam}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors group"
            >
              {/* Dot de color */}
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: c.color ?? "#f97316" }}
              />

              {/* Hora */}
              <span className="font-mono text-xs text-zinc-500 w-14 shrink-0 tabular-nums">
                {formatTime(c.startTime)}
              </span>

              {/* Nombre + coach */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-100 truncate leading-tight">{c.name}</p>
                {c.coach?.name && (
                  <p className="text-[11px] text-zinc-600 truncate">{c.coach.name}</p>
                )}
              </div>

              {/* Barra de ocupación */}
              <div className="w-32 shrink-0 hidden sm:block">
                <OccupancyBar confirmed={confirmed} waitlisted={waitlisted} max={c.maxCapacity} />
              </div>

              {/* Cupos en mobile (sin barra) */}
              <span className="font-mono text-xs text-zinc-400 sm:hidden tabular-nums shrink-0">
                {confirmed}/{c.maxCapacity}
              </span>

              {waitlisted > 0 && (
                <span className="text-[10px] text-orange-500 shrink-0 hidden md:block">
                  +{waitlisted}
                </span>
              )}

              <ArrowRightIcon
                size={13}
                className="text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
