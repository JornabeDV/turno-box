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
      className="size-9 rounded-[2px] border border-[#1A4A63] bg-[#0E2A38] flex items-center justify-center text-[#6B8A99] hover:text-[#EAEAEA] hover:border-[#F78837] transition-colors shrink-0"
    >
      <ArrowLeftIcon size={18} weight="bold" />
    </Link>
  );
}
