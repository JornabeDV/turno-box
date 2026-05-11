"use client";

import { useState, useTransition, useEffect, forwardRef, useImperativeHandle } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PushPinIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { DateInput } from "@/components/ui/DatePicker";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
} from "@/actions/announcements";
import type { Announcement } from "@prisma/client";

export type Props = { announcements: Announcement[] };

export type NewsListRef = { openCreate: () => void };

const EMPTY_FORM = {
  title: "",
  body: "",
  pinned: false,
  publishAt: "",
  expiresAt: "",
};

const inputClass =
  "w-full h-10 rounded-[2px] bg-[#0A1F2A] border border-[#1A4A63] px-3.5 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] focus:outline-none focus:border-[#F78837] transition-colors";

const labelClass =
  "text-xs font-medium text-[#6B8A99] uppercase tracking-wider";

export const NewsListClient = forwardRef<NewsListRef, Props>(function NewsListClient(
  { announcements: initial },
  ref,
) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  useEffect(() => {
    setItems(initial);
  }, [initial]);
  const [showForm, setShowForm] = useState(false);

  useImperativeHandle(ref, () => ({ openCreate }));
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const now = new Date();

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item: Announcement) {
    setEditing(item);
    setForm({
      title: item.title,
      body: item.body,
      pinned: item.pinned,
      publishAt: item.publishAt.toISOString().slice(0, 10),
      expiresAt: item.expiresAt
        ? item.expiresAt.toISOString().slice(0, 10)
        : "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: {
    preventDefault(): void;
    currentTarget: HTMLFormElement;
  }) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("pinned", form.pinned ? "true" : "false");

    startTransition(async () => {
      const res = editing
        ? await updateAnnouncementAction(editing.id, fd)
        : await createAnnouncementAction(fd);

      if (res.success) {
        toast.success(editing ? "Noticia actualizada" : "Noticia creada");
        closeForm();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
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

  function statusLabel(item: Announcement) {
    if (item.expiresAt && item.expiresAt < now)
      return { label: "Vencida", cls: "text-[#4A6B7A]" };
    if (item.publishAt > now)
      return { label: "Programada", cls: "text-[#F78837]" };
    return { label: "Activa", cls: "text-[#27C7B8]" };
  }

  return (
    <>
      {/* Lista */}
      {items.length === 0 ? (
        <div className="bg-[#0E2A38] border border-[#1A4A63] px-4 py-16 text-center">
          <p className="text-sm text-[#6B8A99]">No hay noticias todavía.</p>
        </div>
      ) : (
        <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden divide-y divide-[#1A4A63]">
          {items.map((item) => {
            const { label, cls } = statusLabel(item);
            return (
              <div
                key={item.id}
                onClick={() => openEdit(item)}
                className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-white/[0.03] transition-colors group"
              >
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

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#EAEAEA] truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-[#6B8A99] mt-0.5 line-clamp-2">
                    {item.body}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                    <span className={cls}>{label}</span>
                    <span className="text-[#4A6B7A]">
                      {item.publishAt.toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {item.expiresAt && (
                      <span className="text-[#4A6B7A]">
                        · vence{" "}
                        {item.expiresAt.toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(item.id);
                  }}
                  className="size-8 rounded-[2px] flex cursor-pointer items-center justify-center text-[#6B8A99] hover:text-[#E61919] hover:bg-[#0E2A38] transition-all shrink-0"
                >
                  <TrashIcon size={14} className="md:hidden" weight="bold" />
                  <TrashIcon
                    size={18}
                    className="hidden md:block"
                    weight="bold"
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal crear / editar */}
      <Dialog
        open={showForm}
        onOpenChange={(o) => !o && closeForm()}
        title={editing ? "Editar noticia" : "Nueva noticia"}
        size="lg"
        className="max-md:h-full"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-1.5">
            <label className={labelClass}>Título</label>
            <input
              name="title"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              required
              className={inputClass}
              placeholder="Ej: Feriado del lunes"
            />
          </div>

          {/* Cuerpo */}
          <div className="space-y-1.5">
            <label className={labelClass}>Contenido</label>
            <textarea
              name="body"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              required
              rows={4}
              className="w-full rounded-[2px] bg-[#0A1F2A] border border-[#1A4A63] px-3.5 py-2.5 text-sm text-[#EAEAEA] placeholder:text-[#4A6B7A] resize-none focus:outline-none focus:border-[#F78837] transition-colors"
              placeholder="Escribí el contenido del aviso..."
            />
          </div>

          {/* Fechas */}
          <div className="grid md:grid-cols-2 gap-3">
            <DateInput
              name="publishAt"
              value={form.publishAt}
              onChange={(v) => setForm((f) => ({ ...f, publishAt: v }))}
              label="Publicar desde"
              allowFuture
              showYearPicker={false}
            />
            <DateInput
              name="expiresAt"
              value={form.expiresAt}
              onChange={(v) => setForm((f) => ({ ...f, expiresAt: v }))}
              label="Vence (opcional)"
              allowFuture
              showYearPicker={false}
            />
          </div>

          {/* Pinned toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm((f) => ({ ...f, pinned: !f.pinned }))}
              className={cn(
                "w-10 h-5.5 rounded-full transition-colors relative",
                form.pinned ? "bg-[#F78837]" : "bg-zinc-700",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-4.5 rounded-full bg-white shadow transition-transform",
                  form.pinned ? "translate-x-[22px]" : "translate-x-0.5",
                )}
              />
            </div>
            <span className="text-sm text-[#EAEAEA]">Fijar al inicio</span>
          </label>

          <div className="flex max-md:flex-col gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="md:flex-1"
              onClick={closeForm}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              className="md:flex-1"
              loading={isPending}
            >
              {editing ? "Guardar" : "Crear"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal confirmar eliminar */}
      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
        title="Eliminar noticia"
        description="Esta acción no se puede deshacer."
        size="sm"
      >
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => setConfirmDeleteId(null)}
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
});
