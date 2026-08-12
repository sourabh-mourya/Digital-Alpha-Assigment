import React, { useState, useEffect } from 'react';
import styles from './TableFilters.module.css';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export interface FilterValues {
  search: string;
  status: string;
  category: string;
  date_from?: string;
  date_to?: string;
  amount_min?: string;
  amount_max?: string;
}

interface TableFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  categories: string[];
}

export function TableFilters({ filters, onChange, categories }: TableFiltersProps) {
  // Local state for debounced search
  const [searchValue, setSearchValue] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onChange({ ...filters, search: searchValue });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchValue, filters, onChange]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, status: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, category: e.target.value });
  };

  const clearFilters = () => {
    setSearchValue('');
    onChange({ search: '', status: '', category: '', date_from: '', date_to: '', amount_min: '', amount_max: '' });
  };

  const hasActiveFilters = filters.search || filters.status || filters.category || filters.date_from || filters.date_to || filters.amount_min || filters.amount_max;

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.searchBox}>
        <Input 
          placeholder="Search merchants..." 
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          fullWidth
        />
        {searchValue && (
          <button 
            className={styles.clearSearch} 
            onClick={() => setSearchValue('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      
      <div className={styles.controls}>
        <div className={styles.selectWrapper}>
          <select 
            className={styles.select} 
            value={filters.status} 
            onChange={handleStatusChange}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <div className={styles.selectArrow}>▼</div>
        </div>

        <div className={styles.selectWrapper}>
          <select 
            className={styles.select} 
            value={filters.category} 
            onChange={handleCategoryChange}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className={styles.selectArrow}>▼</div>
        </div>

        {/* Date From & Date To */}
        <input 
          type="date" 
          className={styles.dateInput}
          value={filters.date_from || ''}
          onChange={(e) => onChange({ ...filters, date_from: e.target.value })}
          aria-label="Date from"
          title="From Date"
        />
        <input 
          type="date" 
          className={styles.dateInput}
          value={filters.date_to || ''}
          onChange={(e) => onChange({ ...filters, date_to: e.target.value })}
          aria-label="Date to"
          title="To Date"
        />

        {/* Amount Min & Max */}
        <input 
          type="number"
          placeholder="Min $" 
          className={styles.numInput}
          value={filters.amount_min || ''}
          onChange={(e) => onChange({ ...filters, amount_min: e.target.value })}
          aria-label="Min amount"
        />
        <input 
          type="number"
          placeholder="Max $" 
          className={styles.numInput}
          value={filters.amount_max || ''}
          onChange={(e) => onChange({ ...filters, amount_max: e.target.value })}
          aria-label="Max amount"
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
