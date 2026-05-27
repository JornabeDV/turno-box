"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { ActionResult } from "@/types";

import { EXPENSE_CATEGORIES } from "@/lib/finance-constants";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId) throw new Error("Unauthorized");
  return { userId: user.id, gymId: user.gymId };
}

function startEndOfMonth(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

// ── Resumen mensual ───────────────────────────────────────────────────────────
export async function getFinancesSummaryAction(
  year: number,
  month: number
): Promise<
  ActionResult<{
    income: number;
    expense: number;
    balance: number;
    prevIncome: number;
    prevExpense: number;
    prevBalance: number;
    transactionCount: number;
  }>
> {
  const { gymId } = await requireAdmin();
  const { start, end } = startEndOfMonth(year, month);
  const prevStart = new Date(year, month - 2, 1);
  const prevEnd = start;

  const [incomeAgg, expenseAgg, countAgg, prevIncomeAgg, prevExpenseAgg] = await Promise.all([
    prisma.gymTransaction.aggregate({
      _sum: { amount: true },
      where: { gymId, type: "INCOME", date: { gte: start, lt: end } },
    }),
    prisma.gymTransaction.aggregate({
      _sum: { amount: true },
      where: { gymId, type: "EXPENSE", date: { gte: start, lt: end } },
    }),
    prisma.gymTransaction.count({
      where: { gymId, date: { gte: start, lt: end } },
    }),
    prisma.gymTransaction.aggregate({
      _sum: { amount: true },
      where: { gymId, type: "INCOME", date: { gte: prevStart, lt: prevEnd } },
    }),
    prisma.gymTransaction.aggregate({
      _sum: { amount: true },
      where: { gymId, type: "EXPENSE", date: { gte: prevStart, lt: prevEnd } },
    }),
  ]);

  const income = Number(incomeAgg._sum.amount ?? 0);
  const expense = Number(expenseAgg._sum.amount ?? 0);
  const prevIncome = Number(prevIncomeAgg._sum.amount ?? 0);
  const prevExpense = Number(prevExpenseAgg._sum.amount ?? 0);

  return {
    success: true,
    data: {
      income,
      expense,
      balance: income - expense,
      prevIncome,
      prevExpense,
      prevBalance: prevIncome - prevExpense,
      transactionCount: countAgg,
    },
  };
}

// ── Datos para gráfico de barras (ingresos vs egresos por mes) ───────────────
export async function getMonthlyChartAction(
  year: number
): Promise<
  ActionResult<
    { month: number; label: string; income: number; expense: number }[]
  >
> {
  const { gymId } = await requireAdmin();
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const results = await Promise.all(
    Array.from({ length: 12 }, (_, m) => {
      const start = new Date(year, m, 1);
      const end = new Date(year, m + 1, 1);
      return Promise.all([
        prisma.gymTransaction.aggregate({
          _sum: { amount: true },
          where: { gymId, type: "INCOME", date: { gte: start, lt: end } },
        }),
        prisma.gymTransaction.aggregate({
          _sum: { amount: true },
          where: { gymId, type: "EXPENSE", date: { gte: start, lt: end } },
        }),
      ]);
    })
  );

  const data = results.map(([inc, exp], idx) => ({
    month: idx + 1,
    label: months[idx],
    income: Number(inc._sum.amount ?? 0),
    expense: Number(exp._sum.amount ?? 0),
  }));

  return { success: true, data };
}

// ── Listado de transacciones filtrable ────────────────────────────────────────
export async function getGymTransactionsAction(opts: {
  year: number;
  month?: number | null;
  type?: "INCOME" | "EXPENSE" | null;
  category?: string | null;
  limit?: number;
  offset?: number;
}): Promise<
  ActionResult<{
    items: {
      id: string;
      type: string;
      category: string;
      amount: number;
      description: string | null;
      method: string | null;
      date: Date;
      createdAt: Date;
      user: { name: string | null; email: string } | null;
      paymentId: string | null;
    }[];
    total: number;
  }>
> {
  const { gymId } = await requireAdmin();
  const { year, month, type, category, limit = 50, offset = 0 } = opts;

  const start = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
  const end = month ? new Date(year, month, 1) : new Date(year + 1, 0, 1);

  const where = {
    gymId,
    date: { gte: start, lt: end },
    ...(type ? { type } : {}),
    ...(category ? { category } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.gymTransaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        category: true,
        amount: true,
        description: true,
        method: true,
        date: true,
        createdAt: true,
        paymentId: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.gymTransaction.count({ where }),
  ]);

  return {
    success: true,
    data: {
      items: items.map((i) => ({
        ...i,
        amount: Number(i.amount),
      })),
      total,
    },
  };
}

// ── Crear egreso ──────────────────────────────────────────────────────────────
export async function createExpenseAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const { userId, gymId } = await requireAdmin();

  const schema = z.object({
    category: z.string().min(1),
    amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
    description: z.string().optional(),
    method: z.string().optional(),
    date: z.coerce.date().optional(),
  });

  const parsed = schema.safeParse({
    category: formData.get("category"),
    amount: formData.get("amount"),
    description: formData.get("description") || undefined,
    method: formData.get("method") || undefined,
    date: formData.get("date") || undefined,
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { category, amount, description, method, date } = parsed.data;

  const tx = await prisma.gymTransaction.create({
    data: {
      gymId,
      type: "EXPENSE",
      category,
      amount,
      description: description || null,
      method: method || null,
      registeredBy: userId,
      date: date ?? new Date(),
    },
  });

  revalidatePath("/dashboard/admin/finances");
  return { success: true, data: { id: tx.id } };
}

// ── Eliminar transacción manual (solo si no viene de un Payment) ─────────────
export async function deleteGymTransactionAction(id: string): Promise<ActionResult> {
  const { gymId } = await requireAdmin();

  const tx = await prisma.gymTransaction.findFirst({
    where: { id, gymId },
    select: { paymentId: true },
  });

  if (!tx) return { success: false, error: "Transacción no encontrada." };
  if (tx.paymentId) return { success: false, error: "No se puede eliminar una transacción vinculada a un pago de atleta." };

  await prisma.gymTransaction.delete({ where: { id } });

  revalidatePath("/dashboard/admin/finances");
  return { success: true, data: undefined };
}
