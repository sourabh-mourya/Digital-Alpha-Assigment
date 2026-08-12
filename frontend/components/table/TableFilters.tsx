import React, { useState, useEffect } from 'react';
import styles from './TableFilters.module.css';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export interface FilterValues {
  search: string;
  status: string;
  category: string;
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
    onChange({ search: '', status: '', category: '' });
  };

  const hasActiveFilters = filters.search || filters.status || filters.category;

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

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
