"use client";

import { toggleStudentActiveAction } from "@/actions/students";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";

type Props = {
  studentId: string;
  initialIsActive: boolean;
  fullWidth?: boolean;
  className?: string;
};

export function ToggleStudentButton({
  studentId,
  initialIsActive,
  fullWidth = false,
  className,
}: Props) {
  return (
    <ToggleActiveButton
      userId={studentId}
      initialIsActive={initialIsActive}
      entityLabel="alumno"
      action={toggleStudentActiveAction}
      fullWidth={fullWidth}
      className={className}
    />
  );
}
