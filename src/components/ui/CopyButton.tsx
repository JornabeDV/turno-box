"use client";

import { useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "./Button";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  size?: number;
}

export function CopyButton({ value, label, className = "", size = 18 }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(label ? `${label} copiado` : "Copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="md"
      onClick={handleCopy}
      className={`shrink-0 px-0 w-12 md:w-14 ${className}`}
      aria-label={label ? `Copiar ${label.toLowerCase()}` : "Copiar"}
      title={label ? `Copiar ${label.toLowerCase()}` : "Copiar"}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
    </Button>
  );
}
