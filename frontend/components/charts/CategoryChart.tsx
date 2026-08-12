'use client';

import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { fetchCategoryBreakdown } from '@/lib/api';
import type { CategoryBreakdown } from '@/types/transaction';
import { Card } from '../ui/Card';

const COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ec4899', '#8b5cf6', '#06b6d4', '#f97316',
];

interface Props {
  onCategorySelect?: (category: string) => void;
}

export function CategoryChart({ onCategorySelect }: Props) {
  const [data, setData] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryBreakdown()
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load category breakdown:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card style={{ padding: '24px', height: '360px' }}>
        <div style={{ fontWeight: 600, marginBottom: '16px', color: 'var(--neutral-0)' }}>
          Category Breakdown
        </div>
        <div className="skeleton" style={{ height: '260px', width: '100%' }} />
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.category,
    value: item.total_amount,
  }));

  return (
    <Card style={{ padding: '24px', height: '360px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--neutral-0)', marginBottom: '16px' }}>
        Spending by Category
      </h3>
      <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
              onClick={(entry) => {
                if (onCategorySelect && entry.name) {
                  onCategorySelect(entry.name);
                }
              }}
              cursor="pointer"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
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
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: '12px', color: 'var(--neutral-300)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
