import { RemoveAttendeeButton } from "@/components/admin/RemoveAttendeeButton";
import { cn } from "@/lib/utils";

type Booking = {
  id: string;
  status: "CONFIRMED" | "WAITLISTED";
  waitlistPos: number | null;
  createdAt: Date;
  user: { id: string; name: string | null; email: string; image: string | null };
};

type Props = {
  title: string;
  bookings: Booking[];
  emptyMessage?: string;
  accent: "emerald" | "orange";
};

const accentDot: Record<Props["accent"], string> = {
  emerald: "bg-emerald-500",
  orange:  "bg-orange-500",
};

const accentCounter: Record<Props["accent"], string> = {
  emerald: "text-emerald-500",
  orange:  "text-orange-500",
};

export function AttendeesList({ title, bookings, emptyMessage, accent }: Props) {
  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={cn("size-1.5 rounded-full", accentDot[accent])} />
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex-1">
          {title}
        </h3>
        <span className={cn("text-xs font-mono font-bold tabular-nums", accentCounter[accent])}>
          {bookings.length}
        </span>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {bookings.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-8">
            {emptyMessage ?? "Sin registros."}
          </p>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {bookings.map((b, i) => {
              const initials = b.user.name
                ? b.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                : b.user.email[0].toUpperCase();

              return (
                <div
                  key={b.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    "animate-in",
                    `stagger-${Math.min(i + 1, 6)}`
                  )}
                >
                  {/* Número / posición */}
                  <span className="text-xs font-mono text-zinc-700 w-5 text-right shrink-0">
                    {b.status === "WAITLISTED" ? `#${b.waitlistPos}` : `${i + 1}`}
                  </span>

                  {/* Avatar */}
                  <div className="size-8 rounded-xl bg-zinc-800 border border-white/[0.06] flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0">
                    {initials}
                  </div>

                  {/* Nombre + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate leading-tight">
                      {b.user.name ?? "—"}
                    </p>
                    <p className="text-xs text-zinc-600 truncate">{b.user.email}</p>
                  </div>

                  {/* Hora de reserva */}
                  <span className="text-[10px] text-zinc-700 font-mono shrink-0 hidden sm:block">
                    {new Date(b.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </span>

                  {/* Acción — solo admins pueden eliminar */}
                  <RemoveAttendeeButton bookingId={b.id} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
