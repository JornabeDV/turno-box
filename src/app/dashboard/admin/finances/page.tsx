import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FinancesClient } from "@/components/admin/FinancesClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Finanzas" };

export default async function FinancesPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN" || !user.gymId) redirect("/");
  const gymId = user.gymId;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const prevStart = new Date(year, month - 2, 1);
  const prevEnd = start;

  // Resumen
  const [incomeAgg, expenseAgg, countAgg, prevIncomeAgg, prevExpenseAgg] = await Promise.all([
    prisma.gymTransaction.aggregate({
      _sum: { amount: true },
      where: { gymId, type: "INCOME", date: { gte: start, lt: end } },
    }),
    prisma.gymTransaction.aggregate({
      _sum: { amount: true },
      where: { gymId, type: "EXPENSE", date: { gte: start, lt: end } },
    }),
    prisma.gymTransaction.count({ where: { gymId, date: { gte: start, lt: end } } }),
    prisma.gymTransaction.aggregate({
      _sum: { amount: true },
      where: { gymId, type: "INCOME", date: { gte: prevStart, lt: prevEnd } },
    }),
    prisma.gymTransaction.aggregate({
      _sum: { amount: true },
      where: { gymId, type: "EXPENSE", date: { gte: prevStart, lt: prevEnd } },
    }),
  ]);

  const summary = {
    income: Number(incomeAgg._sum.amount ?? 0),
    expense: Number(expenseAgg._sum.amount ?? 0),
    balance: Number(incomeAgg._sum.amount ?? 0) - Number(expenseAgg._sum.amount ?? 0),
    prevIncome: Number(prevIncomeAgg._sum.amount ?? 0),
    prevExpense: Number(prevExpenseAgg._sum.amount ?? 0),
    prevBalance: Number(prevIncomeAgg._sum.amount ?? 0) - Number(prevExpenseAgg._sum.amount ?? 0),
    transactionCount: countAgg,
  };

  // Gráfico anual
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const chartData = await Promise.all(
    Array.from({ length: 12 }, (_, m) => {
      const s = new Date(year, m, 1);
      const e = new Date(year, m + 1, 1);
      return Promise.all([
        prisma.gymTransaction.aggregate({
          _sum: { amount: true },
          where: { gymId, type: "INCOME", date: { gte: s, lt: e } },
        }),
        prisma.gymTransaction.aggregate({
          _sum: { amount: true },
          where: { gymId, type: "EXPENSE", date: { gte: s, lt: e } },
        }),
      ]);
    })
  ).then((results) =>
    results.map(([inc, exp], idx) => ({
      label: months[idx],
      income: Number(inc._sum.amount ?? 0),
      expense: Number(exp._sum.amount ?? 0),
    }))
  );

  // Movimientos iniciales
  const txLimit = 25;
  const [txItems, txTotal] = await Promise.all([
    prisma.gymTransaction.findMany({
      where: { gymId, date: { gte: start, lt: end } },
      orderBy: { date: "desc" },
      take: txLimit,
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
    prisma.gymTransaction.count({ where: { gymId, date: { gte: start, lt: end } } }),
  ]);

  return (
    <FinancesClient
      initialSummary={summary}
      initialChart={chartData}
      initialItems={txItems.map((i) => ({ ...i, amount: Number(i.amount) }))}
      initialTotal={txTotal}
      initialYear={year}
      initialMonth={month}
    />
  );
}
