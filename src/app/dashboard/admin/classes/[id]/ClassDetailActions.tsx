"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ClassModal, type ClassData } from "@/components/admin/ClassModal";
import { deleteClassAction } from "@/actions/classes";

type Coach = { id: string; name: string | null };
type Discipline = { id: string; name: string; color: string | null; description: string | null };

interface Props {
  classData: ClassData;
  coaches: Coach[];
  disciplines: Discipline[];
}

export function ClassDetailActions({ classData, coaches, disciplines }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteClassAction(classData.id);
        router.push("/dashboard/admin/classes");
      } catch {
        setDeleteError("No se pudo eliminar la clase");
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>
          <PencilSimpleIcon size={14} />
          Editar
        </Button>
        <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>
          <TrashIcon size={14} />
          Eliminar
        </Button>
      </div>

      <ClassModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        class={classData}
        coaches={coaches}
        disciplines={disciplines}
      />

      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => !o && setDeleteOpen(false)}
        title="Eliminar clase"
        description="¿Eliminar esta clase? Las reservas existentes quedarán en el historial."
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
            onClick={() => setDeleteOpen(false)}
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
