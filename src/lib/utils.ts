import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatea "07:00" → "7:00 AM" / "08:30" → "8:30 AM"
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

// Formatea fecha a "Lun 7 Abr"
// Las fechas de clase se almacenan como UTC medianoche; forzamos UTC para
// evitar que la conversión a zona horaria local cambie el día visible.
export function formatDate(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

// Devuelve el día de la semana en formato DayOfWeek
const dayMap: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

export function getDayOfWeek(date: Date): string {
  return dayMap[date.getDay()];
}

// Normaliza una fecha a medianoche UTC (para usar como classDate en Booking)
export function toClassDate(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

const GYM_TIMEZONE = "America/Argentina/Buenos_Aires";

// Devuelve la fecha de "hoy" según la timezone del gimnasio,
// evitando desfasajes cuando el servidor corre en UTC y el usuario en ARG.
export function getTodayInGymTimezone(): Date {
  const todayStr = new Date().toLocaleDateString("sv-SE", {
    timeZone: GYM_TIMEZONE,
  });
  const [y, m, d] = todayStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Cupos → variante de badge
export function spotsVariant(
  available: number,
  max: number
): "available" | "few" | "full" {
  if (available === 0) return "full";
  if (available <= Math.ceil(max * 0.25)) return "few";
  return "available";
}
