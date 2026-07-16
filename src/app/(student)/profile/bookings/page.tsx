import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { formatTime, cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Historial de turnos" };

const PAGE_SIZE = 5;

type Props = { searchParams: Promise<{ limit?: string }> };

export default async function BookingHistoryPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userId = session.user.id;
  const { limit: limitParam } = await searchParams;
  const limit = Math.max(
    PAGE_SIZE,
    Math.min(200, Number(limitParam) || PAGE_SIZE),
  );

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
      classDate: true,
      createdAt: true,
      class: {
        select: {
          startTime: true,
          endTime: true,
          color: true,
          dayOfWeek: true,
          coach: { select: { name: true } },
          discipline: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const hasMore = bookings.length > limit;
  const items = bookings.slice(0, limit);
  const nextLimit = limit + PAGE_SIZE;

  return (
    <section className="pt-4 md:pt-8 space-y-4 md:space-y-6">
      <BackButton href="/profile" />

      <div>
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-2xl md:text-4xl">
          Historial de turnos
        </h2>
        <p className="text-sm md:text-lg text-secondary mt-1 md:mt-2 font-[family-name:var(--font-oswald)]">
          Todos tus turnos y su estado
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-card border border-border px-4 py-16 md:px-6 md:py-20 text-center">
          <p className="text-sm md:text-base text-secondary font-[family-name:var(--font-oswald)] uppercase tracking-wide">
            Aún no tenés turnos.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border overflow-hidden divide-y divide-border">
            {items.map((b) => {
              const isPast = new Date(b.classDate) < today;
              return (
                <div key={b.id} className="flex items-center gap-3 md:gap-4 px-4 py-3.5 md:px-6 md:py-5">
                  <span
                    className={cn(
                      "size-1.5 md:size-2 shrink-0",
                      b.status === "CANCELLED" && "bg-muted",
                      b.status === "WAITLISTED" && "bg-brand",
                      b.status === "CONFIRMED" && isPast && "bg-emerald-600",
                      b.status === "CONFIRMED" && !isPast && "bg-success",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm md:text-lg font-[family-name:var(--font-oswald)] font-bold uppercase tracking-tight truncate",
                        b.status === "CANCELLED"
                          ? "text-muted line-through"
                          : "text-primary",
                      )}
                    >
                      {b.class.discipline?.name ?? "Sin disciplina"}
                    </p>
                    <p className="text-[11px] md:text-sm text-muted tabular-nums font-[family-name:var(--font-jetbrains)]">
                      {new Date(b.classDate).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                      {" · "}
                      {formatTime(b.class.startTime)} –{" "}
                      {formatTime(b.class.endTime)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider shrink-0",
                      b.status === "CONFIRMED" && isPast && "text-emerald-600",
                      b.status === "CONFIRMED" && !isPast && "text-success",
                      b.status === "CANCELLED" && "text-muted",
                      b.status === "WAITLISTED" && "text-brand",
                    )}
                  >
                    {b.status === "CONFIRMED" && isPast && "Asistió"}
                    {b.status === "CONFIRMED" && !isPast && "Confirmado"}
                    {b.status === "CANCELLED" && "Canceló"}
                    {b.status === "WAITLISTED" && "En lista"}
                  </span>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <Link
              href={`/profile/bookings?limit=${nextLimit}`}
              className="w-full flex items-center justify-center h-12 md:h-14 border border-border text-sm md:text-base text-secondary hover:text-primary hover:border-secondary transition-colors font-[family-name:var(--font-oswald)] uppercase tracking-wide"
            >
              Ver más
            </Link>
          )}
        </>
      )}
    </section>
  );
}
