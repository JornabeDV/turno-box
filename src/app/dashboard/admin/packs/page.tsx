import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AddPackButton } from "@/components/admin/AddPackButton";
import { GlobalFreezeButton } from "@/components/admin/GlobalFreezeButton";
import { getGlobalFreezeStatus } from "@/actions/freezes";
import { PacksListClient } from "./PacksListClient";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Abonos" };

export default async function AdminPacksPage() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; gymId?: string }
    | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const [packs, globalFreeze] = await Promise.all([
    prisma.pack.findMany({
      where: { gymId: user.gymId },
      orderBy: [{ sortOrder: "asc" }, { credits: "asc" }],
      include: {
        _count: { select: { payments: { where: { status: "APPROVED" } } } },
      },
    }),
    getGlobalFreezeStatus(user.gymId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs md:text-sm text-[#6B8A99] uppercase tracking-wider mb-0.5">
            Admin
          </p>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#EAEAEA] tracking-tight">
            Abonos
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <GlobalFreezeButton initialIsPaused={globalFreeze.isPaused} />
          <AddPackButton />
        </div>
      </div>

      {globalFreeze.isPaused && globalFreeze.freeze && (
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 border",
          "bg-[#F78837]/10 border-[#F78837]/20"
        )}>
          <span className="size-2 rounded-full bg-[#F78837] animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-medium text-[#EAEAEA]">
              Abonos pausados masivamente
            </p>
            <p className="text-xs sm:text-sm text-[#6B8A99]">
              {globalFreeze.freeze.reason} — desde el{" "}
              {globalFreeze.freeze.startedAt.toLocaleDateString("es-AR", {
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        </div>
      )}

      {/* Lista de abonos */}
      {packs.length === 0 ? (
        <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-16 text-center">
          <p className="text-sm md:text-base text-[#6B8A99] mb-4">
            No hay abonos creados todavía.
          </p>
          <AddPackButton />
        </div>
      ) : (
        <PacksListClient
          packs={packs.map((p) => ({ ...p, price: Number(p.price) }))}
        />
      )}
    </div>
  );
}
