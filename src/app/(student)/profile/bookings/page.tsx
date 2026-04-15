import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeftIcon, CalendarBlank, Clock, User } from "@phosphor-icons/react/dist/ssr";
import { formatDate, formatTime, cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Historial de turnos" };

const PAGE_SIZE = 10;

type Props = { searchParams: Promise<{ limit?: string }> };

export default async function BookingHistoryPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userId = session.user.id;
  const { limit: limitParam } = await searchParams;
  const limit = Math.max(PAGE_SIZE, Math.min(100, Number(limitParam) || PAGE_SIZE));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [upcoming, past] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId,
        classDate: { gte: today },
        deletedAt: null,
        status: { in: ["CONFIRMED", "WAITLISTED"] },
      },
      select: {
        id: true, status: true, classDate: true, waitlistPos: true,
        class: { select: { startTime: true, endTime: true, color: true, dayOfWeek: true, coach: { select: { name: true } }, discipline: { select: { name: true } } } },
      },
      orderBy: { classDate: "asc" },
      take: limit + 1,
    }),
    prisma.booking.findMany({
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
    }),
  ]);

  const upcomingHasMore = upcoming.length > limit;
  const pastHasMore = past.length > limit;
  const upcomingItems = upcoming.slice(0, limit);
  const pastItems = past.slice(0, limit);

  const upcomingConfirmed = upcomingItems.filter((b) => b.status === "CONFIRMED").length;
  const pastConfirmed = pastItems.filter((b) => b.status === "CONFIRMED").length;
  const pastCancelled = pastItems.filter((b) => b.status === "CANCELLED").length;

  return (
    <section className="pt-5 space-y-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeftIcon size={13} />
        Perfil
      </Link>

      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Cuenta</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Mis turnos</h2>
      </div>

      {/* Próximos turnos */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex-1">
            Próximos
          </h3>
          <span className="text-xs font-mono font-bold tabular-nums text-emerald-500">
            {upcomingConfirmed} / {upcomingItems.length}
          </span>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          {upcomingItems.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-8">Sin turnos próximos.</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {upcomingItems.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.class.color ?? "#f97316" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">
                      {b.class.discipline?.name ?? "Sin disciplina"}
                    </p>
                    <p className="text-xs text-zinc-600 flex items-center gap-2">
                      <span>{formatDate(new Date(b.classDate))}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">
                        {formatTime(b.class.startTime)} – {formatTime(b.class.endTime)}
                      </span>
                    </p>
                  </div>
                  {b.status === "WAITLISTED" && (
                    <span className="text-[10px] text-orange-500 font-medium shrink-0">
                      #{b.waitlistPos} espera
                    </span>
                  )}
                  {b.status === "CONFIRMED" && (
                    <span className="text-[10px] text-emerald-500 font-medium shrink-0">
                      Confirmado
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {upcomingHasMore && (
          <Link
            href={`/profile/bookings?limit=${limit + PAGE_SIZE}`}
            className="w-full flex items-center justify-center h-10 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors mt-3"
          >
            Ver más próximos
          </Link>
        )}
      </div>

      {/* Historial pasado */}
      {pastItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="size-1.5 rounded-full bg-zinc-600" />
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex-1">
              Historial
            </h3>
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
              <span className="text-emerald-600">{pastConfirmed}</span>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-500">{pastCancelled}</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {pastItems.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.class.color ?? "#f97316" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm truncate",
                      b.status === "CANCELLED" ? "text-zinc-600 line-through" : "text-zinc-300"
                    )}>
                      {b.class.discipline?.name ?? "Sin disciplina"}
                    </p>
                    <p className="text-xs text-zinc-700 flex items-center gap-2">
                      <span>{formatDate(new Date(b.classDate))}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">
                        {formatTime(b.class.startTime)} – {formatTime(b.class.endTime)}
                      </span>
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium shrink-0",
                    b.status === "CONFIRMED" && "text-emerald-600",
                    b.status === "CANCELLED" && "text-zinc-600",
                    b.status === "WAITLISTED" && "text-orange-600",
                  )}>
                    {b.status === "CONFIRMED" && "Asistió"}
                    {b.status === "CANCELLED" && "Canceló"}
                    {b.status === "WAITLISTED" && "En espera"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {pastHasMore && (
            <Link
              href={`/profile/bookings?limit=${limit + PAGE_SIZE}`}
              className="w-full flex items-center justify-center h-10 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors mt-3"
            >
              Ver más historial
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
