"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { ToggleCoachButton } from "@/components/admin/ToggleCoachButton";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { deleteCoachAction } from "@/actions/coaches";
import { cn } from "@/lib/utils";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lun", TUESDAY: "Mar", WEDNESDAY: "Mié",
  THURSDAY: "Jue", FRIDAY: "Vie", SATURDAY: "Sáb", SUNDAY: "Dom",
};

export type CoachRow = {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  classCount: number;
  todayAttendees: number;
  teachingDays: string[];
};

interface Props {
  coaches: CoachRow[];
  dayOfWeek: string;
}

export function CoachesListClient({ coaches: initial, dayOfWeek }: Props) {
  const router = useRouter();
  const [coaches, setCoaches] = useState(initial);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirmDeleteId) return;
    startTransition(async () => {
      const res = await deleteCoachAction(confirmDeleteId);
      if (res.success) {
        setCoaches((prev) => prev.filter((c) => c.id !== confirmDeleteId));
        setConfirmDeleteId(null);
        toast.success("Coach eliminado");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/[0.04]">
          {coaches.map((coach, i) => {
            const initials = coach.name
              ? coach.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
              : coach.email[0].toUpperCase();

            return (
              <div
                key={coach.id}
                onClick={() => router.push(`/dashboard/admin/coaches/${coach.id}`)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-colors animate-in",
                  `stagger-${Math.min(i + 1, 6)}`
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "size-10 rounded-xl border flex items-center justify-center text-sm font-bold shrink-0",
                  coach.isActive
                    ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                    : "bg-zinc-900 border-white/[0.04] text-zinc-600"
                )}>
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate leading-tight", coach.isActive ? "text-zinc-100" : "text-zinc-500")}>
                    {coach.name ?? "Sin nombre"}
                  </p>
                  <p className="text-xs text-zinc-600 truncate mt-0.5">{coach.email}</p>
                </div>

                {/* Días que enseña */}
                <div className="hidden md:flex items-center gap-1 shrink-0">
                  {coach.teachingDays.length === 0 ? (
                    <span className="text-xs text-zinc-700">Sin clases</span>
                  ) : (
                    coach.teachingDays.map((d) => (
                      <span
                        key={d}
                        className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                          d === dayOfWeek
                            ? "bg-orange-500/15 text-orange-400"
                            : "bg-zinc-800 text-zinc-500"
                        )}
                      >
                        {DAY_LABELS[d]}
                      </span>
                    ))
                  )}
                </div>

                {/* Clases totales + asistentes hoy */}
                <div className="hidden sm:flex flex-col items-end shrink-0 min-w-[60px]">
                  <span className="text-xs font-mono text-zinc-400 tabular-nums">
                    {coach.classCount} {coach.classCount === 1 ? "clase" : "clases"}
                  </span>
                  {coach.todayAttendees > 0 && (
                    <span className="text-[10px] text-emerald-500 tabular-nums">
                      {coach.todayAttendees} hoy
                    </span>
                  )}
                </div>

                {/* Toggle */}
                <div onClick={(e) => e.stopPropagation()}>
                  <ToggleCoachButton coachId={coach.id} initialIsActive={coach.isActive} />
                </div>

                {/* Eliminar */}
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(coach.id); }}
                  className="size-8 rounded-lg flex items-center justify-center text-zinc-500 cursor-pointer hover:text-rose-400 hover:bg-zinc-800 transition-all shrink-0"
                >
                  <TrashIcon size={16} weight="bold" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
        title="Eliminar coach"
        description="Esta acción no se puede deshacer."
        size="sm"
      >
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmDeleteId(null)}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" size="sm" className="flex-1" loading={isPending} onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Dialog>
    </>
  );
}
