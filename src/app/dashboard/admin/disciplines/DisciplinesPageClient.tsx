"use client";

import { useState, useTransition } from "react";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import {
  DisciplineModal,
  type DisciplineData,
} from "@/components/admin/DisciplineModal";
import { deleteDisciplineAction } from "@/actions/disciplines";

interface Props {
  disciplines: DisciplineData[];
}

export function DisciplinesPageClient({ disciplines }: Props) {
  const [formModal, setFormModal] = useState<{
    open: boolean;
    discipline?: DisciplineData;
  }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    discipline?: DisciplineData;
  }>({ open: false });
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete() {
    if (!deleteModal.discipline) return;
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteDisciplineAction(deleteModal.discipline!.id);
        toast.success(`Disciplina "${deleteModal.discipline!.name}" eliminada`);
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
            <p className="text-xs text-[#6B8A99] uppercase tracking-wider mb-0.5">
              Admin
            </p>
            <h2 className="text-xl font-bold text-[#EAEAEA] tracking-tight">
              Disciplinas
            </h2>
          </div>
          <Button
            size="sm"
            variant="brand"
            onClick={() => setFormModal({ open: true })}
          >
            <PlusIcon size={14} weight="bold" />
            Nueva disciplina
          </Button>
        </div>

        {/* Lista */}
        {disciplines.length === 0 ? (
          <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-16 text-center">
            <p className="text-sm text-[#6B8A99] mb-4">
              No hay disciplinas creadas todavía.
            </p>
            <Button
              variant="brand"
              size="md"
              onClick={() => setFormModal({ open: true })}
            >
              Crear primera disciplina
            </Button>
          </div>
        ) : (
          <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden divide-y divide-[#1A4A63]">
            {disciplines.map((d) => (
              <div
                key={d.id}
                onClick={() => setFormModal({ open: true, discipline: d })}
                className="flex items-center gap-4 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
              >
                {/* Color dot + nombre */}
                <span
                  className="size-3 rounded-full shrink-0"
                  style={{ backgroundColor: d.color ?? "#f97316" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#EAEAEA]">{d.name}</p>
                  {d.description && (
                    <p className="text-xs text-[#6B8A99] mt-0.5 truncate">
                      {d.description}
                    </p>
                  )}
                </div>
                {/* Eliminar */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteModal({ open: true, discipline: d });
                  }}
                  className="size-8 rounded-[2px] flex items-center justify-center text-[#6B8A99] hover:text-[#E61919] hover:bg-[#0E2A38] transition-all shrink-0"
                >
                  <TrashIcon size={14} className="md:hidden" weight="bold" />
                  <TrashIcon
                    size={18}
                    className="hidden md:block"
                    weight="bold"
                  />
                </button>
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
          <div className="mb-4 rounded-[2px] bg-[#E61919]/10 border border-[#E61919]/20 px-3 py-2">
            <p className="text-xs text-[#E61919]">{deleteError}</p>
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
