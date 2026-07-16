"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Props = {
  nextLimit: number;
  basePath: string;
};

export function LoadMoreButton({ nextLimit, basePath }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(nextLimit));
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="w-full flex items-center justify-center h-12 border border-border text-sm text-secondary hover:text-primary hover:border-secondary transition-colors font-[family-name:var(--font-oswald)] uppercase tracking-wide disabled:opacity-50"
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          <span className="size-3.5 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
          Cargando…
        </span>
      ) : (
        "Ver más"
      )}
    </button>
  );
}
