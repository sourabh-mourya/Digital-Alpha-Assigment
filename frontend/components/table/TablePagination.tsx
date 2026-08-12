import React from 'react';
import styles from './TablePagination.module.css';
import { Button } from '../ui/Button';
import type { PaginationMeta } from '@/types/transaction';

interface TablePaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function TablePagination({ meta, onPageChange }: TablePaginationProps) {
  const { page, total_pages, total, limit } = meta;

  const startRow = (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, total);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (total_pages <= maxVisiblePages) {
      for (let i = 1; i <= total_pages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(total_pages);
      } else if (page >= total_pages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = total_pages - 3; i <= total_pages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push('...');
        pages.push(total_pages);
      }
    }
    return pages;
  };

  if (total === 0) return null;

  return (
    <div className={styles.pagination}>
      <div className={styles.info}>
        Showing <span className={styles.highlight}>{startRow}</span> to <span className={styles.highlight}>{endRow}</span> of <span className={styles.highlight}>{total}</span> results
      </div>
      
      <div className={styles.controls}>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        
        <div className={styles.pages}>
          {getPageNumbers().map((p, i) => (
            p === '...' ? (
              <span key={`dots-${i}`} className={styles.dots}>...</span>
            ) : (
              <button
                key={p}
                className={`${styles.pageButton} ${p === page ? styles.active : ''}`}
                onClick={() => onPageChange(p as number)}
                disabled={p === page}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            )
          ))}
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === total_pages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
