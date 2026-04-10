"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { DisciplineModal, type DisciplineData } from "@/components/admin/DisciplineModal";
import { deleteDisciplineAction } from "@/actions/disciplines";

interface Props {
  disciplines: DisciplineData[];
  weekParam: string;
}

export function DisciplinesManager({ disciplines, weekParam }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDiscipline = searchParams.get("discipline") ?? "";

  // Modal crear/editar
  const [formModal, setFormModal] = useState<{ open: boolean; discipline?: DisciplineData }>({ open: false });
  // Modal eliminar
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; discipline?: DisciplineData }>({ open: false });
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function navigate(discipline?: string) {
    const params = new URLSearchParams();
    params.set("week", weekParam);
    if (discipline) params.set("discipline", discipline);
    router.push(`/dashboard/admin/classes?${params.toString()}`);
  }

  function handleDelete() {
    if (!deleteModal.discipline) return;
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteDisciplineAction(deleteModal.discipline!.id);
        // Si la disciplina eliminada era el filtro activo, limpiar el filtro
        if (currentDiscipline === deleteModal.discipline!.name) {
          navigate();
        }
        setDeleteModal({ open: false });
      } catch {
        setDeleteError("No se pudo eliminar la disciplina");
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Badge "Todos" */}
        <button
          onClick={() => navigate()}
          className={[
            "inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-medium transition-colors",
            !currentDiscipline
              ? "bg-zinc-100 text-zinc-900"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
          ].join(" ")}
        >
          Todos
        </button>

        {/* Badges de disciplinas */}
        {disciplines.map((d) => {
          const isActive = currentDiscipline === d.name;
          return (
            <div key={d.id} className="group relative inline-flex items-center">
              <button
                onClick={() => navigate(d.name)}
                className={[
                  "inline-flex items-center gap-1.5 pl-3 h-7 rounded-full text-xs font-medium transition-colors",
                  isActive
                    ? "pr-14 text-zinc-900"
                    : "pr-3 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
                ].join(" ")}
                style={isActive ? { backgroundColor: d.color ?? "#f97316" } : undefined}
              >
                {!isActive && (
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: d.color ?? "#f97316" }}
                  />
                )}
                {d.name}
              </button>

              {/* Acciones editar/eliminar — siempre visibles al hover */}
              <div className={[
                "absolute right-1 flex items-center gap-0.5 transition-opacity",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              ].join(" ")}>
                <button
                  onClick={(e) => { e.stopPropagation(); setFormModal({ open: true, discipline: d }); }}
                  className={[
                    "rounded-full p-1 transition-colors",
                    isActive
                      ? "text-zinc-900/70 hover:text-zinc-900 hover:bg-black/10"
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700",
                  ].join(" ")}
                  title="Editar"
                >
                  <PencilSimpleIcon size={11} weight="bold" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, discipline: d }); }}
                  className={[
                    "rounded-full p-1 transition-colors",
                    isActive
                      ? "text-zinc-900/70 hover:text-zinc-900 hover:bg-black/10"
                      : "text-zinc-500 hover:text-rose-400 hover:bg-zinc-700",
                  ].join(" ")}
                  title="Eliminar"
                >
                  <TrashIcon size={11} weight="bold" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Botón nueva disciplina */}
        <button
          onClick={() => setFormModal({ open: true, discipline: undefined })}
          className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors border border-dashed border-zinc-700"
        >
          <PlusIcon size={11} weight="bold" />
          Nueva
        </button>
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
