import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { PushNotificationToggle } from "@/components/profile/PushNotificationToggle";
import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Perfil" };

/** Calcula racha actual: días consecutivos con al menos una clase confirmada. */
function calcStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const unique = [...new Set(dates.map((d) => d.toISOString().split("T")[0]))].sort().reverse();

  const today    = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = new Date(today.getTime() - 86_400_000).toISOString().split("T")[0];

  if (unique[0] !== todayStr && unique[0] !== yesterdayStr) return 0;

  let streak   = 0;
  let checkStr = unique[0];

  for (const d of unique) {
    if (d === checkStr) {
      streak++;
      const prev = new Date(checkStr);
      prev.setDate(prev.getDate() - 1);
      checkStr = prev.toISOString().split("T")[0];
    } else {
      break;
    }
  }
  return streak;
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userId = session.user.id;

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [user, statsThisMonth, statsTotal, allBookingDates] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, birthDate: true, passwordHash: true },
    }),

    prisma.booking.count({
      where: { userId, status: "CONFIRMED", deletedAt: null, classDate: { gte: monthStart } },
    }),

    prisma.booking.count({
      where: { userId, status: "CONFIRMED", deletedAt: null },
    }),

    prisma.booking.findMany({
      where: { userId, status: "CONFIRMED", deletedAt: null },
      select: { classDate: true },
      orderBy: { classDate: "desc" },
      take: 365,
    }),
  ]);

  if (!user) redirect("/auth/login");

  const streak      = calcStreak(allBookingDates.map((b) => b.classDate));
  const hasPassword = !!user.passwordHash;

  const roleLabel = { ADMIN: "Administrador", COACH: "Coach", STUDENT: "Alumno" }[
    (session.user as { role?: string }).role ?? "STUDENT"
  ] ?? "Alumno";

  return (
    <section className="pt-5 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Cuenta</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Perfil</h2>
      </div>

      {/* ── Bloque 1: Datos personales ───────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-5 space-y-5 animate-in">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xl font-bold text-orange-500 shrink-0">
            {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-100 truncate">{user.name ?? "Sin nombre"}</p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            <span className="inline-block mt-1 text-[10px] font-medium bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-4">
          <EditProfileForm
            name={user.name}
            birthDate={user.birthDate ? user.birthDate.toISOString().split("T")[0] : null}
          />
        </div>
      </div>

      {/* ── Bloque 2: Estadísticas ───────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Mis estadísticas
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-orange-400 tabular-nums">{statsThisMonth}</p>
            <p className="text-[11px] text-zinc-500 mt-1 leading-tight">Este mes</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-zinc-100 tabular-nums">{statsTotal}</p>
            <p className="text-[11px] text-zinc-500 mt-1 leading-tight">Total clases</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-black tabular-nums" style={{ color: streak > 0 ? "#f97316" : "#52525b" }}>
              {streak}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1 leading-tight">
              {streak === 1 ? "día de racha" : "días de racha"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Bloque 3: Links al historial ─────────────────────────────────────── */}
      <div className="space-y-3">
        <Link
          href="/profile/bookings"
          className="glass-card rounded-2xl px-4 py-3.5 flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-medium text-zinc-100">Historial de turnos</p>
            <p className="text-xs text-zinc-500 mt-0.5">Todas tus reservas pasadas y próximas</p>
          </div>
          <CaretRightIcon size={16} className="text-zinc-600 shrink-0" />
        </Link>

        <Link
          href="/profile/history"
          className="glass-card rounded-2xl px-4 py-3.5 flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-medium text-zinc-100">Historial de abonos</p>
            <p className="text-xs text-zinc-500 mt-0.5">Abonos comprados y ajustes de créditos</p>
          </div>
          <CaretRightIcon size={16} className="text-zinc-600 shrink-0" />
        </Link>
      </div>

      {/* ── Cambio de contraseña ─────────────────────────────────────────── */}
      {hasPassword && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Cambiar contraseña
          </h3>
          <div className="glass-card rounded-2xl p-5">
            <ChangePasswordForm />
          </div>
        </div>
      )}

      {/* ── Notificaciones push ──────────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Notificaciones
        </h3>
        <div className="glass-card rounded-2xl p-5">
          <PushNotificationToggle />
        </div>
      </div>

      {/* ── Cerrar sesión ────────────────────────────────────────────────── */}
      <SignOutButton />
    </section>
  );
}
