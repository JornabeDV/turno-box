"use client";

import { signOut } from "next-auth/react";
import { SignOut } from "@phosphor-icons/react";

export function SignOutButton() {
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
