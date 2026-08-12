'use client';

import React, { useEffect, useState } from 'react';
import { fetchSummaryStats, fetchWallet } from '@/lib/api';
import type { SummaryStats, WalletResponse } from '@/types/transaction';
import { CategoryChart } from '@/components/charts/CategoryChart';
import { TrendChart } from '@/components/charts/TrendChart';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSummaryStats(), fetchWallet()])
      .then(([statsRes, walletRes]) => {
        setStats(statsRes);
        setWallet(walletRes);
      })
      .catch((err) => console.error('Failed to load dashboard metrics:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCategorySelect = (category: string) => {
    router.push(`/transactions?category=${encodeURIComponent(category)}`);
  };

  const successRate = stats
    ? Math.round((stats.success_count / (stats.total_transactions || 1)) * 100)
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics & Insights</h1>
        <p className={styles.subtitle}>Deep dive into spending behavior, category breakdown, and rewards earnings.</p>
      </div>

      {/* KPI Cards */}
      <div className={styles.statsGrid}>
        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Spend</span>
          <div className={styles.kpiValue}>
            {loading ? <div className="skeleton" style={{ height: '32px', width: '120px' }} /> : `$${stats?.total_spend.toLocaleString()}`}
          </div>
          <span className={styles.kpiSub}>Across 10,000+ transactions</span>
        </Card>

        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Transactions</span>
          <div className={styles.kpiValue}>
            {loading ? <div className="skeleton" style={{ height: '32px', width: '90px' }} /> : stats?.total_transactions.toLocaleString()}
          </div>
          <span className={styles.kpiSub}>Total processed count</span>
        </Card>

        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Wallet Coin Balance</span>
          <div className={styles.kpiValue} style={{ color: '#fbbf24' }}>
            {loading ? <div className="skeleton" style={{ height: '32px', width: '100px' }} /> : `🪙 ${wallet?.coin_balance.toLocaleString()}`}
          </div>
          <span className={styles.kpiSub}>Available for rewards redemption</span>
        </Card>

        <Card className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Success Rate</span>
          <div className={styles.kpiValue} style={{ color: 'var(--success-main)' }}>
            {loading ? <div className="skeleton" style={{ height: '32px', width: '80px' }} /> : `${successRate}%`}
          </div>
          <span className={styles.kpiSub}>Completed transactions</span>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        <CategoryChart onCategorySelect={handleCategorySelect} />
        <TrendChart />
      </div>
    </div>
  );
}
