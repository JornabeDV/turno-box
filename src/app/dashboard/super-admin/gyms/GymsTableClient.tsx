"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EditGymModal } from "@/components/admin/EditGymModal";
import { Button } from "@/components/ui/Button";
import { deleteGymAction } from "@/actions/super-admin";
import { CopyInviteButton } from "./CopyInviteButton";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";

type Gym = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  _count: { users: number };
  admin: { id: string; email: string } | null;
};

interface Props {
  gyms: Gym[];
}

export function GymsTableClient({ gyms }: Props) {
  const router = useRouter();
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [deletingGym, setDeletingGym] = useState<Gym | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(gym: Gym) {
    startTransition(async () => {
      const result = await deleteGymAction(gym.id);
      if (result.success) {
        toast.success(`Gimnasio "${gym.name}" eliminado`);
        router.refresh();
        setDeletingGym(null);
      } else {
        toast.error(result.error);
        setDeletingGym(null);
      }
    });
  }

  if (gyms.length === 0) {
    return (
      <div className="bg-card border border-border p-8 lg:p-10 text-center">
        <p className="text-sm md:text-base text-secondary">
          No hay gimnasios registrados todavía.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm md:text-base">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs md:text-sm font-medium text-secondary uppercase tracking-wider px-4 py-3">
                  Nombre
                </th>
                <th className="text-left text-xs md:text-sm font-medium text-secondary uppercase tracking-wider px-4 py-3">
                  Slug
                </th>
                <th className="text-left text-xs md:text-sm font-medium text-secondary uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                  Usuarios
                </th>
                <th className="text-left text-xs md:text-sm font-medium text-secondary uppercase tracking-wider px-4 py-3">
                  Link de invitación
                </th>
                <th className="text-right text-xs md:text-sm font-medium text-secondary uppercase tracking-wider px-4 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gyms.map((gym) => (
                <tr
                  key={gym.id}
                  className="hover:bg-page/50 transition-colors"
                >
                  <td className="px-4 py-3 text-primary font-medium">
                    {gym.name}
                  </td>
                  <td className="px-4 py-3 text-secondary font-[family-name:var(--font-jetbrains)] text-xs md:text-sm">
                    {gym.slug}
                  </td>
                  <td className="px-4 py-3 text-primary hidden sm:table-cell">
                    {gym._count.users}
                  </td>
                  <td className="px-4 py-3">
                    <CopyInviteButton slug={gym.slug} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingGym(gym)}
                        className="inline-flex items-center justify-center p-2 text-secondary hover:text-brand hover:bg-panel transition-colors"
                        title="Editar gimnasio"
                      >
                        <PencilSimpleIcon size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingGym(gym)}
                        className="inline-flex items-center justify-center p-2 text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Eliminar gimnasio"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edición */}
      {editingGym && (
        <EditGymModal
          open={!!editingGym}
          onClose={() => setEditingGym(null)}
          gym={editingGym}
        />
      )}

      {/* Confirmación de eliminación */}
      {deletingGym && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => setDeletingGym(null)}
          />
          <div className="relative z-10 bg-card border border-border p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight">
              Eliminar gimnasio
            </h3>
            <p className="text-sm text-secondary mt-2">
              ¿Estás seguro de que querés eliminar{" "}
              <span className="text-primary font-medium">
                {deletingGym.name}
              </span>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 mt-5 max-sm:flex-col">
              <Button
                type="button"
                variant="outline"
                size="md"
                className="sm:flex-1"
                onClick={() => setDeletingGym(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                className="sm:flex-1"
                loading={isPending}
                onClick={() => handleDelete(deletingGym)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
