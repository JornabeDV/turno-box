import { prisma } from "@/lib/prisma";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lun", TUESDAY: "Mar", WEDNESDAY: "Mié",
  THURSDAY: "Jue", FRIDAY: "Vie", SATURDAY: "Sáb", SUNDAY: "Dom",
};

function getDayOfWeek(date: Date): string {
  return ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][date.getDay()];
}

function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const d = new Date(start); d.setHours(0, 0, 0, 0);
  const e = new Date(end); e.setHours(0, 0, 0, 0);
  while (d <= e) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
}

function parseHour(time: string): number {
  return parseInt(time.split(":")[0], 10);
}

export type MetricsReport = {
  kpis: {
    totalBookings: number;
    totalCapacity: number;
    occupancyRate: number;
    cancellationRate: number;
    activeStudents: number;
    atRiskStudents: number;
    retentionRate: number;
  };
  dailyTrend: { date: string; label: string; bookings: number; capacity: number; occupancy: number }[];
  byDiscipline: { id: string; name: string; color: string | null; bookings: number; capacity: number; occupancy: number }[];
  byCoach: { id: string; name: string; bookings: number; capacity: number; occupancy: number }[];
  byGender: { gender: string; label: string; bookings: number; percentage: number }[];
  byHour: { hour: number; label: string; bookings: number; capacity: number; occupancy: number }[];
  byDayOfWeek: { day: string; label: string; bookings: number; capacity: number; occupancy: number }[];
  topClasses: { id: string; name: string; time: string; coach: string | null; bookings: number; capacity: number; occupancy: number }[];
  periodLabel: string;
};

