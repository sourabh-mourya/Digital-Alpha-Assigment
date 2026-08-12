'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TransactionsTable } from '@/components/table/TransactionsTable';
import styles from './transactions.module.css';

function TransactionsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || undefined;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>All Transactions</h1>
        <p className={styles.subtitle}>
          Filter, search, and audit all 10,000+ credit card transactions in real-time.
        </p>
      </div>

      <TransactionsTable key={initialCategory} initialCategory={initialCategory} />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className="skeleton" style={{ height: '40px', width: '250px', marginBottom: '24px' }} />
        <div className="skeleton" style={{ height: '400px', width: '100%' }} />
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}
