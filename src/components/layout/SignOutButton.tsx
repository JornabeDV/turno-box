"use client";

import { signOut } from "next-auth/react";
import { SignOut } from "@phosphor-icons/react";

interface SignOutButtonProps {
  iconOnly?: boolean;
  callbackUrl?: string;
}

export function SignOutButton({ iconOnly = false, callbackUrl = "/auth/login" }: SignOutButtonProps) {
  if (iconOnly) {
    return (
      <button
        onClick={() => signOut({ redirectTo: callbackUrl })}
        className="flex items-center justify-center text-secondary hover:text-danger active:scale-95 transition-all duration-150 cursor-pointer"
        aria-label="Cerrar sesión"
      >
        <SignOut size={18} />
      </button>
    );
  }

  return (
    <button
      onClick={() => signOut({ redirectTo: callbackUrl })}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-4 border border-border bg-transparent text-sm sm:text-base font-medium text-secondary hover:border-danger hover:text-danger active:scale-[0.98] transition-all duration-150 cursor-pointer"
    >
      <SignOut size={17} className="md:size-5" />
      <span className="uppercase tracking-wide text-xs md:text-sm">Cerrar sesión</span>
    </button>
  );
}
