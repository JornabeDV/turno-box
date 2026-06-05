"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { getMetricsAction } from "@/actions/metrics";
import type { MetricsResult } from "@/types/metrics";
import { AreaChartPremium } from "./metrics/AreaChartPremium";
import { BarChartPremium } from "./metrics/BarChartPremium";
import { PieChartPremium } from "./metrics/PieChartPremium";
import { DatePicker } from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";
import {
  CalendarBlank,
  Users,
  ChartBar,
  XCircle,
  TrendUp,
  TrendDown,
  Minus,
} from "@phosphor-icons/react";

// ── Types ────────────────────────────────────────────────────────────────────

type MetricsData = MetricsResult;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateInput(d: Date): string {
  return d.toISOString().split("T")[0];
}

function subDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - days);
  return r;
}

const PRESETS = [
  { label: "7 días", days: 7 },
  { label: "14 días", days: 14 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
];

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  accent = "orange",
  delay = 0,
}: {
  label: string;
  value: string | number;
  change?: number | null;
  changeLabel?: string;
  icon: React.ElementType;
  accent?: "orange" | "teal" | "rose" | "zinc";
  delay?: number;
}) {
  const accentColor = {
    orange: "text-[#F78837]",
    teal: "text-[#27C7B8]",
    rose: "text-[#E61919]",
    zinc: "text-[#EAEAEA]",
  }[accent];

  const accentBg = {
    orange: "bg-[#F78837]/10",
    teal: "bg-[#27C7B8]/10",
    rose: "bg-[#E61919]/10",
    zinc: "bg-[#0E2A38]",
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.32, 0.72, 0, 1] }}
      className="bg-[#0E2A38] border border-[#1A4A63] p-4 md:p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("size-9 rounded-[2px] flex items-center justify-center", accentBg, accentColor)}>
          <Icon size={18} weight="regular" />
        </div>
        {change !== undefined && change !== null && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-bold tabular-nums",
              change > 0 ? "text-[#27C7B8]" : change < 0 ? "text-[#E61919]" : "text-[#6B8A99]"
            )}
          >
            {change > 0 ? <TrendUp size={12} /> : change < 0 ? <TrendDown size={12} /> : <Minus size={12} />}
            {change > 0 ? "+" : ""}
            {change}%
          </div>
        )}
      </div>
      <p className={cn("text-2xl md:text-3xl font-bold tabular-nums leading-none", accentColor)}>{value}</p>
      <p className="text-xs md:text-sm text-[#6B8A99] mt-1.5 uppercase tracking-wider">{label}</p>
      {changeLabel && <p className="text-[10px] text-[#4A6B7A] mt-0.5">{changeLabel}</p>}
    </motion.div>
  );
}

// ── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  children,
  delay = 0,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.32, 0.72, 0, 1] }}
      className={cn("bg-[#0E2A38] border border-[#1A4A63]", className)}
    >
      <div className="px-4 md:px-5 pt-4 md:pt-5 pb-1">
        <h3 className="text-xs md:text-sm font-semibold text-[#6B8A99] uppercase tracking-wider">{title}</h3>
        {subtitle && <p className="text-[10px] md:text-xs text-[#4A6B7A] mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4 md:p-5 pt-3">{children}</div>
    </motion.div>
  );
}

