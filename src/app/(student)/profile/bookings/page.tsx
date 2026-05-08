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
    <section className="pt-4 space-y-4">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-xs text-[#6B8A99] hover:text-[#EAEAEA] transition-colors font-[family-name:var(--font-oswald)] uppercase tracking-wide"
      >
        <ArrowLeftIcon size={13} />
        Perfil
      </Link>

      <div>
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl">
          Historial de turnos
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-16 text-center">
          <p className="text-sm text-[#6B8A99] font-[family-name:var(--font-oswald)] uppercase tracking-wide">Aún no tenés turnos.</p>
        </div>
      ) : (
        <>
          <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden divide-y divide-[#1A4A63]">
            {items.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3.5">
                <span
                  className="size-1.5 shrink-0"
                  style={{ backgroundColor: b.class.color ?? "#F78837" }}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-[family-name:var(--font-oswald)] font-bold uppercase tracking-tight truncate",
                    b.status === "CANCELLED" ? "text-[#4A6B7A] line-through" : "text-[#EAEAEA]"
                  )}>
                    {b.class.discipline?.name ?? "Sin disciplina"}
                  </p>
                  <p className="text-[11px] text-[#4A6B7A] tabular-nums font-[family-name:var(--font-jetbrains)]">
                    {new Date(b.classDate).toLocaleDateString("es-AR", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                    {" · "}
                    {formatTime(b.class.startTime)} – {formatTime(b.class.endTime)}
                  </p>
                </div>
                <span className={cn(
                  "text-[10px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider shrink-0",
                  b.status === "CONFIRMED" && "text-[#27C7B8]",
                  b.status === "CANCELLED" && "text-[#4A6B7A]",
                  b.status === "WAITLISTED" && "text-[#F78837]",
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
              className="w-full flex items-center justify-center h-10 border border-[#1A4A63] text-sm text-[#6B8A99] hover:text-[#EAEAEA] hover:border-[#6B8A99] transition-colors font-[family-name:var(--font-oswald)] uppercase tracking-wide"
            >
              Ver más
            </Link>
          )}
        </>
      )}
    </section>
  );
}