export async function calculateMetricsReport(
  gymId: string,
  start: Date,
  end: Date,
  periodLabel: string
): Promise<MetricsReport> {
  const classes = await prisma.gymClass.findMany({
    where: { gymId, isActive: true, deletedAt: null },
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      maxCapacity: true,
      discipline: { select: { id: true, name: true, color: true } },
      coach: { select: { id: true, name: true } },
      bookings: {
        where: { classDate: { gte: start, lte: end }, deletedAt: null },
        select: { status: true, user: { select: { gender: true } } },
      },
    },
  });

  const totalBookings = classes.reduce((sum, c) => sum + c.bookings.filter((b) => b.status === "CONFIRMED").length, 0);
  const totalCancelled = classes.reduce((sum, c) => sum + c.bookings.filter((b) => b.status === "CANCELLED").length, 0);

  const daysInRange = eachDay(start, end);
  let totalCapacity = 0;
  for (const day of daysInRange) {
    const dow = getDayOfWeek(day);
    const dayClasses = classes.filter((c) => c.dayOfWeek === dow);
    totalCapacity += dayClasses.reduce((sum, c) => sum + c.maxCapacity, 0);
  }

  const occupancyRate = totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0;
  const totalAll = totalBookings + totalCancelled;
  const cancellationRate = totalAll > 0 ? Math.round((totalCancelled / totalAll) * 100) : 0;

  const [activeStudents, atRiskCount] = await Promise.all([
    prisma.user.count({ where: { gymId, role: "STUDENT", isActive: true } }),
    prisma.user.count({
      where: {
        gymId, role: "STUDENT", isActive: true,
        bookings: {
          none: {
            classDate: { gte: new Date(Date.now() - 30 * 86400000) },
            status: "CONFIRMED", deletedAt: null,
          },
        },
      },
    }),
  ]);

  const retentionRate = activeStudents > 0 ? Math.round(((activeStudents - atRiskCount) / activeStudents) * 100) : 0;

  const dailyTrend = daysInRange.map((day) => {
    const dow = getDayOfWeek(day);
    const dayClasses = classes.filter((c) => c.dayOfWeek === dow);
    const dayCapacity = dayClasses.reduce((sum, c) => sum + c.maxCapacity, 0);
    const dayBookings = dayClasses.reduce((sum, c) => sum + c.bookings.filter((b) => b.status === "CONFIRMED").length, 0);
    return {
      date: day.toISOString().split("T")[0],
      label: String(day.getDate()),
      bookings: dayBookings,
      capacity: dayCapacity,
      occupancy: dayCapacity > 0 ? Math.round((dayBookings / dayCapacity) * 100) : 0,
    };
  });

  const disciplineMap = new Map<string, { id: string; name: string; color: string | null; bookings: number; capacity: number }>();
  for (const c of classes) {
    const d = c.discipline; if (!d) continue;
    const existing = disciplineMap.get(d.id) || { id: d.id, name: d.name, color: d.color, bookings: 0, capacity: 0 };
    const dowCount = daysInRange.filter((day) => getDayOfWeek(day) === c.dayOfWeek).length;
    existing.bookings += c.bookings.filter((b) => b.status === "CONFIRMED").length;
    existing.capacity += c.maxCapacity * dowCount;
    disciplineMap.set(d.id, existing);
  }
  const byDiscipline = Array.from(disciplineMap.values())
    .map((d) => ({ ...d, occupancy: d.capacity > 0 ? Math.round((d.bookings / d.capacity) * 100) : 0 }))
    .sort((a, b) => b.occupancy - a.occupancy);

  const coachMap = new Map<string, { id: string; name: string; bookings: number; capacity: number }>();
  for (const c of classes) {
    const coachId = c.coach?.id ?? "none";
    const coachName = c.coach?.name ?? "Sin profesor";
    const existing = coachMap.get(coachId) || { id: coachId, name: coachName, bookings: 0, capacity: 0 };
    const dowCount = daysInRange.filter((day) => getDayOfWeek(day) === c.dayOfWeek).length;
    existing.bookings += c.bookings.filter((b) => b.status === "CONFIRMED").length;
    existing.capacity += c.maxCapacity * dowCount;
    coachMap.set(coachId, existing);
  }
  const byCoach = Array.from(coachMap.values())
    .map((c) => ({ ...c, occupancy: c.capacity > 0 ? Math.round((c.bookings / c.capacity) * 100) : 0 }))
    .sort((a, b) => b.occupancy - a.occupancy);

  const genderCounts: Record<string, number> = {};
  let genderTotal = 0;
  for (const c of classes) {
    for (const b of c.bookings) {
      if (b.status !== "CONFIRMED") continue;
      const g = b.user?.gender ?? "UNKNOWN";
      genderCounts[g] = (genderCounts[g] || 0) + 1;
      genderTotal++;
    }
  }
  const genderLabels: Record<string, string> = {
    MALE: "Masculino", FEMALE: "Femenino", OTHER: "Otro",
    PREFER_NOT_TO_SAY: "Prefiero no decir", UNKNOWN: "No especificado",
  };
  const byGender = Object.entries(genderCounts)
    .map(([gender, bookings]) => ({
      gender, label: genderLabels[gender] || gender, bookings,
      percentage: genderTotal > 0 ? Math.round((bookings / genderTotal) * 100) : 0,
    }))
    .sort((a, b) => b.bookings - a.bookings);

  const hourMap = new Map<number, { hour: number; bookings: number; capacity: number }>();
  for (const c of classes) {
    const h = parseHour(c.startTime);
    const existing = hourMap.get(h) || { hour: h, bookings: 0, capacity: 0 };
    const dowCount = daysInRange.filter((day) => getDayOfWeek(day) === c.dayOfWeek).length;
    existing.bookings += c.bookings.filter((b) => b.status === "CONFIRMED").length;
    existing.capacity += c.maxCapacity * dowCount;
    hourMap.set(h, existing);
  }
  const byHour = Array.from(hourMap.values())
    .sort((a, b) => a.hour - b.hour)
    .map((h) => ({ ...h, label: `${String(h.hour).padStart(2, "0")}:00`,
      occupancy: h.capacity > 0 ? Math.round((h.bookings / h.capacity) * 100) : 0,
    }));

  const dowMap = new Map<string, { day: string; bookings: number; capacity: number }>();
  for (const c of classes) {
    const existing = dowMap.get(c.dayOfWeek) || { day: c.dayOfWeek, bookings: 0, capacity: 0 };
    const dowCount = daysInRange.filter((day) => getDayOfWeek(day) === c.dayOfWeek).length;
    existing.bookings += c.bookings.filter((b) => b.status === "CONFIRMED").length;
    existing.capacity += c.maxCapacity * dowCount;
    dowMap.set(c.dayOfWeek, existing);
  }
  const byDayOfWeek = DAY_ORDER.filter((d) => dowMap.has(d))
    .map((d) => {
      const item = dowMap.get(d)!;
      return { day: d, label: DAY_LABELS[d], bookings: item.bookings, capacity: item.capacity,
        occupancy: item.capacity > 0 ? Math.round((item.bookings / item.capacity) * 100) : 0,
      };
    });

  const classMap = new Map<string, { id: string; name: string; time: string; coach: string | null; bookings: number; capacity: number }>();
  for (const c of classes) {
    const existing = classMap.get(c.id) || {
      id: c.id, name: c.discipline?.name || "Sin disciplina",
      time: c.startTime, coach: c.coach?.name || null, bookings: 0, capacity: 0,
    };
    const dowCount = daysInRange.filter((day) => getDayOfWeek(day) === c.dayOfWeek).length;
    existing.bookings += c.bookings.filter((b) => b.status === "CONFIRMED").length;
    existing.capacity += c.maxCapacity * dowCount;
    classMap.set(c.id, existing);
  }
  const topClasses = Array.from(classMap.values())
    .map((c) => ({ ...c, occupancy: c.capacity > 0 ? Math.round((c.bookings / c.capacity) * 100) : 0 }))
    .sort((a, b) => b.occupancy - a.occupancy)
    .slice(0, 10);

  return {
    kpis: { totalBookings, totalCapacity, occupancyRate, cancellationRate, activeStudents, atRiskStudents: atRiskCount, retentionRate },
    dailyTrend, byDiscipline, byCoach, byGender, byHour, byDayOfWeek, topClasses, periodLabel,
  };
}
