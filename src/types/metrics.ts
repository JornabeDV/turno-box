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
  byHourDiscipline: { hour: number; label: string; disciplineId: string; disciplineName: string; color: string | null; bookings: number; capacity: number; occupancy: number }[];
  byDayDiscipline: { day: string; label: string; disciplineId: string; disciplineName: string; color: string | null; bookings: number; capacity: number; occupancy: number }[];
  byCoachHour: { hour: number; label: string; coachId: string; coachName: string; bookings: number; capacity: number; occupancy: number }[];
  byHourCancellation: { hour: number; label: string; total: number; cancelled: number; rate: number }[];
  byAgeRange: { range: string; label: string; bookings: number; students: number }[];
};
