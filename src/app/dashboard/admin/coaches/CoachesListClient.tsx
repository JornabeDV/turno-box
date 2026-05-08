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
 <div className="bg-[#0E2A38] border border-[#1A4A63] overflow-hidden">
 <div className="divide-y divide-[#1A4A63]">
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
 "size-10 rounded-[2px] border flex items-center justify-center text-sm font-bold shrink-0",
 coach.isActive
 ? "bg-[#F78837]/10 border-[#F78837]/20 text-[#F78837]"
 : "bg-[#0A1F2A] border-[#1A4A63] text-[#4A6B7A]"
)}>
 {initials}
 </div>

 {/* Info */}
 <div className="flex-1 min-w-0">
 <p className={cn("text-sm font-medium truncate leading-tight", coach.isActive ? "text-[#EAEAEA]" : "text-[#6B8A99]")}>
 {coach.name ?? "Sin nombre"}
 </p>
 <p className="text-xs text-[#4A6B7A] truncate mt-0.5">{coach.email}</p>
 </div>

 {/* Días que enseña */}
 <div className="hidden md:flex items-center gap-1 shrink-0">
 {coach.teachingDays.length === 0 ? (
 <span className="text-xs text-[#4A6B7A]">Sin clases</span>
) : (
 coach.teachingDays.map((d) => (
 <span
 key={d}
 className={cn(
 "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
 d === dayOfWeek
 ? "bg-[#F78837]/15 text-[#F78837]"
 : "bg-[#0E2A38] text-[#6B8A99]"
)}
 >
 {DAY_LABELS[d]}
 </span>
))
)}
 </div>

 {/* Clases totales + asistentes hoy */}
 <div className="hidden sm:flex flex-col items-end shrink-0 min-w-[60px]">
 <span className="text-xs font-mono text-[#6B8A99] tabular-nums">
 {coach.classCount} {coach.classCount === 1 ? "clase" : "clases"}
 </span>
 {coach.todayAttendees > 0 && (
 <span className="text-[10px] text-[#27C7B8] tabular-nums">
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
 className="size-8 rounded-[2px] flex items-center justify-center text-[#6B8A99] cursor-pointer hover:text-[#E61919] hover:bg-[#0E2A38] transition-all shrink-0"
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
