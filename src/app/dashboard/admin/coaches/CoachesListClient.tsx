"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { ToggleCoachButton } from "@/components/admin/ToggleCoachButton";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { deleteCoachAction } from "@/actions/coaches";
import { cn } from "@/lib/utils";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lun",
  TUESDAY: "Mar",
  WEDNESDAY: "Mié",
  THURSDAY: "Jue",
  FRIDAY: "Vie",
  SATURDAY: "Sáb",
  SUNDAY: "Dom",
};

export type CoachRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  classCount: number;
  overrideCount: number;
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

  useEffect(() => {
    setCoaches(initial);
  }, [initial]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirmDeleteId) return;
    startTransition(async () => {
      const res = await deleteCoachAction(confirmDeleteId);
      if (res.success) {
        setCoaches((prev) => prev.filter((c) => c.id !== confirmDeleteId));
        setConfirmDeleteId(null);
        toast.success("Profesor eliminado");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <div className="bg-card border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {coaches.map((coach, i) => {
            const initials = coach.name
              ? coach.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : coach.email[0].toUpperCase();

            return (
              <div
                key={coach.id}
                onClick={() =>
                  router.push(`/dashboard/admin/coaches/${coach.id}`)
                }
                className={cn(
                  "flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 cursor-pointer hover:bg-white/[0.03] transition-colors animate-in",
                  `stagger-${Math.min(i + 1, 6)}`,
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "size-10 rounded-[2px] border flex items-center justify-center text-sm font-bold shrink-0",
                    coach.isActive
                      ? "bg-brand/10 border-brand/20 text-brand"
                      : "bg-page border-border text-muted",
                  )}
                >
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm md:text-base font-medium truncate leading-tight",
                      coach.isActive ? "text-primary" : "text-secondary",
                    )}
                  >
                    {coach.name ?? "Sin nombre"}
                  </p>
                  {coach.role === "ADMIN" && (
                    <p className="text-[10px] md:text-xs text-brand uppercase tracking-wider">
                      Administrador
                    </p>
                  )}
                </div>

                {/* Días que enseña */}
                <div className="hidden md:flex items-center gap-1 shrink-0">
                  {coach.teachingDays.length === 0 ? (
                    <span className="text-xs md:text-sm text-muted">Sin clases</span>
                  ) : (
                    coach.teachingDays.map((d) => (
                      <span
                        key={d}
                        className={cn(
                          "text-[10px] md:text-sm font-medium px-1.5 py-0.5 rounded-md",
                          d === dayOfWeek
                            ? "bg-brand/15 text-brand"
                            : "bg-card text-secondary",
                        )}
                      >
                        {DAY_LABELS[d]}
                      </span>
                    ))
                  )}
                </div>

                {/* Clases totales + asistentes hoy */}
                <div className="hidden sm:flex flex-col items-end shrink-0 min-w-[60px]">
                  <span className="text-xs md:text-sm font-mono text-secondary tabular-nums">
                    {coach.classCount}{" "}
                    {coach.classCount === 1 ? "clase" : "clases"}
                  </span>
                  {coach.overrideCount > 0 && (
                    <span className="text-[10px] md:text-sm text-brand tabular-nums">
                      +{coach.overrideCount} única
                      {coach.overrideCount === 1 ? "" : "s"}
                    </span>
                  )}
                  {coach.todayAttendees > 0 && (
                    <span className="text-[10px] md:text-sm text-success tabular-nums">
                      {coach.todayAttendees} hoy
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div
                  className="flex items-center gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ToggleCoachButton
                    coachId={coach.id}
                    initialIsActive={coach.isActive}
                  />
                  {coach.role !== "ADMIN" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(coach.id);
                      }}
                      className="size-8 rounded-[2px] flex items-center justify-center text-secondary cursor-pointer hover:text-danger hover:bg-card transition-all shrink-0"
                    >
                      <TrashIcon size={16} weight="bold" />
                    </button>
                  ) : (
                    <div className="size-8 shrink-0" aria-hidden="true" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
        title="Eliminar profesor"
        description="Esta acción no se puede deshacer."
        size="md"
      >
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="flex-1"
            onClick={() => setConfirmDeleteId(null)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
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
}
