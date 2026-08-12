'use client';

import React, { useState } from 'react';
import { TransactionsTable } from '@/components/table/TransactionsTable';
import { CategoryChart } from '@/components/charts/CategoryChart';
import { TrendChart } from '@/components/charts/TrendChart';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default function Home() {
  const [showCharts, setShowCharts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.dashboardHeader}>
          <div>
            <h2 className={styles.title}>Transactions & Spend Overview</h2>
            <p className={styles.subtitle}>
              Monitor card activity across 10,000+ transactions with real-time analytics.
            </p>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setShowCharts(!showCharts)}
          >
            {showCharts ? 'Hide Charts' : 'Show Spend Analytics'}
          </Button>
        </div>

        {showCharts && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '24px', 
            marginBottom: '16px' 
          }}>
            <CategoryChart onCategorySelect={(cat) => setSelectedCategory(cat)} />
            <TrendChart />
          </div>
        )}

        <TransactionsTable key={selectedCategory} initialCategory={selectedCategory} />
      </main>
    </div>
  );
}
