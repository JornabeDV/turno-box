"use client";

import { useState } from "react";
import { ClassCardCompact } from "@/components/booking/ClassCardCompact";
import { DaySelector } from "@/components/booking/DaySelector";
import { DaySelectorCompact } from "@/components/booking/DaySelectorCompact";
import { CalendarBlank } from "@phosphor-icons/react";
import type { ClassSlot } from "@/types";

type Props = {
  initialSlots: ClassSlot[];
  initialDate: Date;
  gymId: string;
  userId: string;
  availableDays: number[];
  compact?: boolean;
};

export function ClassList({ initialSlots, initialDate, gymId, userId, availableDays, compact }: Props) {
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

  const dateStr = date.toLocaleDateString("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const todayStr = new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
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
      {compact ? (
        <DaySelectorCompact
          initialDate={date}
          onChange={handleDateChange}
          availableDays={availableDays}
        />
      ) : (
        <DaySelector
          initialDate={date}
          onChange={handleDateChange}
          availableDays={availableDays}
        />
      )}

      {/* Título de sección */}
      <div className="pt-2 md:pt-4">
        <div className="flex items-center justify-between border-b border-border pb-2 md:pb-3">
          <h3 className="font-[family-name:var(--font-oswald)] font-bold text-primary uppercase tracking-tight text-lg md:text-2xl">
            Clases disponibles {isToday ? "hoy" : ""}
          </h3>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          // Skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border h-[140px] md:h-[180px] animate-pulse"
            />
          ))
        ) : visibleSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center border border-border bg-card">
            <CalendarBlank size={28} className="text-border mb-3 md:mb-4 md:size-10" />
            <p className="text-sm md:text-base font-[family-name:var(--font-oswald)] font-medium text-secondary uppercase tracking-wide">
              Sin clases este día
            </p>
            <p className="text-xs md:text-sm font-[family-name:var(--font-jetbrains)] uppercase tracking-wider text-muted mt-1 md:mt-2">
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
