"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PushPinIcon,
  TrashIcon,
  ImageIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { deleteAnnouncementAction } from "@/actions/announcements";
import type { Announcement } from "@prisma/client";

export type Props = { announcements: Announcement[] };

export function NewsListClient({ announcements: initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const now = new Date();

  function statusLabel(item: Announcement) {
    if (item.expiresAt && item.expiresAt < now)
      return { label: "Vencida", cls: "text-[#4A6B7A]" };
    if (item.publishAt > now)
      return { label: "Programada", cls: "text-[#F78837]" };
    return { label: "Activa", cls: "text-[#27C7B8]" };
  }

  function handleDelete() {
    if (!confirmDeleteId) return;
    startTransition(async () => {
      const res = await deleteAnnouncementAction(confirmDeleteId);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== confirmDeleteId));
        setConfirmDeleteId(null);
        toast.success("Noticia eliminada");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      {items.length === 0 ? (
        <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-16 text-center">
          <p className="text-sm md:text-base text-[#6B8A99]">
            No hay noticias todavía.
          </p>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-0 md:bg-[#0E2A38] md:border md:border-[#1A4A63] md:overflow-hidden md:divide-y md:divide-[#1A4A63]">
          {items.map((item) => {
            const { label, cls } = statusLabel(item);
            return (
              <div
                key={item.id}
                onClick={() =>
                  router.push(`/dashboard/admin/news/${item.id}/edit`)
                }
                className="group cursor-pointer hover:bg-white/[0.03] transition-colors"
              >
                {/* Mobile layout */}
                <div className="md:hidden border border-[#1A4A63] overflow-hidden bg-[#0E2A38]">
                  {item.imageUrl ? (
                    <div className="w-full aspect-video overflow-hidden bg-[#0A1F2A]">
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-video overflow-hidden bg-[#0A1F2A] flex items-center justify-center">
                      <ImageIcon size={32} className="text-[#4A6B7A]" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {item.pinned && (
                        <span className="text-[9px] font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#F78837] border border-[#F78837]/30 px-1 pt-0.5">
                          Fijado
                        </span>
                      )}
                      <span className={`text-xs font-bold uppercase tracking-wide ${cls}`}>
                        {label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#EAEAEA]">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#6B8A99] mt-0.5 leading-relaxed">
                      {item.body}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-2 text-[11px] text-[#4A6B7A]">
                      <span>
                        {item.publishAt.toLocaleDateString("es-AR", {
                          timeZone: "UTC",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {item.expiresAt && (
                        <span>
                          · vence{" "}
                          {item.expiresAt.toLocaleDateString("es-AR", {
                            timeZone: "UTC",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/admin/news/${item.id}/edit`);
                        }}
                        className="size-8 rounded-[2px] flex cursor-pointer items-center justify-center text-[#6B8A99] hover:text-[#EAEAEA] hover:bg-[#143D52] transition-all"
                      >
                        <PencilSimpleIcon size={16} weight="bold" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(item.id);
                        }}
                        className="size-8 rounded-[2px] flex cursor-pointer items-center justify-center text-[#6B8A99] hover:text-[#E61919] hover:bg-[#0E2A38] transition-all"
                      >
                        <TrashIcon size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden md:flex items-center gap-3 px-5 py-4">
                  {/* Pin indicator */}
                  <div className="mt-0.5 shrink-0">
                    {item.pinned ? (
                      <PushPinIcon
                        size={15}
                        className="text-[#F78837]"
                        weight="fill"
                      />
                    ) : (
                      <div className="size-[15px]" />
                    )}
                  </div>

                  {/* Thumbnail */}
                  {item.imageUrl ? (
                    <div className="shrink-0 w-14 h-14 rounded-[2px] border border-[#1A4A63] overflow-hidden bg-[#0A1F2A]">
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="shrink-0 w-14 h-14 rounded-[2px] border border-[#1A4A63] bg-[#0A1F2A] flex items-center justify-center">
                      <ImageIcon size={20} className="text-[#4A6B7A]" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-[#EAEAEA] truncate">
                      {item.title}
                    </p>
                    <p className="text-sm text-[#6B8A99] mt-0.5 line-clamp-2">
                      {item.body}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-sm">
                      <span className={cls}>{label}</span>
                      <span className="text-[#4A6B7A]">
                        {item.publishAt.toLocaleDateString("es-AR", {
                          timeZone: "UTC",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {item.expiresAt && (
                        <span className="text-[#4A6B7A]">
                          · vence{" "}
                          {item.expiresAt.toLocaleDateString("es-AR", {
                            timeZone: "UTC",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/admin/news/${item.id}/edit`);
                      }}
                      className="size-8 rounded-[2px] flex cursor-pointer items-center justify-center text-[#6B8A99] hover:text-[#EAEAEA] hover:bg-[#143D52] transition-all"
                    >
                      <PencilSimpleIcon size={16} weight="bold" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(item.id);
                      }}
                      className="size-8 rounded-[2px] flex cursor-pointer items-center justify-center text-[#6B8A99] hover:text-[#E61919] hover:bg-[#0E2A38] transition-all"
                    >
                      <TrashIcon size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal confirmar eliminar */}
      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
        title="Eliminar noticia"
        description="Esta acción no se puede deshacer."
        size="md"
      >
        <div className="flex max-md:flex-col gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="md:flex-1"
            onClick={() => setConfirmDeleteId(null)}
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
    </>
  );
}
