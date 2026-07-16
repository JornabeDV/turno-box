import { RemoveAttendeeButton } from "@/components/admin/RemoveAttendeeButton";
import { cn } from "@/lib/utils";

type Booking = {
  id: string;
  status: "CONFIRMED" | "WAITLISTED";
  waitlistPos: number | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

type Props = {
  title: string;
  bookings: Booking[];
  emptyMessage?: string;
  accent: "emerald" | "orange";
  allowRemove?: boolean;
};

const accentDot: Record<Props["accent"], string> = {
  emerald: "bg-success",
  orange: "bg-brand",
};

const accentCounter: Record<Props["accent"], string> = {
  emerald: "text-success",
  orange: "text-brand",
};

export function AttendeesList({
  title,
  bookings,
  emptyMessage,
  accent,
  allowRemove = true,
}: Props) {
  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={cn("size-1.5 rounded-full", accentDot[accent])} />
        <h3 className="text-xs md:text-base font-semibold text-secondary uppercase tracking-wider flex-1">
          {title}
        </h3>
        <span
          className={cn(
            "text-xs md:text-sm font-mono font-bold tabular-nums",
            accentCounter[accent],
          )}
        >
          {bookings.length}
        </span>
      </div>

      <div className="bg-card border border-border overflow-hidden">
        {bookings.length === 0 ? (
          <p className="text-xs md:text-base text-muted text-center py-8">
            {emptyMessage ?? "Sin registros."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {bookings.map((b, i) => {
              const initials = b.user.name
                ? b.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : b.user.email[0].toUpperCase();

              return (
                <div
                  key={b.id}
                  className={cn(
                    "flex items-center gap-3 px-4 md:px-5 py-3 md:py-4",
                    "animate-in",
                    `stagger-${Math.min(i + 1, 6)}`,
                  )}
                >
                  {/* Número / posición */}
                  <span className="text-xs md:text-sm font-mono text-muted w-5 text-right shrink-0">
                    {b.status === "WAITLISTED"
                      ? `#${b.waitlistPos}`
                      : `${i + 1}`}
                  </span>

                  {/* Avatar */}
                  <div className="size-8 md:size-9 rounded-[2px] bg-card border border-border flex items-center justify-center text-xs md:text-sm font-semibold text-primary shrink-0">
                    {initials}
                  </div>

                  {/* Nombre + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base font-medium text-primary truncate leading-tight">
                      {b.user.name ?? "—"}
                    </p>
                  </div>

                  {/* Hora de reserva */}
                  <span className="text-xs md:text-sm text-muted font-mono shrink-0 hidden sm:block">
                    {new Date(b.createdAt).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {/* Acción — solo admins pueden eliminar */}
                  {allowRemove && <RemoveAttendeeButton bookingId={b.id} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
