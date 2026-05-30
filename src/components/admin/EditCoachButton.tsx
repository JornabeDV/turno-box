"use client";

import { useState } from "react";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { EditCoachModal } from "./EditCoachModal";

interface Props {
  coach: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function EditCoachButton({ coach }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="brand"
        size="md"
        onClick={() => setOpen(true)}
      >
        Editar
      </Button>
      <EditCoachModal open={open} onClose={() => setOpen(false)} coach={coach} />
    </>
  );
}
