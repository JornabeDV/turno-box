import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMetricsAction } from "@/actions/metrics";
import { MetricsClient } from "@/components/admin/MetricsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Métricas" };

export default async function MetricsPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;

  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);

  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];

  const res = await getMetricsAction({ startDate: startStr, endDate: endStr });

  if (!res.success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-[#6B8A99]">Error al cargar métricas.</p>
      </div>
    );
  }

  return (
    <MetricsClient
      initialData={res.data}
      initialStart={startStr}
      initialEnd={endStr}
    />
  );
}
