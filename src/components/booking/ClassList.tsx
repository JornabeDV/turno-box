"use client";

import { useState } from "react";
import { ClassCard } from "@/components/booking/ClassCard";
import { DaySelector } from "@/components/booking/DaySelector";
import type { ClassSlot } from "@/types";

type Props = {
  initialSlots: ClassSlot[];
  initialDate: Date;
  gymId: string;
  userId: string;
};

// Componente cliente que maneja el cambio de día con refetch via server action
export function ClassList({ initialSlots, initialDate, gymId, userId }: Props) {
  const [slots, setSlots] = useState(initialSlots);
  const [date, setDate] = useState(initialDate);
  const [loading, setLoading] = useState(false);

  async function handleDateChange(newDate: Date) {
    setDate(newDate);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/classes?gymId=${gymId}&date=${newDate.toISOString()}&userId=${userId}`
      );
      const data: ClassSlot[] = await res.json();
      setSlots(data);
    } finally {
      setLoading(false);
    }
  }

  const dateStr = date.toISOString().split("T")[0];

  return (
    <div>
      <DaySelector initialDate={date} onChange={handleDateChange} />

      <div className="py-4 space-y-3">
        {loading ? (
          // Skeleton loader con las mismas dimensiones que las cards
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-4 h-[148px] animate-pulse"
            />
          ))
        ) : slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-400">Sin clases este día</p>
            <p className="text-xs text-zinc-600 mt-1">Probá con otro día de la semana</p>
          </div>
        ) : (
          slots.map((slot, i) => (
            <ClassCard key={slot.id} slot={slot} dateStr={dateStr} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
