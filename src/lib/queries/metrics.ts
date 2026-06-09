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

function getAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function getAgeRange(age: number | null): string {
  if (age === null) return "UNKNOWN";
  if (age < 18) return "UNDER_18";
  if (age <= 24) return "18_24";
  if (age <= 34) return "25_34";
  if (age <= 44) return "35_44";
  if (age <= 54) return "45_54";
  return "55_PLUS";
}

const AGE_RANGE_ORDER = ["UNDER_18", "18_24", "25_34", "35_44", "45_54", "55_PLUS", "UNKNOWN"] as const;
const AGE_RANGE_LABELS: Record<string, string> = {
  UNDER_18: "< 18",
  "18_24": "18-24",
  "25_34": "25-34",
  "35_44": "35-44",
  "45_54": "45-54",
  "55_PLUS": "55+",
  UNKNOWN: "Sin especificar",
};

function confirmedCount(bookings: { status: string }[]): number {
  return bookings.filter((b) => b.status === "CONFIRMED").length;
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
  byHourDiscipline: { hour: number; label: string; disciplineId: string; disciplineName: string; color: string | null; bookings: number; capacity: number; occupancy: number }[];
  byDayDiscipline: { day: string; label: string; disciplineId: string; disciplineName: string; color: string | null; bookings: number; capacity: number; occupancy: number }[];
  byCoachHour: { hour: number; label: string; coachId: string; coachName: string; bookings: number; capacity: number; occupancy: number }[];
  byHourCancellation: { hour: number; label: string; total: number; cancelled: number; rate: number }[];
  byAgeRange: { range: string; label: string; bookings: number; students: number }[];
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
        select: { status: true, userId: true, user: { select: { gender: true, birthDate: true } } },
      },
    },
  });

  const totalBookings = classes.reduce((sum, c) => sum + confirmedCount(c.bookings), 0);
  const totalCancelled = classes.reduce((sum, c) => sum + c.bookings.filter((b) => b.status === "CANCELLED").length, 0);

  const daysInRange = eachDay(start, end);

  // ── Capacidad total del período ──
  let totalCapacity = 0;
  for (const day of daysInRange) {
    const dow = getDayOfWeek(day);
    const dayClasses = classes.filter((c) => c.dayOfWeek === dow);
    totalCapacity += dayClasses.reduce((sum, c) => sum + c.maxCapacity, 0);
  }

  // Helper: cuántas veces ocurre una clase en el período
  function classInstances(c: typeof classes[number]) {
    return daysInRange.filter((day) => getDayOfWeek(day) === c.dayOfWeek).length;
  }

  // ── Ocupación = promedio de ocupación por clase-instance ──
  // Cada clase ocurre N veces en el período. Como la query trae bookings
  // acumulados de todo el rango, dividimos por N para obtener el promedio
  // por instancia. Así la ocupación nunca supera el 100%.
  let totalOccupancySum = 0;
  let totalTemplates = 0;
  for (const c of classes) {
    const instances = classInstances(c);
    const bookings = confirmedCount(c.bookings);
    if (instances > 0) {
      totalOccupancySum += (bookings / instances) / c.maxCapacity;
      totalTemplates++;
    }
  }
  const occupancyRate = totalTemplates > 0 ? Math.round((totalOccupancySum / totalTemplates) * 100) : 0;

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

  // ── Tendencia diaria: promedio de ocupación por clase ese día ──
  const dailyTrend = daysInRange.map((day) => {
    const dow = getDayOfWeek(day);
    const dayClasses = classes.filter((c) => c.dayOfWeek === dow);
    const dayCapacity = dayClasses.reduce((sum, c) => sum + c.maxCapacity, 0);

    // Distribuimos los bookings acumulados del mes uniformemente entre las
    // ocurrencias de la clase en el período, para obtener un valor diario realista.
    let dayBookings = 0;
    let dayOccupancySum = 0;
    for (const c of dayClasses) {
      const instances = classInstances(c);
      const avgBookingsPerInstance = instances > 0 ? confirmedCount(c.bookings) / instances : 0;
      dayBookings += Math.round(avgBookingsPerInstance);
      dayOccupancySum += avgBookingsPerInstance / c.maxCapacity;
    }

    return {
      date: day.toISOString().split("T")[0],
      label: String(day.getDate()),
      bookings: dayBookings,
      capacity: dayCapacity,
      occupancy: dayClasses.length > 0 ? Math.round((dayOccupancySum / dayClasses.length) * 100) : 0,
    };
  });

  // ── Por disciplina ──
  const disciplineMap = new Map<string, { id: string; name: string; color: string | null; bookings: number; capacity: number; occupancySum: number; instances: number }>();
  for (const c of classes) {
    const d = c.discipline; if (!d) continue;
    const existing = disciplineMap.get(d.id) || { id: d.id, name: d.name, color: d.color, bookings: 0, capacity: 0, occupancySum: 0, instances: 0 };
    const dowCount = daysInRange.filter((day) => getDayOfWeek(day) === c.dayOfWeek).length;
    const confirmed = confirmedCount(c.bookings);
    existing.bookings += confirmed;
    existing.capacity += c.maxCapacity * dowCount;
    if (dowCount > 0) {
      existing.occupancySum += (confirmed / dowCount) / c.maxCapacity;
      existing.instances += 1; // contamos la clase-template, no cada ocurrencia
    }
    disciplineMap.set(d.id, existing);
  }
  const byDiscipline = Array.from(disciplineMap.values())
    .map((d) => ({ ...d, occupancy: d.instances > 0 ? Math.round((d.occupancySum / d.instances) * 100) : 0 }))
    .sort((a, b) => b.occupancy - a.occupancy);

  // ── Por coach ──
  const coachMap = new Map<string, { id: string; name: string; bookings: number; capacity: number; occupancySum: number; instances: number }>();
  for (const c of classes) {
    const coachId = c.coach?.id ?? "none";
    const coachName = c.coach?.name ?? "Sin profesor";
    const existing = coachMap.get(coachId) || { id: coachId, name: coachName, bookings: 0, capacity: 0, occupancySum: 0, instances: 0 };
    const dowCount = daysInRange.filter((day) => getDayOfWeek(day) === c.dayOfWeek).length;
    const confirmed = confirmedCount(c.bookings);
    existing.bookings += confirmed;
    existing.capacity += c.maxCapacity * dowCount;
    if (dowCount > 0) {
      existing.occupancySum += (confirmed / dowCount) / c.maxCapacity;
      existing.instances += 1;
    }
    coachMap.set(coachId, existing);
  }
  const byCoach = Array.from(coachMap.values())
    .map((c) => ({ ...c, occupancy: c.instances > 0 ? Math.round((c.occupancySum / c.instances) * 100) : 0 }))
    .sort((a, b) => b.occupancy - a.occupancy);

  // ── Por género ──
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

  // ── Por hora ──
  const hourMap = new Map<number, { hour: number; bookings: number; capacity: number; occupancySum: number; instances: number }>();
  for (const c of classes) {
    const h = parseHour(c.startTime);
    const existing = hourMap.get(h) || { hour: h, bookings: 0, capacity: 0, occupancySum: 0, instances: 0 };
    const dowCount = daysInRange.filter((day) => getDayOfWeek(day) === c.dayOfWeek).length;
    const confirmed = confirmedCount(c.bookings);
    existing.bookings += confirmed;
    existing.capacity += c.maxCapacity * dowCount;
    if (dowCount > 0) {
      existing.occupancySum += (confirmed / dowCount) / c.maxCapacity;
      existing.instances += 1;
    }
    hourMap.set(h, existing);
  }
  const byHour = Array.from(hourMap.values())
    .sort((a, b) => a.hour - b.hour)
    .map((h) => ({ ...h, label: `${String(h.hour).padStart(2, "0")}:00`,
      occupancy: h.instances > 0 ? Math.round((h.occupancySum / h.instances) * 100) : 0,
    }));

  // ── Por día de semana ──
  const dowMap = new Map<string, { day: string; bookings: number; capacity: number; occupancySum: number; instances: number }>();
  for (const c of classes) {
    const existing = dowMap.get(c.dayOfWeek) || { day: c.dayOfWeek, bookings: 0, capacity: 0, occupancySum: 0, instances: 0 };
    const dowCount = daysInRange.filter((day) => getDayOfWeek(day) === c.dayOfWeek).length;
    const confirmed = confirmedCount(c.bookings);
    existing.bookings += confirmed;
    existing.capacity += c.maxCapacity * dowCount;
    if (dowCount > 0) {
      existing.occupancySum += (confirmed / dowCount) / c.maxCapacity;
      existing.instances += 1;
    }
    dowMap.set(c.dayOfWeek, existing);
  }
  const byDayOfWeek = DAY_ORDER.filter((d) => dowMap.has(d))
    .map((d) => {
      const item = dowMap.get(d)!;
      return { day: d, label: DAY_LABELS[d], bookings: item.bookings, capacity: item.capacity,
        occupancy: item.instances > 0 ? Math.round((item.occupancySum / item.instances) * 100) : 0,
      };
    });

  // ── Top clases ──
  const classMap = new Map<string, { id: string; name: string; time: string; coach: string | null; bookings: number; capacity: number; occupancy: number }>();
  for (const c of classes) {
    const existing = classMap.get(c.id) || {
      id: c.id, name: c.discipline?.name || "Sin disciplina",
      time: c.startTime, coach: c.coach?.name || null, bookings: 0, capacity: 0, occupancy: 0,
    };
    const dowCount = daysInRange.filter((day) => getDayOfWeek(day) === c.dayOfWeek).length;
    const confirmed = confirmedCount(c.bookings);
    existing.bookings += confirmed;
    existing.capacity += c.maxCapacity * dowCount;
    if (dowCount > 0) {
      existing.occupancy = Math.round(((confirmed / dowCount) / c.maxCapacity) * 100);
    }
    classMap.set(c.id, existing);
  }
  const topClasses = Array.from(classMap.values())
    .sort((a, b) => b.occupancy - a.occupancy)
    .slice(0, 10);

  // ── Por hora × disciplina (heatmap) ──
  const hourDisciplineMap = new Map<string, { hour: number; label: string; disciplineId: string; disciplineName: string; color: string | null; bookings: number; capacity: number; occupancySum: number; instances: number }>();
  for (const c of classes) {
    const d = c.discipline;
    if (!d) continue;
    const h = parseHour(c.startTime);
    const key = `${h}|${d.id}`;
    const existing = hourDisciplineMap.get(key) || {
      hour: h, label: `${String(h).padStart(2, "0")}:00`,
      disciplineId: d.id, disciplineName: d.name, color: d.color,
      bookings: 0, capacity: 0, occupancySum: 0, instances: 0,
    };
    const instances = classInstances(c);
    const confirmed = confirmedCount(c.bookings);
    existing.bookings += confirmed;
    existing.capacity += c.maxCapacity * instances;
    if (instances > 0) {
      existing.occupancySum += (confirmed / instances) / c.maxCapacity;
      existing.instances += 1;
    }
    hourDisciplineMap.set(key, existing);
  }
  const byHourDiscipline = Array.from(hourDisciplineMap.values())
    .map((item) => ({ ...item, occupancy: item.instances > 0 ? Math.round((item.occupancySum / item.instances) * 100) : 0 }))
    .sort((a, b) => a.hour - b.hour || a.disciplineName.localeCompare(b.disciplineName));

  // ── Por día de semana × disciplina ──
  const dayDisciplineMap = new Map<string, { day: string; label: string; disciplineId: string; disciplineName: string; color: string | null; bookings: number; capacity: number; occupancySum: number; instances: number }>();
  for (const c of classes) {
    const d = c.discipline;
    if (!d) continue;
    const key = `${c.dayOfWeek}|${d.id}`;
    const existing = dayDisciplineMap.get(key) || {
      day: c.dayOfWeek, label: DAY_LABELS[c.dayOfWeek],
      disciplineId: d.id, disciplineName: d.name, color: d.color,
      bookings: 0, capacity: 0, occupancySum: 0, instances: 0,
    };
    const instances = classInstances(c);
    const confirmed = confirmedCount(c.bookings);
    existing.bookings += confirmed;
    existing.capacity += c.maxCapacity * instances;
    if (instances > 0) {
      existing.occupancySum += (confirmed / instances) / c.maxCapacity;
      existing.instances += 1;
    }
    dayDisciplineMap.set(key, existing);
  }
  const byDayDiscipline = Array.from(dayDisciplineMap.values())
    .map((item) => ({ ...item, occupancy: item.instances > 0 ? Math.round((item.occupancySum / item.instances) * 100) : 0 }))
    .sort((a, b) => DAY_ORDER.indexOf(a.day as typeof DAY_ORDER[number]) - DAY_ORDER.indexOf(b.day as typeof DAY_ORDER[number]) || a.disciplineName.localeCompare(b.disciplineName));

  // ── Por coach × horario ──
  const coachHourMap = new Map<string, { hour: number; label: string; coachId: string; coachName: string; bookings: number; capacity: number; occupancySum: number; instances: number }>();
  for (const c of classes) {
    const coachId = c.coach?.id ?? "none";
    const coachName = c.coach?.name ?? "Sin profesor";
    const h = parseHour(c.startTime);
    const key = `${h}|${coachId}`;
    const existing = coachHourMap.get(key) || {
      hour: h, label: `${String(h).padStart(2, "0")}:00`,
      coachId, coachName,
      bookings: 0, capacity: 0, occupancySum: 0, instances: 0,
    };
    const instances = classInstances(c);
    const confirmed = confirmedCount(c.bookings);
    existing.bookings += confirmed;
    existing.capacity += c.maxCapacity * instances;
    if (instances > 0) {
      existing.occupancySum += (confirmed / instances) / c.maxCapacity;
      existing.instances += 1;
    }
    coachHourMap.set(key, existing);
  }
  const byCoachHour = Array.from(coachHourMap.values())
    .map((item) => ({ ...item, occupancy: item.instances > 0 ? Math.round((item.occupancySum / item.instances) * 100) : 0 }))
    .sort((a, b) => a.hour - b.hour || a.coachName.localeCompare(b.coachName));

  // ── Cancelaciones por horario ──
  const hourCancelMap = new Map<number, { hour: number; label: string; total: number; cancelled: number }>();
  for (const c of classes) {
    const h = parseHour(c.startTime);
    const existing = hourCancelMap.get(h) || { hour: h, label: `${String(h).padStart(2, "0")}:00`, total: 0, cancelled: 0 };
    existing.total += c.bookings.length;
    existing.cancelled += c.bookings.filter((b) => b.status === "CANCELLED").length;
    hourCancelMap.set(h, existing);
  }
  const byHourCancellation = Array.from(hourCancelMap.values())
    .sort((a, b) => a.hour - b.hour)
    .map((h) => ({ ...h, rate: h.total > 0 ? Math.round((h.cancelled / h.total) * 100) : 0 }));

  // ── Por rango de edad ──
  const ageRangeBookings: Record<string, number> = {};
  const ageRangeStudents = new Map<string, Set<string>>();
  for (const c of classes) {
    for (const b of c.bookings) {
      if (b.status !== "CONFIRMED") continue;
      const birthDate = b.user?.birthDate;
      const age = birthDate ? getAge(birthDate) : null;
      const range = getAgeRange(age);
      ageRangeBookings[range] = (ageRangeBookings[range] || 0) + 1;
      if (!ageRangeStudents.has(range)) ageRangeStudents.set(range, new Set());
      ageRangeStudents.get(range)!.add(b.userId);
    }
  }

  // También traer distribución de TODOS los alumnos activos (incluyendo los que no reservaron)
  const allActiveStudents = await prisma.user.findMany({
    where: { gymId, role: "STUDENT", isActive: true },
    select: { birthDate: true },
  });
  const totalStudentsByRange: Record<string, number> = {};
  for (const s of allActiveStudents) {
    const age = s.birthDate ? getAge(s.birthDate) : null;
    const range = getAgeRange(age);
    totalStudentsByRange[range] = (totalStudentsByRange[range] || 0) + 1;
  }

  const byAgeRange = AGE_RANGE_ORDER
    .filter((range) => (ageRangeBookings[range] || 0) > 0 || (totalStudentsByRange[range] || 0) > 0)
    .map((range) => ({
      range,
      label: AGE_RANGE_LABELS[range],
      bookings: ageRangeBookings[range] || 0,
      students: totalStudentsByRange[range] || 0,
    }));

  return {
    kpis: { totalBookings, totalCapacity, occupancyRate, cancellationRate, activeStudents, atRiskStudents: atRiskCount, retentionRate },
    dailyTrend, byDiscipline, byCoach, byGender, byHour, byDayOfWeek, topClasses,
    byHourDiscipline, byDayDiscipline, byCoachHour, byHourCancellation, byAgeRange, periodLabel,
  };
}
