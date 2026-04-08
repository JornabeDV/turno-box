import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePackAction } from "@/actions/payments";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar pack" };

export default async function EditPackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; gymId?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") redirect("/");
  if (!user.gymId) redirect("/");

  const { id } = await params;

  const pack = await prisma.pack.findFirst({
    where: { id, gymId: user.gymId },
  });
  if (!pack) notFound();

  const action = updatePackAction.bind(null, pack.id);

  return (
    <div className="max-w-md space-y-6">
      <div>
        <Link
          href="/dashboard/admin/packs"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <ArrowLeftIcon size={13} />
          Packs
        </Link>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Admin</p>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Editar pack</h2>
      </div>

      <form action={action} className="glass-card rounded-2xl p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nombre</label>
          <input
            name="name"
            required
            defaultValue={pack.name}
            placeholder="Pack 8 clases"
            className="w-full h-11 bg-zinc-900 border border-white/[0.08] rounded-xl px-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Clases</label>
            <input
              name="credits"
              type="number"
              required
              min={1}
              max={100}
              defaultValue={pack.credits}
              className="w-full h-11 bg-zinc-900 border border-white/[0.08] rounded-xl px-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Precio (ARS)</label>
            <input
              name="price"
              type="number"
              required
              min={0}
              defaultValue={Number(pack.price)}
              className="w-full h-11 bg-zinc-900 border border-white/[0.08] rounded-xl px-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Validez (días)
            </label>
            <input
              name="validityDays"
              type="number"
              min={1}
              defaultValue={pack.validityDays ?? ""}
              placeholder="Sin vencimiento"
              className="w-full h-11 bg-zinc-900 border border-white/[0.08] rounded-xl px-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Orden</label>
            <input
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={pack.sortOrder}
              className="w-full h-11 bg-zinc-900 border border-white/[0.08] rounded-xl px-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Link href="/dashboard/admin/packs" className="flex-1">
            <Button type="button" variant="ghost" fullWidth>Cancelar</Button>
          </Link>
          <Button type="submit" variant="brand" fullWidth>
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
