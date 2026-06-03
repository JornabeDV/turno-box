"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CreateStudentModal } from "./CreateStudentModal";
import { UserPlus } from "@phosphor-icons/react";

export function CreateStudentButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="brand" size="md" onClick={() => setOpen(true)}>
        <UserPlus size={16} className="max-sm:hidden" />
        Nuevo alumno
      </Button>
      <CreateStudentModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
