'use client';

import * as React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Sparkles, HelpCircle } from 'lucide-react';

interface ScorePoint {
  date: string;
  score: number;
  rawDate: string;
}

interface StatsChartProps {
  data: ScorePoint[];
}

export function StatsChart({ data }: StatsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="rainbow-border-card border-0 shadow-xl overflow-hidden relative">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-sm">
              <TrendingUp className="h-4 w-4" />
            </div>
            Quiz Score Mastery Curve
          </CardTitle>
          <CardDescription className="text-xs">
            Track your comprehension retention score across study sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="h-56 flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center animate-bounce-subtle">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="font-heading font-semibold text-foreground text-sm">No quiz attempts yet</p>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Complete your first interactive quiz on any document to see your live learning curve!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data with incremental index if dates repeat
  const chartData = data.map((item, index) => ({
    name: `${item.date} (#${index + 1})`,
    score: item.score,
  }));

  const latestScore = data[data.length - 1]?.score ?? 0;

  return (
    <Card className="rainbow-border-card border-0 shadow-xl overflow-hidden relative">
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="pb-2 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 text-white shadow-md animate-float-1">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-heading font-bold tracking-tight">
                Quiz Score Mastery Curve
              </CardTitle>
              <CardDescription className="text-xs">
                Comprehension score progression over practice attempts
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xs px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30">
              Latest: {latestScore}%
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {data.length} test{data.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 relative z-10">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="scoreElectricGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6} />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
                stroke="#888888"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
                stroke="#888888"
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl border border-violet-400/30 bg-popover/90 backdrop-blur-md px-3.5 py-2.5 text-xs shadow-xl space-y-1">
                        <p className="font-heading font-semibold text-popover-foreground">
                          {payload[0].payload.name}
                        </p>
                        <div className="flex items-center gap-1.5 font-display font-bold text-violet-500 dark:text-violet-400 text-sm">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Score: {payload[0].value}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#8b5cf6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#scoreElectricGradient)"
                dot={{ r: 4, fill: '#06b6d4', stroke: '#a855f7', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#ec4899', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
