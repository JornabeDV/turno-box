import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { PushNotificationToggle } from "@/components/profile/PushNotificationToggle";
import { PushNotificationHelp } from "@/components/profile/PushNotificationHelp";
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

  const gymSlug = (session.user as { gymSlug?: string | null }).gymSlug;
  const signOutUrl = gymSlug ? `/auth/login?gymSlug=${gymSlug}` : "/auth/login";

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

  const roleLabel = { ADMIN: "Administrador", COACH: "Profesor", STUDENT: "Alumno" }[
    (session.user as { role?: string }).role ?? "STUDENT"
  ] ?? "Alumno";

  return (
    <section className="pt-4 md:pt-8 space-y-5 md:space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-2xl md:text-4xl">
          Perfil
        </h2>
        <p className="text-sm md:text-lg text-[#6B8A99] mt-1 md:mt-2 font-[family-name:var(--font-oswald)]">
          Tus datos y estadísticas
        </p>
      </div>

      {/* ── Bloque 1: Datos personales ───────────────────────────────────── */}
      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5 md:p-8 space-y-5 md:space-y-8 animate-in">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="size-14 md:size-20 border border-[#F78837]/30 bg-[#F78837]/10 flex items-center justify-center text-xl md:text-3xl font-bold text-[#F78837] shrink-0 font-[family-name:var(--font-oswald)]">
            {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight truncate md:text-xl">
              {user.name ?? "Sin nombre"}
            </p>
            <p className="text-xs md:text-sm text-[#6B8A99] truncate font-[family-name:var(--font-jetbrains)]">{user.email}</p>
            <span className="inline-block mt-1 md:mt-1.5 text-[10px] md:text-xs font-medium border border-[#1A4A63] text-[#6B8A99] px-2 py-0.5 md:px-2.5 md:py-1 font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="border-t border-[#1A4A63] pt-4 md:pt-6">
          <EditProfileForm
            name={user.name}
            birthDate={user.birthDate ? user.birthDate.toISOString().split("T")[0] : null}
          />
        </div>
      </div>

      {/* ── Bloque 2: Estadísticas ───────────────────────────────────────── */}
      <div>
        <h3 className="text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#6B8A99] mb-3 md:mb-4">
          Mis estadísticas
        </h3>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="bg-[#0E2A38] border border-[#1A4A63] p-4 md:p-6 text-center">
            <p className="text-2xl md:text-4xl font-[family-name:var(--font-oswald)] font-bold text-[#F78837] tabular-nums">{statsThisMonth}</p>
            <p className="text-[10px] md:text-xs text-[#6B8A99] mt-1 md:mt-2 leading-tight font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">Este mes</p>
          </div>
          <div className="bg-[#0E2A38] border border-[#1A4A63] p-4 md:p-6 text-center">
            <p className="text-2xl md:text-4xl font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] tabular-nums">{statsTotal}</p>
            <p className="text-[10px] md:text-xs text-[#6B8A99] mt-1 md:mt-2 leading-tight font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">Total clases</p>
          </div>
          <div className="bg-[#0E2A38] border border-[#1A4A63] p-4 md:p-6 text-center">
            <p className={`text-2xl md:text-4xl font-[family-name:var(--font-oswald)] font-bold tabular-nums ${streak > 0 ? "text-[#F78837]" : "text-[#4A6B7A]"}`}>
              {streak}
            </p>
            <p className="text-[10px] md:text-xs text-[#6B8A99] mt-1 md:mt-2 leading-tight font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">
              {streak === 1 ? "Día racha" : "Días racha"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Bloque 3: Links al historial ─────────────────────────────────────── */}
      <div className="space-y-3 md:space-y-4">
        <Link
          href="/profile/bookings"
          className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-3.5 md:px-6 md:py-5 flex items-center justify-between active:scale-[0.99] transition-transform"
        >
          <div>
            <p className="text-sm md:text-xl font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight">Historial de turnos</p>
            <p className="text-xs md:text-base text-[#6B8A99] mt-0.5 md:mt-1 font-[family-name:var(--font-oswald)]">Todas tus reservas pasadas y próximas</p>
          </div>
          <CaretRightIcon size={16} className="text-[#4A6B7A] shrink-0 md:size-5" />
        </Link>

        <Link
          href="/profile/history"
          className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-3.5 md:px-6 md:py-5 flex items-center justify-between active:scale-[0.99] transition-transform"
        >
          <div>
            <p className="text-sm md:text-xl font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight">Historial de abonos</p>
            <p className="text-xs md:text-base text-[#6B8A99] mt-0.5 md:mt-1 font-[family-name:var(--font-oswald)]">Abonos comprados y ajustes de créditos</p>
          </div>
          <CaretRightIcon size={16} className="text-[#4A6B7A] shrink-0 md:size-5" />
        </Link>
      </div>

      {/* ── Cambio de contraseña ─────────────────────────────────────────── */}
      {hasPassword && (
        <div>
          <h3 className="text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#6B8A99] mb-3 md:mb-4">
            Cambiar contraseña
          </h3>
          <div className="bg-[#0E2A38] border border-[#1A4A63] p-5 md:p-8">
            <ChangePasswordForm />
          </div>
        </div>
      )}

      {/* ── Notificaciones push ──────────────────────────────────────────── */}
      <div>
        <h3 className="text-[10px] md:text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#6B8A99] mb-3 md:mb-4">
          Notificaciones
        </h3>
        <div className="bg-[#0E2A38] border border-[#1A4A63] p-5 md:p-8">
          <PushNotificationToggle />
          <PushNotificationHelp />
        </div>
      </div>

      {/* ── Cerrar sesión ────────────────────────────────────────────────── */}
      <SignOutButton callbackUrl={signOutUrl} />
    </section>
  );
}
