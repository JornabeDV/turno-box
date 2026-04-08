import type { Role, BookingStatus, DayOfWeek } from "@prisma/client";

// Re-export enums para uso en cliente sin importar de @prisma/client
export type { Role, BookingStatus, DayOfWeek };

// ─── DTOs / shapes usados en la UI ───────────────────────────────────────────

export type UserSession = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  gymId: string | null;
  image: string | null;
};

export type ClassSlot = {
  id: string;
  name: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  color: string | null;
  coachName: string | null;
  // calculados al momento del query
  confirmedCount: number;
  availableSpots: number;
  isFull: boolean;
  userBooking: {
    id: string;
    status: BookingStatus;
    waitlistPos: number | null;
  } | null;
};

export type BookingCard = {
  id: string;
  status: BookingStatus;
  classDate: Date;
  waitlistPos: number | null;
  class: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    dayOfWeek: DayOfWeek;
    coachName: string | null;
  };
};

export type AdminMetrics = {
  classesToday: number;
  totalConfirmedToday: number;
  occupancyRate: number;
  cancellationsToday: number;
  activeStudents: number;
};

// ─── Action results ────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
