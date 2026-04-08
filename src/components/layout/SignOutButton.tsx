"use client";

import { signOut } from "next-auth/react";
import { SignOut } from "@phosphor-icons/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-400 transition-colors duration-150 active:scale-95"
    >
      <SignOut size={15} />
      <span className="hidden sm:block">Salir</span>
    </button>
  );
}
