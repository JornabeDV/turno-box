"use client";

import { useState, useTransition } from "react";
import { PlusIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { DisciplineModal, type DisciplineData } from "@/components/admin/DisciplineModal";
import { deleteDisciplineAction } from "@/actions/disciplines";

interface Props {
  disciplines: DisciplineData[];
}

export function DisciplinesPageClient({ disciplines }: Props) {
  const [formModal, setFormModal] = useState<{ open: boolean; discipline?: DisciplineData }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; discipline?: DisciplineData }>({ open: false });
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete() {
    if (!deleteModal.discipline) return;
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteDisciplineAction(deleteModal.discipline!.id);
        setDeleteModal({ open: false });
      } catch {
        setDeleteError("No se pudo eliminar la disciplina");
      }
    });
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Admin</p>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Disciplinas</h2>
          </div>
          <Button size="sm" variant="brand" onClick={() => setFormModal({ open: true })}>
            <PlusIcon size={14} weight="bold" />
            Nueva disciplina
          </Button>
        </div>

        {/* Lista */}
        {disciplines.length === 0 ? (
          <div className="glass-card rounded-2xl px-4 py-16 text-center">
            <p className="text-sm text-zinc-500 mb-4">No hay disciplinas creadas todavía.</p>
            <Button variant="brand" size="md" onClick={() => setFormModal({ open: true })}>
              Crear primera disciplina
            </Button>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
            {disciplines.map((d) => (
              <div key={d.id} className="flex items-center gap-4 px-4 py-3.5">
                {/* Color dot + nombre */}
                <span
                  className="size-3 rounded-full shrink-0"
                  style={{ backgroundColor: d.color ?? "#f97316" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100">{d.name}</p>
                  {d.description && (
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{d.description}</p>
                  )}
                </div>
                {/* Acciones */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setFormModal({ open: true, discipline: d })}
                    className="size-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                    title="Editar"
                  >
                    <PencilSimpleIcon size={14} weight="bold" />
                  </button>
                  <button
                    onClick={() => setDeleteModal({ open: true, discipline: d })}
                    className="size-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-all"
                    title="Eliminar"
                  >
                    <TrashIcon size={14} weight="bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      <DisciplineModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false })}
        discipline={formModal.discipline}
      />

      {/* Modal confirmar eliminar */}
      <Dialog
        open={deleteModal.open}
        onOpenChange={(o) => !o && setDeleteModal({ open: false })}
        title="Eliminar disciplina"
        description={`¿Eliminar "${deleteModal.discipline?.name}"? Las clases asociadas quedarán sin disciplina.`}
        size="sm"
      >
        {deleteError && (
          <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2">
            <p className="text-xs text-rose-400">{deleteError}</p>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => setDeleteModal({ open: false })}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="flex-1"
            loading={isPending}
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </div>
      </Dialog>
    </>
  );
}
