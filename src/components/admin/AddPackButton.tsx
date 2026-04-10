"use client";

import { useState } from "react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { CreatePackModal } from "@/components/admin/CreatePackModal";

export function AddPackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" variant="brand" onClick={() => setOpen(true)}>
        <PlusIcon size={14} weight="bold" />
        Nuevo abono
      </Button>
      <CreatePackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
