'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchTransactions, fetchCategoryBreakdown } from '@/lib/api';
import type { Transaction, TransactionFilters as FilterParams, PaginationMeta } from '@/types/transaction';
import { Table } from './Table';
import { TableHeader } from './TableHeader';
import { TableRow, TableCell } from './TableRow';
import { TablePagination } from './TablePagination';
import { TableFilters, type FilterValues } from './TableFilters';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

interface TransactionsTableProps {
  initialCategory?: string;
}

export function TransactionsTable({ initialCategory }: TransactionsTableProps = {}) {
  const [data, setData] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    status: '',
    category: initialCategory || '',
  });
  
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('txn_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Fetch unique categories once for the filter dropdown
  useEffect(() => {
    fetchCategoryBreakdown()
      .then(res => setCategories(res.map(c => c.category)))
      .catch(console.error);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      const params: FilterParams = {
        page,
        limit: 20,
        sort_by: sortBy,
        sort_dir: sortDir,
      };

      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.amount_min) params.amount_min = parseFloat(filters.amount_min);
      if (filters.amount_max) params.amount_max = parseFloat(filters.amount_max);

      const res = await fetchTransactions(params);
      setData(res.data);
      setMeta(res.pagination);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, filters, sortBy, sortDir]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset to page 1 when filters change
  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const columns = [
    { key: 'merchant_name', label: 'Merchant', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'txn_date', label: 'Date', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, align: 'right' as const },
  ];

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <TableFilters 
        filters={filters} 
        onChange={handleFilterChange} 
        categories={categories}
      />
      
      <Table 
        isLoading={isLoading} 
        isEmpty={!isLoading && data.length === 0}
        isError={isError}
        onRetry={loadData}
        columns={columns.length}
      >
        <TableHeader 
          columns={columns}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
        <tbody>
          {!isLoading && data.map(txn => (
            <TableRow key={txn.id} interactive onClick={() => setSelectedTxn(txn)}>
              <TableCell>
                <div style={{ fontWeight: 500, color: 'var(--neutral-0)' }}>
                  {txn.merchant_name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--neutral-500)', marginTop: '2px' }}>
                  {txn.payment_method}
                </div>
              </TableCell>
              <TableCell>{txn.category}</TableCell>
              <TableCell style={{ color: 'var(--neutral-300)' }}>
                {formatDate(txn.txn_date)}
              </TableCell>
              <TableCell>
                <Badge variant={txn.status as any}>{txn.status}</Badge>
              </TableCell>
              <TableCell align="right" style={{ 
                fontWeight: 600, 
                color: txn.amount < 0 ? 'var(--error-light)' : 'var(--neutral-100)'
              }}>
                {formatCurrency(txn.amount, txn.currency)}
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
      
      {meta && (
        <TablePagination 
          meta={meta}
          onPageChange={setPage}
        />
      )}

      {selectedTxn && (
        <Modal 
          isOpen={!!selectedTxn} 
          onClose={() => setSelectedTxn(null)} 
          title="Transaction Details"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--neutral-0)' }}>{selectedTxn.merchant_name}</h3>
                <span style={{ fontSize: '13px', color: 'var(--neutral-400)' }}>{selectedTxn.category}</span>
              </div>
              <Badge variant={selectedTxn.status as any}>{selectedTxn.status}</Badge>
            </div>

            <div style={{ 
              backgroundColor: 'var(--neutral-900)', 
              padding: '16px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--neutral-800)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--neutral-400)', fontSize: '13px' }}>Transaction ID</span>
                <span style={{ color: 'var(--neutral-200)', fontSize: '13px', fontFamily: 'monospace' }}>{selectedTxn.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--neutral-400)', fontSize: '13px' }}>Amount</span>
                <span style={{ color: 'var(--neutral-0)', fontSize: '15px', fontWeight: 600 }}>{formatCurrency(selectedTxn.amount, selectedTxn.currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--neutral-400)', fontSize: '13px' }}>Payment Method</span>
                <span style={{ color: 'var(--neutral-200)', fontSize: '13px' }}>{selectedTxn.payment_method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--neutral-400)', fontSize: '13px' }}>Date & Time</span>
                <span style={{ color: 'var(--neutral-200)', fontSize: '13px' }}>{formatDate(selectedTxn.txn_date)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}
