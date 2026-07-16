"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";

interface BackButtonProps {
  href: string;
}

export function BackButton({ href }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="size-9 rounded-[2px] border border-border bg-card flex items-center justify-center text-secondary hover:text-primary hover:border-brand transition-colors shrink-0"
    >
      <ArrowLeftIcon size={18} weight="bold" />
    </Link>
  );
}
