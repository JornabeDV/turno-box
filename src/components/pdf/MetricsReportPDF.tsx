import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { MetricsReport } from "@/lib/queries/metrics";

const COLORS = {
  bg: "#0B1A23",
  card: "#0F2532",
  border: "#1A4A63",
  textPrimary: "#F0F2F5",
  textSecondary: "#8BA3B0",
  textMuted: "#4A6B7A",
  brand: "#F78837",
  teal: "#27C7B8",
  danger: "#E61919",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    padding: 32,
    fontFamily: "Helvetica",
  },
  header: {
    borderBottom: `2px solid ${COLORS.brand}`,
    paddingBottom: 16,
    marginBottom: 28,
  },
  gymName: {
    fontSize: 22,
    color: COLORS.white,
    fontWeight: "bold",
    marginBottom: 4,
  },
  period: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sectionTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 26,
    fontWeight: "bold",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  kpiCard: {
    width: "31.8%",
    backgroundColor: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: 14,
    marginBottom: 10,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  table: {
    backgroundColor: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: `1px solid ${COLORS.border}`,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  tableRowLast: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  barRowLeft: {
    flex: 1,
    paddingRight: 12,
  },
  barName: {
    fontSize: 10,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  barContainer: {
    height: 5,
    backgroundColor: COLORS.bg,
    borderRadius: 3,
    width: "100%",
  },
  barFill: {
    height: 5,
    backgroundColor: COLORS.brand,
    borderRadius: 3,
  },
  tableCellRight: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.brand,
    textAlign: "right",
    width: 50,
  },
  tableCell: {
    fontSize: 10,
    color: COLORS.textPrimary,
    flex: 1,
  },
  footer: {
    marginTop: 36,
    borderTop: `1px solid ${COLORS.border}`,
    paddingTop: 14,
  },
  footerText: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: "center",
  },
});

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function TableRow({ name, value, isLast }: { name: string; value: string; isLast?: boolean }) {
  return (
    <View style={isLast ? styles.tableRowLast : styles.tableRow}>
      <Text style={styles.tableCell}>{name}</Text>
      <Text style={styles.tableCellRight}>{value}</Text>
    </View>
  );
}

function BarRow({ name, value, max }: { name: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={styles.tableRow}>
      <View style={styles.barRowLeft}>
        <Text style={styles.barName}>{name}</Text>
        <View style={styles.barContainer}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
      </View>
      <Text style={styles.tableCellRight}>{value}%</Text>
    </View>
  );
}

export function MetricsReportPDF({ gymName, report }: { gymName: string; report: MetricsReport }) {
  const { kpis, byDiscipline, byCoach, byDayOfWeek, topClasses, byGender } = report;

  const occupancyColor = kpis.occupancyRate > 80 ? COLORS.teal : kpis.occupancyRate > 50 ? COLORS.brand : COLORS.danger;
  const cancellationColor = kpis.cancellationRate > 15 ? COLORS.danger : COLORS.teal;
  const retentionColor = kpis.retentionRate > 70 ? COLORS.teal : COLORS.brand;
  const riskColor = kpis.atRiskStudents > 10 ? COLORS.danger : COLORS.textSecondary;

  const maxDiscipline = Math.max(1, ...byDiscipline.map((d) => d.occupancy));
  const maxCoach = Math.max(1, ...byCoach.map((c) => c.occupancy));

  const sortedDays = [...byDayOfWeek].sort((a, b) => b.occupancy - a.occupancy);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.gymName}>{gymName}</Text>
          <Text style={styles.period}>Reporte {report.periodLabel}</Text>
        </View>

        {/* KPIs */}
        <Text style={styles.sectionTitle}>Indicadores principales</Text>
        <View style={styles.kpiGrid}>
          <KpiCard label="Reservas" value={String(kpis.totalBookings)} color={COLORS.textPrimary} />
          <KpiCard label="Ocupacion" value={`${kpis.occupancyRate}%`} color={occupancyColor} />
          <KpiCard label="Cancelacion" value={`${kpis.cancellationRate}%`} color={cancellationColor} />
          <KpiCard label="Alumnos activos" value={String(kpis.activeStudents)} color={COLORS.textPrimary} />
          <KpiCard label="Retencion" value={`${kpis.retentionRate}%`} color={retentionColor} />
          <KpiCard label="En riesgo" value={String(kpis.atRiskStudents)} color={riskColor} />
        </View>

        {/* Disciplinas */}
        {byDiscipline.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Disciplinas por ocupacion</Text>
            <View style={styles.table}>
              {byDiscipline.slice(0, 5).map((d) => (
                <BarRow key={d.id} name={d.name} value={d.occupancy} max={maxDiscipline} />
              ))}
            </View>
          </>
        )}

        {/* Coaches */}
        {byCoach.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Coaches por ocupacion</Text>
            <View style={styles.table}>
              {byCoach.slice(0, 5).map((c) => (
                <BarRow key={c.id} name={c.name} value={c.occupancy} max={maxCoach} />
              ))}
            </View>
          </>
        )}

        {/* Dias */}
        {sortedDays.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Dias de la semana</Text>
            <View style={styles.table}>
              {sortedDays.slice(0, 7).map((d, i, arr) => (
                <TableRow key={d.day} name={d.label} value={`${d.occupancy}%`} isLast={i === arr.length - 1} />
              ))}
            </View>
          </>
        )}

        {/* Top clases */}
        {topClasses.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Clases mas concurridas</Text>
            <View style={styles.table}>
              {topClasses.slice(0, 5).map((c, i, arr) => (
                <TableRow
                  key={c.id}
                  name={`${c.name} ${c.time}hs${c.coach ? ` — ${c.coach}` : ""}`}
                  value={`${c.occupancy}%`}
                  isLast={i === arr.length - 1}
                />
              ))}
            </View>
          </>
        )}

        {/* Genero */}
        {byGender.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Participacion por genero</Text>
            <View style={styles.table}>
              {byGender.map((g, i, arr) => (
                <TableRow key={g.gender} name={g.label} value={`${g.bookings} (${g.percentage}%)`} isLast={i === arr.length - 1} />
              ))}
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generado automaticamente por Box Turno — Para mas detalle ingresa al panel de administracion
          </Text>
        </View>
      </Page>
    </Document>
  );
}
