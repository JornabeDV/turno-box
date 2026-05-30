"use client";

import { signOut } from "next-auth/react";
import { SignOut } from "@phosphor-icons/react";

export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  if (iconOnly) {
    return (
      <button
        onClick={() => signOut({ callbackUrl: "/auth/login" })}
        className="flex items-center justify-center text-[#6B8A99] hover:text-[#E61919] active:scale-95 transition-all duration-150 cursor-pointer"
        aria-label="Cerrar sesión"
      >
        <SignOut size={18} />
      </button>
    );
  }

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[#1A4A63] bg-transparent text-sm font-medium text-[#6B8A99] hover:border-[#E61919] hover:text-[#E61919] active:scale-[0.98] transition-all duration-150 cursor-pointer"
    >
      <SignOut size={17} />
      <span className="uppercase tracking-wide text-xs">Cerrar sesión</span>
    </button>
  );
}
