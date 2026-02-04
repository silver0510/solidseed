'use client';

/**
 * Reports Page
 *
 * Displays career/all-time statistics for the agent including:
 * - Total Won (All-time)
 * - Won by Year/Quarter/Month
 * - Win Rate
 * - Average Deal Size
 * - Average Days to Close
 * - Deals by Type breakdown
 * - Commission Earned
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  Trophy,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Briefcase,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface AllTimeStats {
  total_won_value: number;
  total_won_count: number;
  total_lost_count: number;
  win_rate: number;
  average_deal_size: number;
  average_days_to_close: number;
  total_commission_earned: number;
}

interface PeriodStats {
  period: string;
  won_value: number;
  won_count: number;
  lost_count: number;
  commission_earned: number;
}

interface DealTypeBreakdown {
  deal_type_id: string;
  type_name: string;
  count: number;
  total_value: number;
  commission_earned: number;
}

interface ReportsData {
  all_time: AllTimeStats;
  by_period: PeriodStats[];
  by_type: DealTypeBreakdown[];
}

// =============================================================================
// COMPONENTS
// =============================================================================

function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'info' | 'warning';
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl lg:text-3xl font-bold tabular-nums">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className={`flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-lg ${
              variant === 'success'
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : variant === 'info'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : variant === 'warning'
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
            }`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPeriodLabel = (period: string, periodType: string): string => {
  if (periodType === 'year') {
    return period;
  }
  if (periodType === 'quarter') {
    const [year, quarter] = period.split('-');
    return `${quarter} ${year}`;
  }
  // month: YYYY-MM
  const [year, month] = period.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

// Chart config
const chartConfig = {
  won_value: {
    label: 'Won Value',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ReportsPage() {
  const [periodType, setPeriodType] = useState<'month' | 'quarter' | 'year'>('month');

  // Fetch reports data
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports', periodType],
    queryFn: async () => {
      const res = await fetch(`/api/reports?period=${periodType}`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const json = await res.json();
      return json.data as ReportsData;
    },
  });

  const allTime = reportsData?.all_time;
  const byPeriod = reportsData?.by_period || [];
  const byType = reportsData?.by_type || [];

  // Prepare chart data (reverse to show oldest first for better visualization)
  const chartData = [...byPeriod].reverse().map((p) => ({
    period: formatPeriodLabel(p.period, periodType),
    won_value: p.won_value,
    won_count: p.won_count,
  }));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground">Your career statistics and performance metrics</p>
      </div>

      {/* All-Time Summary Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">All-Time Performance</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard
            title="Total Won"
            value={isLoading ? '...' : formatCurrency(allTime?.total_won_value || 0)}
            subtitle={`${allTime?.total_won_count || 0} deals closed`}
            variant="success"
            icon={<Trophy className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={1.5} />}
          />
          <StatCard
            title="Commission Earned"
            value={isLoading ? '...' : formatCurrency(allTime?.total_commission_earned || 0)}
            subtitle="Lifetime earnings"
            variant="default"
            icon={<DollarSign className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={1.5} />}
          />
          <StatCard
            title="Win Rate"
            value={isLoading ? '...' : `${allTime?.win_rate || 0}%`}
            subtitle={`${allTime?.total_lost_count || 0} deals lost`}
            variant="info"
            icon={<Percent className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={1.5} />}
          />
          <StatCard
            title="Avg. Deal Size"
            value={isLoading ? '...' : formatCurrency(allTime?.average_deal_size || 0)}
            subtitle={`~${allTime?.average_days_to_close || 0} days to close`}
            variant="warning"
            icon={<TrendingUp className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={1.5} />}
          />
        </div>
      </div>

      {/* Performance Over Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Performance Over Time</CardTitle>
            <CardDescription>Won deals value by period</CardDescription>
          </div>
          <Select
            value={periodType}
            onValueChange={(value) => setPeriodType(value as 'month' | 'quarter' | 'year')}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Loading chart...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
              <Calendar className="h-12 w-12 mb-2 opacity-50" />
              <p>No data available yet</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  fontSize={12}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="won_value"
                  fill="var(--color-won_value)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout: Period Details & Deal Types */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Period Breakdown Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Period Breakdown</CardTitle>
            <CardDescription>Detailed stats by {periodType}</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : byPeriod.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No data available</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {byPeriod.map((p) => (
                  <div key={p.period} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{formatPeriodLabel(p.period, periodType)}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.won_count} won, {p.lost_count} lost
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(p.won_value)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(p.commission_earned)} commission
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deal Types Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Deals by Type</CardTitle>
            <CardDescription>Won deals breakdown by deal type</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : byType.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No deals closed yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {byType.map((t) => (
                  <div key={t.deal_type_id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{t.type_name}</p>
                      <p className="text-sm text-muted-foreground">{t.count} deals</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(t.total_value)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(t.commission_earned)} commission
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
