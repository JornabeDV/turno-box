"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { resendInvitationAction } from "@/actions/import";
import { PaperPlaneTilt, CheckCircle } from "@phosphor-icons/react";

export function ResendInvitationButton({ studentId }: { studentId: string }) {
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