// ── Skeletons ────────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="bg-[#0E2A38] border border-[#1A4A63] p-4 md:p-5 animate-pulse">
      <div className="size-9 rounded-[2px] bg-[#1A4A63]/40 mb-3" />
      <div className="h-7 md:h-8 bg-[#1A4A63]/40 rounded w-16 mb-2" />
      <div className="h-4 bg-[#1A4A63]/40 rounded w-24" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-[#0E2A38] border border-[#1A4A63] p-4 md:p-5 animate-pulse">
      <div className="h-4 bg-[#1A4A63]/40 rounded w-32 mb-4" />
      <div className="h-48 bg-[#1A4A63]/20 rounded" />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function MetricsClient({ initialData, initialStart, initialEnd }: {
  initialData: MetricsData;
  initialStart: string;
  initialEnd: string;
}) {
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [data, setData] = useState<MetricsData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [activePreset, setActivePreset] = useState<number | null>(30);

  const fetchData = useCallback(() => {
    startTransition(async () => {
      const res = await getMetricsAction({ startDate, endDate });
      if (res.success) setData(res.data);
    });
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = subDays(end, days - 1);
    setEndDate(formatDateInput(end));
    setStartDate(formatDateInput(start));
    setActivePreset(days);
  };

  const dailyTrendData = data.dailyTrend.map((d) => ({ label: d.label, value: d.occupancy }));

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header + Filtros */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs md:text-sm text-[#6B8A99] uppercase tracking-wider mb-0.5">
              Análisis de datos
            </p>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#EAEAEA] tracking-tight">
              Métricas
            </h2>
          </div>

          {/* Filtros de fecha */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="grid grid-cols-4 sm:flex sm:items-center sm:gap-0.5 bg-[#0E2A38] border border-[#1A4A63] px-0.5 py-0.5 w-full sm:w-auto">
              {PRESETS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => applyPreset(p.days)}
                  className={cn(
                    "w-full sm:w-auto px-1 sm:px-2 py-3 text-xs font-medium uppercase tracking-wider rounded-[2px] transition-all duration-150 whitespace-nowrap",
                    activePreset === p.days
                      ? "bg-[#F78837] text-[#0A1F2A]"
                      : "text-[#6B8A99] hover:text-[#EAEAEA] hover:bg-[#0A1F2A]"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <DatePicker
                value={startDate}
                onChange={(v) => {
                  setStartDate(v);
                  setActivePreset(null);
                }}
                allowFuture
                showYearPicker={false}
                className="w-full sm:w-48"
              />
              <span className="hidden sm:inline text-xs text-[#4A6B7A]">a</span>
              <DatePicker
                value={endDate}
                onChange={(v) => {
                  setEndDate(v);
                  setActivePreset(null);
                }}
                allowFuture
                showYearPicker={false}
                className="w-full sm:w-48"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      {isPending ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <KpiCard
            label="Reservas"
            value={data.kpis.totalBookings}
            icon={CalendarBlank}
            accent="orange"
            delay={0}
          />
          <KpiCard
            label="Ocupación"
            value={`${data.kpis.occupancyRate}%`}
            icon={ChartBar}
            accent={data.kpis.occupancyRate > 80 ? "teal" : "orange"}
            delay={0.05}
          />
          <KpiCard
            label="Cancelación"
            value={`${data.kpis.cancellationRate}%`}
            icon={XCircle}
            accent={data.kpis.cancellationRate > 15 ? "rose" : "zinc"}
            delay={0.1}
          />
          <KpiCard
            label="Alumnos activos"
            value={data.kpis.activeStudents}
            icon={Users}
            accent="teal"
            delay={0.15}
          />
          <KpiCard
            label="Retención"
            value={`${data.kpis.retentionRate}%`}
            icon={TrendUp}
            accent={data.kpis.retentionRate > 70 ? "teal" : "orange"}
            delay={0.2}
          />
          <KpiCard
            label="En riesgo"
            value={data.kpis.atRiskStudents}
            icon={TrendDown}
            accent={data.kpis.atRiskStudents > 10 ? "rose" : "zinc"}
            delay={0.25}
          />
        </div>
      )}

      {/* Fila 1: Tendencia + Género */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {isPending ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <SectionCard title="Tendencia de ocupación" subtitle="Porcentaje de ocupación diaria" className="lg:col-span-2" delay={0.1}>
              {dailyTrendData.length > 0 ? (
                <AreaChartPremium data={dailyTrendData} color="#F78837" />
              ) : (
                <EmptyState message="No hay datos para el período seleccionado" />
              )}
            </SectionCard>

            <SectionCard title="Participación por género" subtitle="Distribución de reservas confirmadas" delay={0.15}>
              {data.byGender.length > 0 ? (
                <PieChartPremium
                  data={data.byGender.map((g, i) => ({
                    label: g.label,
                    value: g.bookings,
                    color: ["#F78837", "#27C7B8", "#E61919", "#4A6B7A", "#1A4A63"][i % 5],
                  }))}
                  size={200}
                />
              ) : (
                <EmptyState message="No hay datos de género registrados" />
              )}
            </SectionCard>
          </>
        )}
      </div>

      {/* Fila 2: Disciplinas + Coaches + Días */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {isPending ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <SectionCard title="Por disciplina" subtitle="Ocupación promedio" delay={0.2}>
              {data.byDiscipline.length > 0 ? (
                <BarChartPremium
                  layout="vertical"
                  color="#F78837"
                  height={260}
                  data={data.byDiscipline.map((d) => ({
                    label: d.name,
                    value: d.occupancy,
                    color: d.color || undefined,
                  }))}
                />
              ) : (
                <EmptyState message="Sin disciplinas con datos" />
              )}
            </SectionCard>

            <SectionCard title="Por profesor" subtitle="Ocupación promedio" delay={0.25}>
              {data.byCoach.length > 0 ? (
                <BarChartPremium
                  layout="vertical"
                  color="#27C7B8"
                  height={260}
                  data={data.byCoach.map((c) => ({
                    label: c.name,
                    value: c.occupancy,
                  }))}
                />
              ) : (
                <EmptyState message="Sin profesores con datos" />
              )}
            </SectionCard>

            <SectionCard title="Días de la semana" subtitle="Ocupación promedio por día" delay={0.3}>
              {data.byDayOfWeek.length > 0 ? (
                <BarChartPremium
                  layout="horizontal"
                  color="#F78837"
                  height={220}
                  data={data.byDayOfWeek.map((d) => ({ label: d.label, value: d.occupancy }))}
                />
              ) : (
                <EmptyState message="Sin datos por día" />
              )}
            </SectionCard>
          </>
        )}
      </div>

      {/* Fila 3: Horarios pico + Top clases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {isPending ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <SectionCard title="Horarios pico" subtitle="Ocupación por franja horaria" delay={0.35}>
              {data.byHour.length > 0 ? (
                <BarChartPremium
                  layout="horizontal"
                  color="#27C7B8"
                  height={240}
                  data={data.byHour.map((h) => ({ label: h.label, value: h.occupancy }))}
                />
              ) : (
                <EmptyState message="Sin datos por horario" />
              )}
            </SectionCard>

            <SectionCard title="Clases más concurridas" subtitle="Top 10 por ocupación" delay={0.4}>
              {data.topClasses.length > 0 ? (
                <div className="space-y-3">
                  {data.topClasses.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 p-3 bg-[#0A1F2A] border border-[#1A4A63]/60 hover:border-[#1A4A63] transition-colors"
                    >
                      <span className="text-xs font-bold text-[#4A6B7A] w-5 text-center tabular-nums">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#EAEAEA] truncate">
                          {c.name}
                        </p>
                        <p className="text-[10px] text-[#4A6B7A] mt-0.5">
                          {c.time} {c.coach ? `· ${c.coach}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-[#EAEAEA] tabular-nums">{c.occupancy}%</p>
                        <p className="text-[10px] text-[#4A6B7A]">
                          {c.bookings}/{c.capacity}
                        </p>
                      </div>
                      <div className="w-20 h-1.5 bg-[#0E2A38] rounded-[1px] overflow-hidden shrink-0 hidden sm:block">
                        <div
                          className="h-full bg-[#F78837] rounded-[1px]"
                          style={{ width: `${Math.min(100, c.occupancy)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="Sin clases con datos" />
              )}
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ChartBar size={32} className="text-[#1A4A63] mb-3" />
      <p className="text-sm text-[#6B8A99]">{message}</p>
    </div>
  );
}
