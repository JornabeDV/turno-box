import { cn } from "@/lib/utils";

type Props = {
  confirmed: number;
  waitlisted?: number;
  max: number;
  large?: boolean; // versión para el detalle de clase
};

export function OccupancyBar({
  confirmed,
  waitlisted = 0,
  max,
  large = false,
}: Props) {
  const pct = max > 0 ? Math.min((confirmed / max) * 100, 100) : 0;
  const available = Math.max(0, max - confirmed);

  // Color de la barra según ocupación
  const barColor =
    pct >= 100 ? "bg-danger" : pct >= 75 ? "bg-brand" : "bg-success";

  const labelColor =
    pct >= 100
      ? "text-danger"
      : pct >= 75
        ? "text-brand"
        : "text-success";

  if (large) {
    return (
      <div className="space-y-2">
        {/* Números */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 sm:gap-0">
          <div>
            <span
              className={cn(
                "text-3xl font-bold tabular-nums leading-none",
                labelColor,
              )}
            >
              {confirmed}
            </span>
            <span className="text-lg md:text-xl text-muted font-mono">/{max}</span>
          </div>
          <div className="text-right">
            <p className="text-xs md:text-base text-secondary">
              {available > 0 ? (
                <span className="text-success">
                  {available} {available === 1 ? "cupo libre" : "cupos libres"}
                </span>
              ) : (
                <span className="text-danger">Completo</span>
              )}
            </p>
            {waitlisted > 0 && (
              <p className="text-xs md:text-sm text-brand">{waitlisted} en espera</p>
            )}
          </div>
        </div>

        {/* Barra */}
        <div className="h-2.5 w-full rounded-full bg-border/40 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              barColor,
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Etiqueta % */}
        <p className="text-xs md:text-sm text-muted font-mono">
          {Math.round(pct)}% de ocupación
        </p>
      </div>
    );
  }

  // Versión compacta — para la tabla del dashboard
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-border/40 overflow-hidden">
        <div
          className={cn("h-full rounded-full", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn("text-xs font-mono tabular-nums shrink-0", labelColor)}
      >
        {confirmed}/{max}
      </span>
    </div>
  );
}
