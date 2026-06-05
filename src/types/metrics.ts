export type MetricsResult = {
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
};
