"use server";

import { auth } from "@/lib/auth";
import { calculateMetricsReport } from "@/lib/queries/metrics";
import { z } from "zod";
import type { ActionResult } from "@/types";
import type { MetricsResult } from "@/types/metrics";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId) throw new Error("Unauthorized");
  return { userId: user.id, gymId: user.gymId };
}

export async function getMetricsAction(opts: {
  startDate: string;
  endDate: string;
}): Promise<ActionResult<MetricsResult>> {
  const { gymId } = await requireAdmin();

  const schema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  });

  const parsed = schema.safeParse(opts);
  if (!parsed.success) return { success: false, error: "Fechas inválidas." };

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  end.setHours(23, 59, 59, 999);

  const report = await calculateMetricsReport(gymId, start, end, "");

  const { periodLabel, ...data } = report;
  return { success: true, data };
}
