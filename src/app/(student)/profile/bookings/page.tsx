import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
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
  const limit = Math.max(PAGE_SIZE, Math.min(200, Number(limitParam) || PAGE_SIZE));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: {
      userId,
      classDate: { lt: today },
      deletedAt: null,
    },
    select: {
      id: true, status: true, classDate: true,
      class: { select: { startTime: true, endTime: true, color: true, dayOfWeek: true, coach: { select: { name: true } }, discipline: { select: { name: true } } } },
    },
    orderBy: { classDate: "desc" },
    take: limit + 1,
  });

  const hasMore = bookings.length > limit;
  const items = bookings.slice(0, limit);
  const nextLimit = limit + PAGE_SIZE;

  return (
    <section className="pt-5 space-y-4">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeftIcon size={13} />
        Perfil
      </Link>

      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Cuenta</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Historial de turnos</h2>
      </div>

      {items.length === 0 ? (
        <div className="glass-card rounded-2xl px-4 py-16 text-center">
          <p className="text-sm text-zinc-600">Aún no tenés turnos.</p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
            {items.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3.5">
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: b.class.color ?? "#f97316" }}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    b.status === "CANCELLED" ? "text-zinc-600 line-through" : "text-zinc-100"
                  )}>
                    {b.class.discipline?.name ?? "Sin disciplina"}
                  </p>
                  <p className="text-[11px] text-zinc-600 tabular-nums">
                    {new Date(b.classDate).toLocaleDateString("es-AR", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                    {" · "}
                    {formatTime(b.class.startTime)} – {formatTime(b.class.endTime)}
                  </p>
                </div>
                <span className={cn(
                  "text-[10px] font-medium shrink-0",
                  b.status === "CONFIRMED" && "text-emerald-500",
                  b.status === "CANCELLED" && "text-zinc-600",
                  b.status === "WAITLISTED" && "text-orange-500",
                )}>
                  {b.status === "CONFIRMED" && "Asistió"}
                  {b.status === "CANCELLED" && "Canceló"}
                  {b.status === "WAITLISTED" && "En lista"}
                </span>
              </div>
            ))}
          </div>

          {hasMore && (
            <Link
              href={`/profile/bookings?limit=${nextLimit}`}
              className="w-full flex items-center justify-center h-10 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              Ver más
            </Link>
          )}
        </>
      )}
    </section>
  );
}