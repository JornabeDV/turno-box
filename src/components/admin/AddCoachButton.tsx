"use client";

import { useState } from "react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { CreateCoachModal } from "@/components/admin/CreateCoachModal";

export function AddCoachButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" variant="brand" onClick={() => setOpen(true)}>
        <PlusIcon size={14} weight="bold" />
        Agregar coach
      </Button>
      <CreateCoachModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
