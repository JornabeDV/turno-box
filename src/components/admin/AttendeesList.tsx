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
};

const accentDot: Record<Props["accent"], string> = {
  emerald: "bg-[#27C7B8]",
  orange: "bg-[#F78837]",
};

const accentCounter: Record<Props["accent"], string> = {
  emerald: "text-[#27C7B8]",
  orange: "text-[#F78837]",
};

export function AttendeesList({
  title,
  bookings,
  emptyMessage,
  accent,
}: Props) {
  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={cn("size-1.5 rounded-full", accentDot[accent])} />
        <h3 className="text-xs font-semibold text-[#6B8A99] uppercase tracking-wider flex-1">
          {title}
        </h3>
        <span
          className={cn(
            "text-xs font-mono font-bold tabular-nums",
            accentCounter[accent],
          )}
        >
          {bookings.length}
        </span>
      </div>

      <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
        {bookings.length === 0 ? (
          <p className="text-xs text-[#4A6B7A] text-center py-8">
            {emptyMessage ?? "Sin registros."}
          </p>
        ) : (
          <div className="divide-y divide-[#1A4A63]">
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
                    "flex items-center gap-3 px-4 py-3",
                    "animate-in",
                    `stagger-${Math.min(i + 1, 6)}`,
                  )}
                >
                  {/* Número / posición */}
                  <span className="text-xs font-mono text-[#4A6B7A] w-5 text-right shrink-0">
                    {b.status === "WAITLISTED"
                      ? `#${b.waitlistPos}`
                      : `${i + 1}`}
                  </span>

                  {/* Avatar */}
                  <div className="size-8 rounded-[2px] bg-[#0E2A38] border border-[#1A4A63] flex items-center justify-center text-xs font-semibold text-[#EAEAEA] shrink-0">
                    {initials}
                  </div>

                  {/* Nombre + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#EAEAEA] truncate leading-tight">
                      {b.user.name ?? "—"}
                    </p>
                    <p className="text-xs text-[#4A6B7A] truncate">
                      {b.user.email}
                    </p>
                  </div>

                  {/* Hora de reserva */}
                  <span className="text-[10px] text-[#4A6B7A] font-mono shrink-0 hidden sm:block">
                    {new Date(b.createdAt).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
