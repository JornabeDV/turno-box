"use client";

import { useState } from "react";
import { Copy, Check, Link as LinkIcon } from "@phosphor-icons/react";

export function CopyInviteButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/join/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs text-[#6B8A99] hover:text-[#F78837] transition-colors"
      title="Copiar link de invitación"
    >
      {copied ? (
        <Check size={14} className="text-[#27C7B8]" />
      ) : (
        <LinkIcon size={14} />
      )}
      <span className="hidden sm:inline">{copied ? "Copiado" : "Copiar"}</span>
    </button>
  );
}
