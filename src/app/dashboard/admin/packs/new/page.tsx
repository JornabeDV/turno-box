import { createPackAction } from "@/actions/payments";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nuevo pack" };

export default function NewPackPage() {
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
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Nuevo pack</h2>
      </div>

      <form action={createPackAction} className="glass-card rounded-2xl p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nombre</label>
          <input
            name="name"
            required
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
              placeholder="8"
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
              placeholder="15000"
              className="w-full h-11 bg-zinc-900 border border-white/[0.08] rounded-xl px-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Validez (días) <span className="text-zinc-600 normal-case font-normal">— dejar vacío para sin vencimiento</span>
          </label>
          <input
            name="validityDays"
            type="number"
            min={1}
            placeholder="30"
            className="w-full h-11 bg-zinc-900 border border-white/[0.08] rounded-xl px-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        <Button type="submit" variant="brand" fullWidth>
          Crear pack
        </Button>
      </form>
    </div>
  );
}
