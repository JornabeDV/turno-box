"use client";

import { toggleCoachActiveAction } from "@/actions/coaches";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";

type Props = { coachId: string; initialIsActive: boolean };

export function ToggleCoachButton({ coachId, initialIsActive }: Props) {
  return (
    <ToggleActiveButton
      userId={coachId}
      initialIsActive={initialIsActive}
      entityLabel="coach"
      action={toggleCoachActiveAction}
    />
  );
}
