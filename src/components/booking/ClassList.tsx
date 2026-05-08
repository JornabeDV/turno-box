"use client";

import { useState } from "react";
import { ClassCardCompact } from "@/components/booking/ClassCardCompact";
import { DaySelector } from "@/components/booking/DaySelector";
import { CalendarBlank } from "@phosphor-icons/react";
import type { ClassSlot } from "@/types";

type Props = {
  initialSlots: ClassSlot[];
  initialDate: Date;
  gymId: string;
  userId: string;
};

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
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = dateStr === todayStr;

  const visibleSlots = isToday
    ? slots.filter((slot) => {
        const [h, m] = slot.startTime.split(":").map(Number);
        const now = new Date();
        return h > now.getHours() || (h === now.getHours() && m >= now.getMinutes());
      })
    : slots;

  return (
    <div className="space-y-4">
      <DaySelector initialDate={date} onChange={handleDateChange} />

      {/* Título de sección */}
      <div className="pt-2">
        <h3 className="font-[family-name:var(--font-oswald)] font-bold text-[#EAEAEA] uppercase tracking-tight text-lg border-b border-[#1A4A63] pb-2">
          Clases disponibles {isToday ? "hoy" : ""}
        </h3>
      </div>

      <div className="space-y-3">
        {loading ? (
          // Skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#0E2A38] border border-[#1A4A63] h-[140px] animate-pulse"
            />
          ))
        ) : visibleSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-[#1A4A63] bg-[#0E2A38]">
            <CalendarBlank size={28} className="text-[#1A4A63] mb-3" />
            <p className="text-sm font-[family-name:var(--font-oswald)] font-medium text-[#6B8A99] uppercase tracking-wide">
              Sin clases este día
            </p>
            <p className="text-xs font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-[#4A6B7A] mt-1">
              Probá con otro día de la semana
            </p>
          </div>
        ) : (
          visibleSlots.map((slot, i) => (
            <ClassCardCompact key={slot.id} slot={slot} dateStr={dateStr} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
