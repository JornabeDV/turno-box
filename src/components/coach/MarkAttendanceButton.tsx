"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { markClassAttendanceTakenAction } from "@/actions/bookings";

interface Props {
  classId: string;
  dateStr: string;
  allAttended: boolean;
  confirmedCount: number;
}

export function MarkAttendanceButton({
  classId,
  dateStr,
  allAttended,
  confirmedCount,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [attended, setAttended] = useState(allAttended);

  if (confirmedCount === 0) return null;

  if (attended) {
    return (
      <Button
        variant="outline"
        size="lg"
        disabled
        className="text-[#27C7B8] border-[#27C7B8]/30"
      >
        <CheckIcon size={16} weight="bold" className="mr-1.5" />
        Asistencia confirmada
      </Button>
    );
  }

  function handleClick() {
    startTransition(async () => {
      const result = await markClassAttendanceTakenAction(classId, dateStr);
      if (result.success) {
        setAttended(true);
        toast.success("Asistencia confirmada");
      } else {
        toast.error(result.error ?? "No se pudo confirmar la asistencia");
      }
    });
  }

  return (
    <Button
      variant="brand"
      size="md"
      loading={isPending}
      onClick={handleClick}
    >
      <CheckIcon size={16} weight="bold" className="mr-1.5" />
      Confirmar asistencia
    </Button>
  );
}
