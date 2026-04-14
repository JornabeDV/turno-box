"use client";

import { signOut } from "next-auth/react";
import { SignOut } from "@phosphor-icons/react";

export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  if (iconOnly) {
    return (
      <button
        onClick={() => signOut({ callbackUrl: "/auth/login" })}
        className="flex items-center justify-center text-rose-400 hover:text-rose-300 active:scale-95 transition-all duration-150 cursor-pointer"
        aria-label="Cerrar sesión"
      >
        <SignOut size={18} />
      </button>
    );
  }

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 active:scale-[0.98] transition-all duration-150 cursor-pointer"
    >
      <SignOut size={17} />
      Cerrar sesión
    </button>
  );
}
