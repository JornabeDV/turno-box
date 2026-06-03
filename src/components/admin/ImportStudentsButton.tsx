"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImportStudentsModal } from "./ImportStudentsModal";
import { UploadSimple } from "@phosphor-icons/react";

export function ImportStudentsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline-brand" size="md" onClick={() => setOpen(true)}>
        <UploadSimple size={16} />
        Importar alumnos
      </Button>
      <ImportStudentsModal open={open} onOpenChange={setOpen} />
    </>
  );
}
