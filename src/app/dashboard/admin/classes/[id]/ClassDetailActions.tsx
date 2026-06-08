"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ClassModal, type ClassData } from "@/components/admin/ClassModal";
import { deleteClassAction, deleteClassInstanceAction } from "@/actions/classes";

type Coach = { id: string; name: string | null };
type Discipline = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
};

interface Props {
  classData: ClassData;
  coaches: Coach[];
  disciplines: Discipline[];
  date?: string; // fecha puntual si se navegó desde el calendario semanal
}

export function ClassDetailActions({ classData, coaches, disciplines, date }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [editInstanceOpen, setEditInstanceOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInstanceOpen, setDeleteInstanceOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteClassAction(classData.id);
        toast.success("Clase eliminada");
        router.push("/dashboard/admin/classes");
      } catch {
        setDeleteError("No se pudo eliminar la clase");
      }
    });
  }

  function handleDeleteInstance() {
    setDeleteError(null);
    if (!date) return;
    startTransition(async () => {
      try {
        await deleteClassInstanceAction(classData.id, date);
        toast.success("Clase de esta fecha eliminada");
        router.push("/dashboard/admin/classes");
      } catch {
        setDeleteError("No se pudo eliminar la clase de esta fecha");
      }
    });
  }

  return (
    <>
      {date ? (
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Button size="md" variant="outline" className="flex-1" onClick={() => setEditInstanceOpen(true)}>
              <PencilSimpleIcon size={14} />
              Editar esta clase
            </Button>
            <Button size="md" variant="outline" className="flex-1" onClick={() => setEditOpen(true)}>
              <PencilSimpleIcon size={14} />
              Editar todas las semanas
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="md" variant="danger" className="flex-1" onClick={() => setDeleteInstanceOpen(true)}>
              <TrashIcon size={14} />
              Eliminar esta clase
            </Button>
            <Button size="md" variant="danger" className="flex-1" onClick={() => setDeleteOpen(true)}>
              <TrashIcon size={14} />
              Eliminar todas las semanas
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button size="md" variant="outline" onClick={() => setEditOpen(true)}>
            <PencilSimpleIcon size={14} />
            Editar
          </Button>
          <Button size="md" variant="danger" onClick={() => setDeleteOpen(true)}>
            <TrashIcon size={14} />
            Eliminar
          </Button>
        </div>
      )}

      {/* Modales de edición */}
      <ClassModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        class={classData}
        coaches={coaches}
        disciplines={disciplines}
      />
      <ClassModal
        open={editInstanceOpen}
        onClose={() => setEditInstanceOpen(false)}
        class={classData}
        coaches={coaches}
        disciplines={disciplines}
        instanceDate={date}
      />

      {/* Diálogo eliminar recurrente */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => !o && setDeleteOpen(false)}
        title="Eliminar clase de todas las semanas"
        description="¿Eliminar esta clase de todos los días viernes? Las reservas existentes quedarán en el historial."
        size="md"
      >
        {deleteError && (
          <div className="mb-4 rounded-[2px] bg-[#E61919]/10 border border-[#E61919]/20 px-3 py-2">
            <p className="text-xs md:text-sm text-[#E61919]">{deleteError}</p>
          </div>
        )}
        <div className="flex max-md:flex-col gap-2 max-md:mt-6">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="md:flex-1"
            onClick={() => setDeleteOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            className="md:flex-1"
            loading={isPending}
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </div>
      </Dialog>

      {/* Diálogo eliminar instancia */}
      <Dialog
        open={deleteInstanceOpen}
        onOpenChange={(o) => !o && setDeleteInstanceOpen(false)}
        title={`Eliminar clase del ${date}`}
        description="¿Eliminar solo esta clase? Las reservas de esta fecha serán canceladas y los créditos reembolsados."
        size="md"
      >
        {deleteError && (
          <div className="mb-4 rounded-[2px] bg-[#E61919]/10 border border-[#E61919]/20 px-3 py-2">
            <p className="text-xs md:text-sm text-[#E61919]">{deleteError}</p>
          </div>
        )}
        <div className="flex max-md:flex-col gap-2 max-md:mt-6">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="md:flex-1"
            onClick={() => setDeleteInstanceOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            className="md:flex-1"
            loading={isPending}
            onClick={handleDeleteInstance}
          >
            Eliminar
          </Button>
        </div>
      </Dialog>
    </>
  );
}
