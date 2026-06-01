import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSuperAdminStatsAction } from "@/actions/super-admin";
import { MetricCard } from "@/components/admin/MetricCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Super Admin" };

export default async function SuperAdminDashboardPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "SUPER_ADMIN") redirect("/");

  const statsRes = await getSuperAdminStatsAction();
  const stats = statsRes.success ? statsRes.data : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs md:text-sm text-[#6B8A99] uppercase tracking-wider mb-0.5">
          Super Admin
        </p>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#EAEAEA] tracking-tight">
          Dashboard
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
        <MetricCard
          label="Gimnasios"
          value={stats?.totalGyms ?? 0}
          icon="chart"
          accent="orange"
        />
        <MetricCard
          label="Usuarios totales"
          value={stats?.totalUsers ?? 0}
          icon="users"
          accent="zinc"
        />
        <MetricCard
          label="Admins"
          value={stats?.totalAdmins ?? 0}
          icon="check"
          accent="emerald"
        />
        <MetricCard
          label="Alumnos"
          value={stats?.totalStudents ?? 0}
          icon="users"
          accent="zinc"
        />
      </div>

      <div className="bg-[#0E2A38] border border-[#1A4A63] p-5">
        <h3 className="text-sm md:text-base font-semibold text-[#EAEAEA] mb-2">
          Acciones rápidas
        </h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="/dashboard/super-admin/gyms/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F78837] text-[#0A1F2A] text-xs font-medium uppercase tracking-wide rounded-[2px] hover:bg-[#E07A2E] transition-colors"
          >
            Crear nuevo gimnasio
          </a>
          <a
            href="/dashboard/super-admin/gyms"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#1A4A63] text-[#EAEAEA] text-xs font-medium uppercase tracking-wide rounded-[2px] hover:border-[#F78837] hover:text-[#F78837] transition-colors"
          >
            Ver gimnasios
          </a>
        </div>
      </div>
    </div>
  );
}
