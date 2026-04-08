"use client";

import { toggleStudentActiveAction } from "@/actions/students";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";

type Props = { studentId: string; initialIsActive: boolean };

export function ToggleStudentButton({ studentId, initialIsActive }: Props) {
  return (
    <ToggleActiveButton
      userId={studentId}
      initialIsActive={initialIsActive}
      entityLabel="alumno"
      action={toggleStudentActiveAction}
    />
  );
}
