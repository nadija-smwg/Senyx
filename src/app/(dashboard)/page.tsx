"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { KPICard } from '@/components/charts/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';

const BarChartWidget = dynamic(() => import('@/components/charts/bar-chart-widget').then(m => m.BarChartWidget), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-xl" /> });
const PieChartWidget = dynamic(() => import('@/components/charts/pie-chart-widget').then(m => m.PieChartWidget), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-xl" /> });
const AreaChartWidget = dynamic(() => import('@/components/charts/area-chart-widget').then(m => m.AreaChartWidget), { ssr: false, loading: () => <Skeleton className="h-[340px] w-full rounded-xl" /> });

import {
  Briefcase, CheckCircle, Users, DollarSign, FileText, AlertTriangle,
  TrendingUp, TrendingDown, Target, Activity, FolderKanban, Receipt,
  ArrowRight, Plus, ArrowUpRight, Wallet, PiggyBank, Building2,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/providers/currency-provider';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Design tokens — shared across the dashboard                       */
/* ------------------------------------------------------------------ */

const SECTION_GAP = 'space-y-6';
const GRID_GAP = 'gap-5';
const CARD_PADDING = 'p-5';
const TITLE_SIZE = 'text-[11px]';

/* ------------------------------------------------------------------ */
/*  Small helpers                                                       */
/* ------------------------------------------------------------------ */

function SectionTitle({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className={cn("text-gray-500 font-bold uppercase tracking-[0.16em]", TITLE_SIZE)}>
        {label}
      </h2>
      {action}
    </div>
  );
}

function fmtNum(v: number) {
  return (v || 0).toLocaleString();
}

function relativeTime(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function initials(name?: string) {
  if (!name) return '??';
  const parts = name.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/);
  return (parts[0]?.[0] || '?') + (parts[1]?.[0] || '');
}

/* ------------------------------------------------------------------ */
/*  Hero KPI – used for the primary metric in each section             */
/* ------------------------------------------------------------------ */

interface HeroKPIProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: React.ReactNode;
  accent?: 'positive' | 'negative' | 'warning' | 'neutral';
  sparklineData?: number[];
  meta?: React.ReactNode;
}

const accentMap = {
  positive: { bg: 'from-emerald-500/10 via-emerald-500/5 to-transparent', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', ring: 'ring-emerald-100', bar: 'bg-emerald-500', rail: '#059669' },
  negative: { bg: 'from-rose-500/10 via-rose-500/5 to-transparent', iconBg: 'bg-rose-50', iconColor: 'text-rose-600', ring: 'ring-rose-100', bar: 'bg-rose-500', rail: '#C1172C' },
  warning: { bg: 'from-amber-500/10 via-amber-500/5 to-transparent', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', ring: 'ring-amber-100', bar: 'bg-amber-500', rail: '#F15A22' },
  neutral: { bg: 'from-sky-500/10 via-sky-500/5 to-transparent', iconBg: 'bg-sky-50', iconColor: 'text-sky-600', ring: 'ring-sky-100', bar: 'bg-sky-500', rail: '#1A6DB6' },
};

function HeroKPI({ title, value, subtitle, icon, accent = 'neutral', sparklineData, meta }: HeroKPIProps) {
  const a = accentMap[accent];
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl bg-white border border-gray-100 h-full flex flex-col",
      "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
      "hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-200 group"
    )}>
      {/* Subtle accent rail */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[2px] z-10" style={{ backgroundColor: a.rail, opacity: 0.85 }} />
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70", a.bg)} />
      <div className={cn("relative flex flex-col h-full", CARD_PADDING)}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <p className={cn("font-bold uppercase tracking-[0.14em] text-gray-400 truncate", TITLE_SIZE)}>{title}</p>
          </div>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px]", a.iconBg, a.iconColor)}>
            {icon}
          </div>
        </div>

        <div className="text-[28px] leading-tight font-bold font-heading text-gray-900 tabular-nums truncate">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1.5 text-xs text-gray-500 truncate">{subtitle}</p>
        )}

        {(meta || sparklineData) && (
          <div className="mt-auto pt-4 border-t border-gray-100/80 flex items-end justify-between gap-3 min-h-[28px]">
            <div className="min-w-0 flex-1">
              {meta}
            </div>
            {sparklineData && sparklineData.length > 0 && (
              <HeroSparkline data={sparklineData} color={a.bar.replace('bg-', '')} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* Lightweight inline sparkline so we don't have to import recharts here. */
function HeroSparkline({ data, color }: { data: number[]; color: string }) {
  const w = 120, h = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v: number, i: number) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = data[data.length - 1] ?? 0;
  const prev = data[0] ?? 0;
  const trendingUp = last >= prev;
  const stroke = trendingUp ? '#059669' : '#C1172C';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible shrink-0">
      <defs>
        <linearGradient id={`hs-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`url(#hs-${color})`} />
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

type DashboardData = Record<string, unknown>;
interface AuditLog {
  id: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  result?: string;
  createdAt?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { format: formatCurrency } = useCurrency();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const username = user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics/dashboard').then(r => r.json()).catch(() => ({ data: null })),
      fetch('/api/audit-logs?limit=6').then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([d, a]) => {
      setData(d?.data || null);
      setActivity(Array.isArray(a?.data) ? (a.data as AuditLog[]) : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={cn("mx-auto w-full max-w-[1440px] animate-in fade-in duration-500", SECTION_GAP)}>
        <Skeleton className="h-[96px] w-full rounded-xl" />
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12", GRID_GAP)}>
          <Skeleton className="h-[148px] rounded-xl md:col-span-2 lg:col-span-4" />
          <Skeleton className="h-[148px] rounded-xl lg:col-span-2" />
          <Skeleton className="h-[148px] rounded-xl lg:col-span-2" />
          <Skeleton className="h-[148px] rounded-xl lg:col-span-2" />
          <Skeleton className="h-[148px] rounded-xl lg:col-span-2" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  if (!data) return <div className="text-gray-400 text-sm text-center py-20">Failed to load dashboard</div>;

  /* Dashboard payload is a flexible bag of optional fields – typed loosely on purpose. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = data;

  /* Build revenue vs expense trend (only from existing fields) */
  let trend: { month: string; revenue: number; expenses: number }[] = [];
  const rev = (d.revenueTrend || []) as Array<{ month: string; revenue: number | string }>;
  const exp = (d.expenseTrend || []) as Array<{ month: string; expenses: number | string }>;
  if (rev.length || exp.length) {
    const months = Array.from(new Set([...rev.map(r => r.month), ...exp.map(e => e.month)])).sort() as string[];
    trend = months.map(m => ({
      month: m,
      revenue: Number(rev.find(x => x.month === m)?.revenue || 0),
      expenses: Number(exp.find(x => x.month === m)?.expenses || 0),
    }));
  }

  /* Derive simple month-over-month trend from the trend series (only if data exists) */
  let profitMoMPct: number | undefined;
  if (trend.length >= 2) {
    const last = trend[trend.length - 1]!;
    const prev = trend[trend.length - 2]!;
    const lastProfit = Number(last.revenue) - Number(last.expenses);
    const prevProfit = Number(prev.revenue) - Number(prev.expenses);
    if (prevProfit !== 0) profitMoMPct = Math.round(((lastProfit - prevProfit) / Math.abs(prevProfit)) * 100);
  }
  let revenueMoMPct: number | undefined;
  if (trend.length >= 2) {
    const last = Number(trend[trend.length - 1]!.revenue);
    const prev = Number(trend[trend.length - 2]!.revenue);
    if (prev !== 0) revenueMoMPct = Math.round(((last - prev) / Math.abs(prev)) * 100);
  }

  const hasFinancial = d.totalRevenue !== undefined;
  const hasSales = d.pipelineValue !== undefined || d.winRate !== undefined || d.weightedPipelineValue !== undefined;
  const hasOps = d.activeProjects !== undefined || d.headcount !== undefined;

  const financeEmpty = d.totalRevenue === 0 && d.totalExpenses === 0;

  /* Inline month labels for sparklines, generated only from existing series */
  const buildSpark = (key: 'revenue' | 'expenses', fallback: number[]) =>
    trend.length > 0 ? trend.slice(-7).map(r => Number(r[key]) || 0) : fallback;

  return (
    <div className={cn("mx-auto w-full max-w-[1440px] animate-in fade-in duration-500", SECTION_GAP)}>

      {/* ============================================================ */}
      {/* HEADER / WELCOME                                              */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="absolute top-[-30%] right-[-10%] w-[55%] h-[180%] rounded-[100%] bg-gradient-to-br from-[#22BFE8]/12 via-[#7F4D9F]/8 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60%] left-[-10%] w-[40%] h-[180%] rounded-[100%] bg-gradient-to-tr from-[#F9A01B]/10 via-[#EC4C49]/8 to-transparent blur-3xl pointer-events-none" />
        <div className="relative px-6 py-5 md:px-7 md:py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase bg-gradient-to-r from-[#1A6DB6] via-[#7F4D9F] to-[#F15A22] bg-clip-text text-transparent">
              {greeting}
            </p>
            <h1 className="mt-1.5 text-2xl font-extrabold font-heading text-gray-900 tracking-tight truncate">
              {username}
            </h1>
            <p className="text-sm text-gray-500 mt-1.5 max-w-2xl leading-relaxed">
              Here's what's happening across your organization today. Monitor performance, track finances, and manage your team from the command center.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link href="/finance/invoices">
              <Button size="sm" className="gap-2 shadow-sm shadow-[#1A6DB6]/20 bg-gradient-to-r from-[#1A6DB6] to-[#22BFE8] hover:from-[#155a96] hover:to-[#1ca2c5] border-0 text-white font-semibold transition-all">
                <Plus className="w-4 h-4" />New Invoice
              </Button>
            </Link>
            <Link href="/sales/deals">
              <Button size="sm" variant="outline" className="gap-2 border-gray-200 hover:border-[#7F4D9F]/50 hover:bg-[#7F4D9F]/5 hover:text-[#7F4D9F] transition-all bg-white">
                <Target className="w-4 h-4" />Pipeline
              </Button>
            </Link>
            <Link href="/crm/contacts">
              <Button size="sm" variant="outline" className="gap-2 border-gray-200 hover:border-[#22BFE8]/50 hover:bg-[#22BFE8]/5 hover:text-[#22BFE8] transition-all bg-white">
                <Users className="w-4 h-4" />Contacts
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FINANCIAL OVERVIEW                                            */}
      {/* ============================================================ */}
      {hasFinancial && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '100ms' }}>
          <SectionTitle
            label="Financial Overview"
            action={
              <Link href="/finance" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 transition-colors">
                View finance <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />

          {financeEmpty ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center flex flex-col items-center">
              <Receipt className="w-10 h-10 text-gray-300 mb-3" />
              <h3 className="font-semibold text-gray-700 mb-1">No financial data yet</h3>
              <p className="text-gray-400 text-sm mb-5">Create your first invoice to start tracking performance.</p>
              <Link href="/finance/invoices"><Button>Create Invoice</Button></Link>
            </div>
          ) : (
            <div className={cn(
              // 12-col grid gives hero 4 cols + four 2-col tiles => perfectly balanced 1440px width
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12",
              GRID_GAP
            )}>
              {/* Hero: Net Profit (spans 4 cols on lg) */}
              {d.netProfit !== undefined && (
                <div className="lg:col-span-4">
                  <HeroKPI
                    title="Net Profit"
                    value={<CurrencyDisplay amount={d.netProfit} />}
                    subtitle={`Revenue ${formatCurrency(d.totalRevenue)} · Spend ${formatCurrency(d.totalExpenses)}`}
                    icon={<TrendingUp />}
                    accent={d.netProfit >= 0 ? 'positive' : 'negative'}
                    sparklineData={buildSpark('revenue', [40, 60, 40, 55, 75, 55, 75]).map((v, i, arr) => arr.slice(0, i + 1).reduce((s, x) => s + x, 0))}
                    meta={
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className={cn(
                          "inline-flex items-center gap-0.5 font-semibold",
                          (profitMoMPct ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {(profitMoMPct ?? 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {profitMoMPct !== undefined ? `${Math.abs(profitMoMPct)}%` : '—'}
                        </span>
                        <span className="text-gray-400">vs. last month</span>
                      </div>
                    }
                  />
                </div>
              )}

              {d.totalRevenue !== undefined && (
                <div className="lg:col-span-2">
                  <KPICard
                    title="Revenue"
                    value={<CurrencyDisplay amount={d.totalRevenue} className="!text-[22px]" />}
                    icon={<Wallet />}
                    status="positive"
                    sparklineData={buildSpark('revenue', [120, 135, 125, 145, 160, 150, 175])}
                    subtitle={revenueMoMPct !== undefined ? `${revenueMoMPct >= 0 ? '+' : ''}${revenueMoMPct}% MoM` : 'Paid invoices'}
                  />
                </div>
              )}

              {d.totalExpenses !== undefined && (
                <div className="lg:col-span-2">
                  <KPICard
                    title="Expenses"
                    value={<CurrencyDisplay amount={d.totalExpenses} className="!text-[22px]" />}
                    icon={<TrendingDown />}
                    status="negative"
                    sparklineData={buildSpark('expenses', [80, 75, 85, 90, 85, 95, 100])}
                    subtitle="Approved"
                  />
                </div>
              )}

              {d.outstandingInvoices !== undefined && (
                <div className="lg:col-span-2">
                  <KPICard
                    title="Outstanding"
                    value={<CurrencyDisplay amount={d.outstandingInvoices} className="!text-[22px]" />}
                    icon={<AlertTriangle />}
                    status="warning"
                    subtitle="Sent + overdue"
                  />
                </div>
              )}

              {d.mrr !== undefined && (
                <div className="lg:col-span-2">
                  <KPICard
                    title="MRR"
                    value={<CurrencyDisplay amount={d.mrr} className="!text-[22px]" />}
                    subtitle={`ARR ${formatCurrency(d.arr)}`}
                    icon={<PiggyBank />}
                    status="positive"
                  />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* SALES & CRM                                                   */}
      {/* ============================================================ */}
      {hasSales && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '200ms' }}>
          <SectionTitle
            label="Sales & CRM"
            action={
              <Link href="/sales/deals" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 transition-colors">
                View pipeline <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12", GRID_GAP)}>
            {(d.pipelineValue !== undefined || d.weightedPipelineValue !== undefined) && (
              <div className="lg:col-span-4">
                <HeroKPI
                  title="Pipeline"
                  value={<CurrencyDisplay amount={d.weightedPipelineValue ?? d.pipelineValue} />}
                  subtitle={d.weightedPipelineValue !== undefined && d.pipelineValue !== undefined && d.pipelineValue !== d.weightedPipelineValue
                    ? `Total ${formatCurrency(d.pipelineValue)}`
                    : 'Open deals, probability-weighted'}
                  icon={<Target />}
                  accent="neutral"
                  meta={
                    d.dealsClosingThisMonth ? (
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                          <Briefcase className="w-3 h-3 text-gray-400" />
                          {d.dealsClosingThisMonth.count} closing this month
                        </span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500">{formatCurrency(d.dealsClosingThisMonth.value)}</span>
                      </div>
                    ) : undefined
                  }
                />
              </div>
            )}

            {d.winRate !== undefined && (
              <div className="lg:col-span-2">
                <KPICard
                  title="Win Rate"
                  value={`${d.winRate.toFixed(1)}%`}
                  icon={<CheckCircle />}
                  status="positive"
                  subtitle="Won vs. lost"
                />
              </div>
            )}

            {d.averageDealSize !== undefined && (
              <div className="lg:col-span-2">
                <KPICard
                  title="Avg Deal Size"
                  value={<CurrencyDisplay amount={d.averageDealSize} className="!text-[22px]" />}
                  icon={<DollarSign />}
                  status="neutral"
                  subtitle="Won deals"
                />
              </div>
            )}

            {d.myDeals && (
              <div className="lg:col-span-2">
                <KPICard
                  title="My Deals"
                  value={<CurrencyDisplay amount={d.myDeals.value} className="!text-[22px]" />}
                  subtitle={`${d.myDeals.count} open`}
                  icon={<Briefcase />}
                  status="neutral"
                />
              </div>
            )}

            {d.funnel && Array.isArray(d.funnel) && d.funnel.length > 0 && (
              <div className="lg:col-span-2">
                <KPICard
                  title="Top Stage"
                  value={d.funnel[0]?.stage || '—'}
                  subtitle={`${d.funnel[0]?.count || 0} deals`}
                  icon={<Activity />}
                  status="neutral"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* OPERATIONS & HR                                               */}
      {/* ============================================================ */}
      {hasOps && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '300ms' }}>
          <SectionTitle
            label="Operations & HR"
            action={
              <Link href="/hr" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 transition-colors">
                View HR <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12", GRID_GAP)}>
            {d.activeProjects !== undefined && (
              <div className="lg:col-span-4">
                <HeroKPI
                  title="Active Projects"
                  value={fmtNum(d.activeProjects)}
                  subtitle={`${d.resourceUtilization !== undefined ? `${d.resourceUtilization.toFixed(0)}% billable utilization` : 'In progress'}`}
                  icon={<FolderKanban />}
                  accent="neutral"
                  meta={d.paymentMilestonesSummary ? (
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        Collected {formatCurrency(d.paymentMilestonesSummary.collected)}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500">Due {formatCurrency(d.paymentMilestonesSummary.due)}</span>
                    </div>
                  ) : undefined}
                />
              </div>
            )}

            {d.headcount !== undefined && (
              <div className="lg:col-span-2">
                <KPICard
                  title="Headcount"
                  value={fmtNum(d.headcount)}
                  icon={<Users />}
                  status="neutral"
                  subtitle="Active employees"
                />
              </div>
            )}

            {d.pendingLeaves !== undefined && (
              <div className="lg:col-span-2">
                <KPICard
                  title="Pending Leaves"
                  value={fmtNum(d.pendingLeaves)}
                  icon={<FileText />}
                  status={d.pendingLeaves > 0 ? 'warning' : 'positive'}
                  subtitle={d.pendingLeaves > 0 ? 'Needs approval' : 'All clear'}
                />
              </div>
            )}

            {d.upcomingTasks !== undefined && (
              <div className="lg:col-span-2">
                <KPICard
                  title="Upcoming Tasks"
                  value={fmtNum(d.upcomingTasks)}
                  icon={<CheckCircle />}
                  status="neutral"
                  subtitle={d.overdueTasks ? `${d.overdueTasks} overdue` : 'On track'}
                />
              </div>
            )}

            {d.myTasks && (
              <div className="lg:col-span-2">
                <KPICard
                  title="My Tasks"
                  value={fmtNum(d.myTasks.assigned)}
                  subtitle={`${d.myTasks.overdue} overdue`}
                  trend={d.myTasks.assigned > 0 ? Math.round((d.myTasks.overdue / d.myTasks.assigned) * 100) : undefined}
                  icon={<CheckCircle />}
                  status={d.myTasks.overdue > 0 ? 'negative' : 'positive'}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* CHARTS                                                        */}
      {/* ============================================================ */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '400ms' }}>
        {trend.length > 0 && (
          <div className="mb-5">
            <AreaChartWidget
              title="Revenue vs. Expenses Trend"
              data={trend}
              xAxisKey="month"
              areas={[
                { key: 'revenue', color: '#1A6DB6', name: 'Revenue' },
                { key: 'expenses', color: '#C1172C', name: 'Expenses' },
              ]}
            />
          </div>
        )}

        {/* Secondary charts grid — 12-col system, equal widths of 4 each = 12 on lg */}
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12", GRID_GAP)}>
          {d.forecast && (
            <div className="lg:col-span-4">
              <BarChartWidget title="Revenue Forecast" data={d.forecast} xAxisKey="month" bars={[{ key: 'expectedRevenue', color: '#22BFE8', name: 'Expected' }]} />
            </div>
          )}
          {d.invoiceStatusBreakdown && (
            <div className="lg:col-span-4">
              <PieChartWidget title="Invoice Status" data={d.invoiceStatusBreakdown} nameKey="status" dataKey="value" innerRadius={55} />
            </div>
          )}
          {d.headcountByDept && (
            <div className="lg:col-span-4">
              <BarChartWidget title="Headcount by Department" data={d.headcountByDept} xAxisKey="dept" bars={[{ key: 'count', color: '#7F4D9F', name: 'Employees' }]} />
            </div>
          )}
          {d.pipelineSummary && (
            <div className="lg:col-span-4">
              <PieChartWidget title="Pipeline Summary" data={d.pipelineSummary} nameKey="stage" dataKey="value" />
            </div>
          )}
          {d.funnel && (
            <div className="lg:col-span-4">
              <BarChartWidget title="Sales Funnel" data={d.funnel} xAxisKey="stage" bars={[{ key: 'value', color: '#F15A22', name: 'Value' }]} />
            </div>
          )}
          {d.aging && (
            <div className="lg:col-span-4">
              <BarChartWidget title="Invoice Aging" data={[
                { bucket: 'Current', value: d.aging.current || 0 },
                { bucket: '0–30', value: d.aging['30'] || 0 },
                { bucket: '31–60', value: d.aging['60'] || 0 },
                { bucket: '60+', value: d.aging['90+'] || 0 },
              ]} xAxisKey="bucket" bars={[{ key: 'value', color: '#F15A22', name: 'Amount' }]} />
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* RECENT ACTIVITY (real audit feed)                             */}
      {/* ============================================================ */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '500ms' }}>
        <SectionTitle
          label="Recent Activity"
          action={
            <Link href="/audit" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          }
        />
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          {activity.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
              <Building2 className="w-7 h-7 text-gray-300" />
              No recent activity
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {activity.slice(0, 6).map((row) => {
                const actor = row.actorName || row.actorEmail || row.actorId || 'system';
                const ok = row.result !== 'failure';
                return (
                  <li key={row.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0",
                        ok ? "bg-sky-50 text-sky-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {initials(actor).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          <span className="font-bold">{actor}</span>
                          <span className="text-gray-500 font-normal"> · {row.action || 'event'}</span>
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {row.entityType ? `${row.entityType}${row.entityId ? ` · ${String(row.entityId).slice(0, 10)}` : ''}` : 'System'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={ok ? 'positive' : 'negative'}>{ok ? 'OK' : 'FAIL'}</Badge>
                      <span className="text-xs text-gray-400 font-mono">{relativeTime(row.createdAt)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/40">
            <Link href="/audit" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              View all activity <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
