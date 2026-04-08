"use client";

import { togglePackActiveAction } from "@/actions/payments";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";

type Props = { packId: string; initialIsActive: boolean };

export function PackToggleButton({ packId, initialIsActive }: Props) {
  return (
    <ToggleActiveButton
      userId={packId}
      initialIsActive={initialIsActive}
      entityLabel="pack"
      action={togglePackActiveAction}
    />
  );
}
