'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { fetchMonthlyTrend } from '@/lib/api';
import type { MonthlyTrend } from '@/types/transaction';
import { Card } from '../ui/Card';

export function TrendChart() {
  const [data, setData] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyTrend()
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load monthly trend:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card style={{ padding: '24px', height: '360px' }}>
        <div style={{ fontWeight: 600, marginBottom: '16px', color: 'var(--neutral-0)' }}>
          Monthly Spending Trend
        </div>
        <div className="skeleton" style={{ height: '260px', width: '100%' }} />
      </Card>
    );
  }

  return (
    <Card style={{ padding: '24px', height: '360px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--neutral-0)', marginBottom: '16px' }}>
        Monthly Spending Trend
      </h3>
      <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-800)" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="var(--neutral-400)"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="var(--neutral-400)"
              fontSize={12}
              tickLine={false}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--neutral-900)',
                borderColor: 'var(--neutral-800)',
                borderRadius: '8px',
                color: 'var(--neutral-0)',
                fontSize: '13px',
              }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Total Spend']}
            />
            <Area
              type="monotone"
              dataKey="total_amount"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#trendColor)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
