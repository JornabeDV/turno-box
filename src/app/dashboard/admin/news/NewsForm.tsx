"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";
import { DateInput } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import { ImageCropper } from "@/components/ui/ImageCropper";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
} from "@/actions/announcements";
import type { Announcement } from "@prisma/client";

type Props = {
  announcement?: Announcement | null;
};

type FormState = {
  title: string;
  body: string;
  pinned: boolean;
  publishAt: string;
  expiresAt: string;
};

const inputClass =
  "w-full h-12 rounded-[2px] bg-page border border-border px-3.5 text-sm sm:text-base text-primary placeholder:text-muted focus:outline-none focus:border-brand transition-colors";

const labelClass =
  "text-xs sm:text-sm font-medium text-secondary uppercase tracking-wider";

export function NewsForm({ announcement }: Props) {
  const router = useRouter();
  const isEditing = !!announcement;

  const [form, setForm] = useState<FormState>({
    title: announcement?.title ?? "",
    body: announcement?.body ?? "",
    pinned: announcement?.pinned ?? false,
    publishAt: announcement?.publishAt
      ? announcement.publishAt.toISOString().slice(0, 10)
      : "",
    expiresAt: announcement?.expiresAt
      ? announcement.expiresAt.toISOString().slice(0, 10)
      : "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    announcement?.imageUrl ?? null
  );
  const [removeImage, setRemoveImage] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState("image.jpg");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      toast.error("La imagen debe ser PNG, JPG o WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5MB.");
      return;
    }

    setRemoveImage(false);
    setPendingFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropperSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleCropComplete(croppedBlob: Blob) {
    setCropperSrc(null);
    const croppedFile = new File([croppedBlob], pendingFileName, {
      type: "image/jpeg",
    });
    if (imagePreview && !announcement?.imageUrl) {
      URL.revokeObjectURL(imagePreview);
    }
    const previewUrl = URL.createObjectURL(croppedBlob);
    setImageFile(croppedFile);
    setImagePreview(previewUrl);
  }

  function handleCropCancel() {
    setCropperSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("pinned", form.pinned ? "true" : "false");
    if (imageFile) {
      fd.set("imageFile", imageFile);
    }
    if (removeImage) {
      fd.set("removeImage", "true");
    }

    startTransition(async () => {
      const res = isEditing
        ? await updateAnnouncementAction(announcement.id, fd)
        : await createAnnouncementAction(fd);

      if (res.success) {
        toast.success(isEditing ? "Noticia actualizada" : "Noticia creada");
        router.push("/dashboard/admin/news");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <BackButton href="/dashboard/admin/news" />
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary tracking-tight">
          {isEditing ? "Editar noticia" : "Nueva noticia"}
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <div className="space-y-1.5">
          <label className={labelClass}>Título</label>
          <input
            name="title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
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
            rows={5}
            className="w-full rounded-[2px] bg-page border border-border px-3.5 py-2.5 text-sm sm:text-base text-primary placeholder:text-muted resize-none focus:outline-none focus:border-brand transition-colors"
            placeholder="Escribí el contenido del aviso..."
          />
        </div>

        {/* Imagen */}
        <div className="space-y-1.5">
          <label className={labelClass}>Imagen (opcional)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {imagePreview ? (
            <div className="relative w-full aspect-video rounded-[2px] border border-border overflow-hidden bg-page">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 size-7 rounded-full bg-page/80 text-primary flex items-center justify-center hover:bg-danger transition-colors"
              >
                <XIcon size={14} weight="bold" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-28 rounded-[2px] border border-dashed border-border bg-page flex flex-col items-center justify-center gap-1.5 text-secondary hover:text-primary hover:border-brand transition-colors cursor-pointer"
            >
              <ImageIcon size={24} />
              <span className="text-xs sm:text-sm uppercase tracking-wider">
                Hacé clic para subir una imagen
              </span>
              <span className="text-[10px] sm:text-xs text-muted">
                PNG, JPG o WEBP · Máx 5MB · Ratio 16:9 recomendado
              </span>
            </button>
          )}
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
              form.pinned ? "bg-brand" : "bg-panel"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-4.5 rounded-full bg-white shadow transition-transform",
                form.pinned ? "translate-x-[22px]" : "translate-x-0.5"
              )}
            />
          </div>
          <span className="text-sm md:text-base text-primary">
            Fijar al inicio
          </span>
        </label>

        {/* Actions */}
        <div className="flex max-md:flex-col gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="md:flex-1"
            onClick={() => router.push("/dashboard/admin/news")}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="brand"
            size="md"
            className="md:flex-1"
            loading={isPending}
          >
            {isEditing ? "Guardar cambios" : "Crear noticia"}
          </Button>
        </div>
      </form>

      {/* Cropper overlay */}
      {cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          aspect={16 / 9}
          onCancel={handleCropCancel}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
