import { cn } from "@/lib/utils";

type Props = {
  confirmed: number;
  waitlisted?: number;
  max: number;
  large?: boolean;     // versión para el detalle de clase
};

export function OccupancyBar({ confirmed, waitlisted = 0, max, large = false }: Props) {
  const pct = max > 0 ? Math.min((confirmed / max) * 100, 100) : 0;
  const available = Math.max(0, max - confirmed);

  // Color de la barra según ocupación
  const barColor =
    pct >= 100 ? "bg-rose-500" :
    pct >= 75  ? "bg-amber-500" :
    "bg-emerald-500";

  const labelColor =
    pct >= 100 ? "text-rose-400" :
    pct >= 75  ? "text-amber-400" :
    "text-emerald-400";

  if (large) {
    return (
      <div className="space-y-2">
        {/* Números */}
        <div className="flex items-end justify-between">
          <div>
            <span className={cn("text-3xl font-bold tabular-nums leading-none", labelColor)}>
              {confirmed}
            </span>
            <span className="text-lg text-zinc-600 font-mono">/{max}</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">
              {available > 0 ? (
                <span className="text-emerald-500">{available} {available === 1 ? "cupo libre" : "cupos libres"}</span>
              ) : (
                <span className="text-rose-500">Completo</span>
              )}
            </p>
            {waitlisted > 0 && (
              <p className="text-xs text-orange-500">{waitlisted} en espera</p>
            )}
          </div>
        </div>

        {/* Barra */}
        <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Etiqueta % */}
        <p className="text-[10px] text-zinc-600 font-mono">{Math.round(pct)}% de ocupación</p>
      </div>
    );
  }

  // Versión compacta — para la tabla del dashboard
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("text-xs font-mono tabular-nums shrink-0", labelColor)}>
        {confirmed}/{max}
      </span>
    </div>
  );
}
