"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types";

type Props = {
  userId: string;
  initialIsActive: boolean;
  entityLabel: string; // "alumno" | "coach"
  action: (id: string) => Promise<ActionResult<{ isActive: boolean }>>;
};

export function ToggleActiveButton({ userId, initialIsActive, entityLabel, action }: Props) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    const msg = isActive ? `¿Desactivar este ${entityLabel}?` : `¿Reactivar este ${entityLabel}?`;
    if (!confirm(msg)) return;

    startTransition(async () => {
      const res = await action(userId);
      if (res.success) {
        setIsActive(res.data.isActive);
        toast.success(res.data.isActive ? `${entityLabel} activado` : `${entityLabel} desactivado`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "text-xs font-medium px-3 py-1.5 rounded-lg border transition-all active:scale-95 disabled:opacity-40 shrink-0",
        isActive
          ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
          : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
      )}
    >
      {isPending
        ? <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" />
        : isActive ? "Desactivar" : "Activar"
      }
    </button>
  );
}
