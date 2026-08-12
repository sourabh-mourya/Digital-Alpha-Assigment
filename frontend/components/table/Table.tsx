import React from 'react';
import styles from './Table.module.css';
import { Card } from '../ui/Card';

interface TableProps {
  children: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  columns?: number; // Used for skeleton loader
}

export function Table({
  children,
  isLoading,
  isEmpty,
  isError,
  emptyMessage = 'No data found.',
  errorMessage = 'Something went wrong.',
  onRetry,
  columns = 5,
}: TableProps) {
  return (
    <Card className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          {children}
        </table>
        
        {isLoading && (
          <div className={styles.stateContainer}>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div key={rowIndex} className={styles.skeletonRow}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <div key={colIndex} className={styles.skeletonCell}>
                    <div className="skeleton" style={{ height: '20px', width: '80%' }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {!isLoading && isEmpty && (
          <div className={styles.stateContainer}>
            <div className={styles.emptyState}>
              <span className={styles.icon}>🔍</span>
              <p>{emptyMessage}</p>
            </div>
          </div>
        )}

        {!isLoading && isError && (
          <div className={styles.stateContainer}>
            <div className={styles.errorState}>
              <span className={styles.icon}>⚠️</span>
              <p>{errorMessage}</p>
              {onRetry && (
                <button onClick={onRetry} className={styles.retryButton}>
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
