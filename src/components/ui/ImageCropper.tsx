"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import { XIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "./Button";

export type Point = { x: number; y: number };
export type Area = { x: number; y: number; width: number; height: number };

type Props = {
  imageSrc: string;
  aspect?: number;
  onCancel: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
};

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg", 0.92);
  });
}

export function ImageCropper({
  imageSrc,
  aspect = 16 / 9,
  onCancel,
  onCropComplete,
}: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropCompleteInternal = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(blob);
    } catch {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#0A1F2A] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[#1A4A63] shrink-0">
        <span className="text-sm font-medium text-[#EAEAEA] uppercase tracking-wider">
          Ajustar imagen
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="size-8 flex items-center justify-center text-[#6B8A99] hover:text-[#EAEAEA] transition-colors"
        >
          <XIcon size={20} weight="bold" />
        </button>
      </div>

      {/* Cropper */}
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropCompleteInternal}
          showGrid={false}
          cropShape="rect"
          style={{
            containerStyle: { background: "#0A1F2A" },
            cropAreaStyle: {
              border: "2px solid #F78837",
              color: "rgba(10, 31, 42, 0.6)",
            },
          }}
        />
      </div>

      {/* Controls */}
      <div className="px-4 py-4 border-t border-[#1A4A63] space-y-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6B8A99] uppercase tracking-wider shrink-0">
            Zoom
          </span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[#F78837] h-1.5 bg-[#1A4A63] rounded-full appearance-none cursor-pointer"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="flex-1"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="brand"
            size="md"
            className="flex-1"
            loading={loading}
            onClick={handleConfirm}
          >
            <CheckIcon size={16} weight="bold" className="mr-1.5" />
            Recortar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
