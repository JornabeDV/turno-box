"use client";

import { useState } from "react";
import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { AddStudentToClassModal } from "./AddStudentToClassModal";

interface Props {
  classId: string;
  dateStr: string;
}

export function AddStudentToClassButton({ classId, dateStr }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="md" onClick={() => setOpen(true)}>
        <PlusIcon size={16} weight="bold" className="mr-1.5" />
        Agregar alumno
      </Button>
      <AddStudentToClassModal
        open={open}
        onClose={() => setOpen(false)}
        classId={classId}
        dateStr={dateStr}
      />
    </>
  );
}
