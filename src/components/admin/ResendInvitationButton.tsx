"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { resendInvitationAction } from "@/actions/import";
import { PaperPlaneTilt, CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function ResendInvitationButton({
  studentId,
  fullWidth = false,
  className,
}: {
  studentId: string;
  fullWidth?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await resendInvitationAction(studentId);
    setLoading(false);
    if (res.success) {
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      loading={loading}
      disabled={sent}
      fullWidth={fullWidth}
      className={cn(className)}
    >
      {sent ? (
        <>
          <CheckCircle size={14} className="text-[#27C7B8]" />
          <span className="text-[#27C7B8]">Enviado</span>
        </>
      ) : (
        <>
          <PaperPlaneTilt size={14} />
          Reenviar invitación
        </>
      )}
    </Button>
  );
}
