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
import { TrendingUp, HelpCircle } from 'lucide-react';

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
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Quiz Score Progress
          </CardTitle>
          <CardDescription>Track your comprehension score over time</CardDescription>
        </CardHeader>
        <CardContent className="h-56 flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
          <HelpCircle className="h-8 w-8 opacity-40" />
          <p className="text-sm font-medium">No quiz attempts yet</p>
          <p className="text-xs max-w-xs">
            Complete your first interactive quiz on any document to begin charting your mastery trajectory.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format data with incremental index if dates repeat
  const chartData = data.map((item, index) => ({
    name: `${item.date} (#${index + 1})`,
    score: item.score,
  }));

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Quiz Score Progress
          </CardTitle>
          <span className="text-xs text-muted-foreground font-medium">
            {data.length} attempt{data.length === 1 ? '' : 's'} recorded
          </span>
        </div>
        <CardDescription>Percentage scored on interactive quizzes over time</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                stroke="#888888"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 11 }}
                stroke="#888888"
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                        <p className="font-semibold text-popover-foreground">
                          {payload[0].payload.name}
                        </p>
                        <p className="text-primary font-bold mt-0.5">
                          Score: {payload[0].value}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#scoreGradient)"
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

