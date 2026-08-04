import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

type BookingStatusCounts = {
  CONFIRMED: number;
  CANCELLED: number;
  WAITLISTED: number;
};

const EMPTY_COUNTS: BookingStatusCounts = { CONFIRMED: 0, CANCELLED: 0, WAITLISTED: 0 };

function confirmedFromCounts(counts: BookingStatusCounts): number {
  return counts.CONFIRMED;
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
  // ── Templates de clases (sin reservas) ──
  const classes = await prisma.gymClass.findMany({
    where: { gymId, isActive: true, deletedAt: null },
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      maxCapacity: true,
      discipline: { select: { id: true, name: true, color: true } },
      coach: { select: { id: true, name: true } },
    },
  });

  // ── Closures y overrides dentro del rango ──
  const classIds = classes.map((c) => c.id);
  const [gymClosures, classOverrides] = await Promise.all([
    prisma.gymClosure.findMany({
      where: { gymId, date: { gte: start, lte: end } },
      select: { date: true },
    }),
    prisma.classOverride.findMany({
      where: { gymClassId: { in: classIds }, date: { gte: start, lte: end } },
      select: { gymClassId: true, date: true, isCancelled: true, maxCapacity: true },
    }),
  ]);

  const dateKey = (d: Date) => d.toISOString().split("T")[0];

  const closureDates = new Set(gymClosures.map((c) => dateKey(c.date)));
  const overrideMap = new Map<string, (typeof classOverrides)[number]>();
  for (const o of classOverrides) {
    overrideMap.set(`${o.gymClassId}-${dateKey(o.date)}`, o);
  }

  // ── Reservas agregadas por (classId, classDate, status) en una sola query ──
  // Esto reemplaza traer todos los bookings con include/user a memoria.
  const bookingRows = classIds.length > 0
    ? await prisma.$queryRaw<{ classId: string; classDate: Date; status: string; count: number }[]>`
        SELECT b."classId",
               b."classDate"::date AS "classDate",
               b.status::text      AS status,
               COUNT(*)::int       AS count
        FROM bookings b
        WHERE b."classId" IN (${Prisma.join(classIds)})
          AND b."classDate" >= ${start}
          AND b."classDate" <= ${end}
          AND b."deletedAt" IS NULL
        GROUP BY b."classId", b."classDate"::date, b.status
      `
    : [];

  const bookingCounts = new Map<string, Map<string, BookingStatusCounts>>();
  const bookingsByDate = new Map<string, number>();

  for (const row of bookingRows) {
    let byDate = bookingCounts.get(row.classId);
    if (!byDate) {
      byDate = new Map<string, BookingStatusCounts>();
      bookingCounts.set(row.classId, byDate);
    }

    const key = dateKey(row.classDate);
    let counts = byDate.get(key);
    if (!counts) {
      counts = { ...EMPTY_COUNTS };
      byDate.set(key, counts);
    }

    const status = row.status as keyof BookingStatusCounts;
    if (status in counts) {
      counts[status] = Number(row.count);
    }

    if (status === "CONFIRMED") {
      bookingsByDate.set(key, (bookingsByDate.get(key) || 0) + Number(row.count));
    }
  }

  function classCounts(classId: string): Map<string, BookingStatusCounts> {
    return bookingCounts.get(classId) ?? new Map<string, BookingStatusCounts>();
  }

  function classConfirmed(classId: string): number {
    let sum = 0;
    for (const counts of classCounts(classId).values()) sum += counts.CONFIRMED;
    return sum;
  }

  function classCancelled(classId: string): number {
    let sum = 0;
    for (const counts of classCounts(classId).values()) sum += counts.CANCELLED;
    return sum;
  }

  function classTotal(classId: string): number {
    let sum = 0;
    for (const counts of classCounts(classId).values()) {
      sum += counts.CONFIRMED + counts.CANCELLED + counts.WAITLISTED;
    }
    return sum;
  }

  const totalBookings = classes.reduce((sum, c) => sum + classConfirmed(c.id), 0);
  const totalCancelled = classes.reduce((sum, c) => sum + classCancelled(c.id), 0);

  const daysInRange = eachDay(start, end);

  // ── Capacidad total del período (respeta closures y overrides) ──
  let totalCapacity = 0;
  for (const day of daysInRange) {
    const dateStr = dateKey(day);
    if (closureDates.has(dateStr)) continue;

    const dow = getDayOfWeek(day);
    const dayClasses = classes.filter((c) => c.dayOfWeek === dow);
    for (const c of dayClasses) {
      const override = overrideMap.get(`${c.id}-${dateStr}`);
      if (override?.isCancelled) continue;
      totalCapacity += override?.maxCapacity ?? c.maxCapacity;
    }
  }

  // Helper: cuántas veces ocurre una clase en el período
  function classInstances(c: (typeof classes)[number]) {
    return daysInRange.filter((day) => getDayOfWeek(day) === c.dayOfWeek).length;
  }

  // ── Ocupación global del período ──
  // Se calcula como reservas confirmadas reales / capacidad total real del período.
  const occupancyRate = totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0;

  const totalAll = totalBookings + totalCancelled;
  const cancellationRate = totalAll > 0 ? Math.round((totalCancelled / totalAll) * 100) : 0;

  // ── Alumnos activos y datos demográficos agregados desde SQL ──
  // En lugar de traer todos los bookings con usuario incluido, obtenemos una
  // agregación por usuario (género, fecha de nacimiento, status y cantidad).
  const [activeStudentsRaw, atRiskCount, demoRows] = await Promise.all([
    prisma.user.findMany({
      where: { gymId, role: "STUDENT", isActive: true },
      select: { birthDate: true },
    }),
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
    classIds.length > 0
      ? prisma.$queryRaw<{ userId: string; gender: string | null; birthDate: Date | null; status: string; count: number }[]>`
          SELECT b."userId",
                 u.gender::text    AS gender,
                 u."birthDate"     AS "birthDate",
                 b.status::text    AS status,
                 COUNT(*)::int     AS count
          FROM bookings b
          JOIN users u ON u.id = b."userId"
          WHERE b."classId" IN (${Prisma.join(classIds)})
            AND b."classDate" >= ${start}
            AND b."classDate" <= ${end}
            AND b."deletedAt" IS NULL
          GROUP BY b."userId", u.gender, u."birthDate", b.status
        `
      : [],
  ]);

  const activeStudents = activeStudentsRaw.length;
  const retentionRate = activeStudents > 0 ? Math.round(((activeStudents - atRiskCount) / activeStudents) * 100) : 0;

  // ── Tendencia diaria: ocupación real por fecha ──
  // Agrupamos las reservas confirmadas por classDate y las comparamos contra
  // la capacidad real de ese día (templates + overrides - closures).
  const dailyTrend = daysInRange.map((day) => {
    const dateStr = dateKey(day);

    // Día de cierre del gym
    if (closureDates.has(dateStr)) {
      return {
        date: dateStr,
        label: String(day.getDate()),
        bookings: 0,
        capacity: 0,
        occupancy: 0,
      };
    }

    const dow = getDayOfWeek(day);
    const dayClasses = classes.filter((c) => c.dayOfWeek === dow);

    let dayCapacity = 0;
    for (const c of dayClasses) {
      const override = overrideMap.get(`${c.id}-${dateStr}`);
      if (override?.isCancelled) continue;
      dayCapacity += override?.maxCapacity ?? c.maxCapacity;
    }

    const dayBookings = bookingsByDate.get(dateStr) || 0;
    const occupancy = dayCapacity > 0 ? Math.round((dayBookings / dayCapacity) * 100) : 0;

    return {
      date: dateStr,
      label: String(day.getDate()),
      bookings: dayBookings,
      capacity: dayCapacity,
      occupancy,
    };
  });

  // ── Por disciplina ──
  const disciplineMap = new Map<string, { id: string; name: string; color: string | null; bookings: number; capacity: number; occupancySum: number; instances: number }>();
  for (const c of classes) {
    const d = c.discipline; if (!d) continue;
    const existing = disciplineMap.get(d.id) || { id: d.id, name: d.name, color: d.color, bookings: 0, capacity: 0, occupancySum: 0, instances: 0 };
    const dowCount = daysInRange.filter((day) => getDayOfWeek(day) === c.dayOfWeek).length;
    const confirmed = classConfirmed(c.id);
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
    const confirmed = classConfirmed(c.id);
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
  // Se calcula a partir de la agregación demográfica por usuario y status.
  const genderCounts: Record<string, number> = {};
  let genderTotal = 0;
  for (const row of demoRows) {
    if (row.status !== "CONFIRMED") continue;
    const g = row.gender ?? "UNKNOWN";
    genderCounts[g] = (genderCounts[g] || 0) + Number(row.count);
    genderTotal += Number(row.count);
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
    const confirmed = classConfirmed(c.id);
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
    const confirmed = classConfirmed(c.id);
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
    const confirmed = classConfirmed(c.id);
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
    const confirmed = classConfirmed(c.id);
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
    const confirmed = classConfirmed(c.id);
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
    const confirmed = classConfirmed(c.id);
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
    existing.total += classTotal(c.id);
    existing.cancelled += classCancelled(c.id);
    hourCancelMap.set(h, existing);
  }
  const byHourCancellation = Array.from(hourCancelMap.values())
    .sort((a, b) => a.hour - b.hour)
    .map((h) => ({ ...h, rate: h.total > 0 ? Math.round((h.cancelled / h.total) * 100) : 0 }));

  // ── Por rango de edad ──
  // Usamos la agregación demográfica: por cada usuario sabemos su fecha de
  // nacimiento y cuántas reservas confirmadas hizo en el período.
  const ageRangeBookings: Record<string, number> = {};
  const ageRangeStudents = new Map<string, Set<string>>();
  for (const row of demoRows) {
    if (row.status !== "CONFIRMED") continue;
    const age = row.birthDate ? getAge(row.birthDate) : null;
    const range = getAgeRange(age);
    ageRangeBookings[range] = (ageRangeBookings[range] || 0) + Number(row.count);
    if (!ageRangeStudents.has(range)) ageRangeStudents.set(range, new Set());
    ageRangeStudents.get(range)!.add(row.userId);
  }

  // También traer distribución de TODOS los alumnos activos (incluyendo los que no reservaron)
  const totalStudentsByRange: Record<string, number> = {};
  for (const s of activeStudentsRaw) {
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
      students: ageRangeStudents.get(range)?.size ?? 0,
    }));

  return {
    kpis: { totalBookings, totalCapacity, occupancyRate, cancellationRate, activeStudents, atRiskStudents: atRiskCount, retentionRate },
    dailyTrend, byDiscipline, byCoach, byGender, byHour, byDayOfWeek, topClasses,
    byHourDiscipline, byDayDiscipline, byCoachHour, byHourCancellation, byAgeRange, periodLabel,
  };
}
