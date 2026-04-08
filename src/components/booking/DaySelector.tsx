"use client";

import { useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

type Props = {
  initialDate: Date;
  onChange: (date: Date) => void;
};

export function DaySelector({ initialDate, onChange }: Props) {
  const [current, setCurrent] = useState(initialDate);

  function shift(days: number) {
    const next = new Date(current);
    next.setDate(next.getDate() + days);
    setCurrent(next);
    onChange(next);
  }

  const isToday =
    current.toDateString() === new Date().toDateString();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-white/[0.04]">
      <button
        onClick={() => shift(-1)}
        className="size-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all active:scale-90"
      >
        <CaretLeft size={16} weight="bold" />
      </button>

      <div className="text-center">
        <p className="text-sm font-semibold text-zinc-100 capitalize">
          {formatDate(current)}
        </p>
        {isToday && (
          <span className="text-[10px] text-orange-500 font-medium uppercase tracking-wider">
            Hoy
          </span>
        )}
      </div>

      <button
        onClick={() => shift(1)}
        className={cn(
          "size-9 rounded-xl flex items-center justify-center transition-all active:scale-90",
          "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
        )}
      >
        <CaretRight size={16} weight="bold" />
      </button>
    </div>
  );
}
