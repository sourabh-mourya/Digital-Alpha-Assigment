import React from 'react';
import styles from './TableHeader.module.css';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
}

interface TableHeaderProps {
  columns: Column[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}

export function TableHeader({ columns, sortBy, sortDir, onSort }: TableHeaderProps) {
  return (
    <thead className={styles.thead}>
      <tr>
        {columns.map((col) => (
          <th
            key={col.key}
            className={`
              ${styles.th} 
              ${col.sortable ? styles.sortable : ''} 
              ${styles[col.align || 'left']}
            `}
            onClick={() => {
              if (col.sortable && onSort) {
                onSort(col.key);
              }
            }}
            tabIndex={col.sortable ? 0 : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (col.sortable && onSort) {
                  e.preventDefault();
                  onSort(col.key);
                }
              }
            }}
          >
            <div className={styles.content}>
              {col.label}
              {col.sortable && (
                <span className={styles.sortIcon}>
                  {sortBy === col.key ? (
                    sortDir === 'asc' ? '↑' : '↓'
                  ) : (
                    '↕'
                  )}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}
