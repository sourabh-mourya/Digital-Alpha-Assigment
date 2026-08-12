/**
 * Typed fetch wrappers for all backend API endpoints.
 */

import type {
  TransactionListResponse,
  Transaction,
  TransactionFilters,
  WalletResponse,
  RewardsListResponse,
  RedemptionResponse,
  CategoryBreakdown,
  MonthlyTrend,
  SummaryStats,
} from '@/types/transaction';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(body.detail || `Request failed: ${res.status}`, res.status);
  }

  return res.json();
}

// ── Transactions ─────────────────────────────────────────

export async function fetchTransactions(
  filters: TransactionFilters = {}
): Promise<TransactionListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return request<TransactionListResponse>(`/transactions${qs ? `?${qs}` : ''}`);
}

export async function fetchTransaction(id: string): Promise<Transaction> {
  return request<Transaction>(`/transactions/${id}`);
}

// ── Analytics ────────────────────────────────────────────

export async function fetchCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  const res = await request<{ data: CategoryBreakdown[]; cached?: boolean }>(
    '/transactions/analytics/categories'
  );
  console.log(
    `[Category Breakdown] Data Source: ${res.cached ? '⚡ REDIS CACHE (HIT)' : '🗄️ DATABASE (MISS)'}`,
    res.data
  );
  return res.data;
}

export async function fetchMonthlyTrend(): Promise<MonthlyTrend[]> {
  const res = await request<{ data: MonthlyTrend[]; cached?: boolean }>(
    '/transactions/analytics/trend'
  );
  console.log(
    `[Monthly Trend] Data Source: ${res.cached ? '⚡ REDIS CACHE (HIT)' : '🗄️ DATABASE (MISS)'}`,
    res.data
  );
  return res.data;
}

export async function fetchSummaryStats(): Promise<SummaryStats> {
  const res = await request<{ data: SummaryStats; cached?: boolean }>(
    '/transactions/analytics/summary'
  );
  console.log(
    `[Summary Stats] Data Source: ${res.cached ? '⚡ REDIS CACHE (HIT)' : '🗄️ DATABASE (MISS)'}`,
    res.data
  );
  return res.data;
}

// ── Wallet ───────────────────────────────────────────────

export async function fetchWallet(): Promise<WalletResponse> {
  return request<WalletResponse>('/wallet');
}

// ── Rewards ──────────────────────────────────────────────

export async function fetchRewards(): Promise<RewardsListResponse> {
  return request<RewardsListResponse>('/rewards');
}

export async function redeemReward(rewardId: number): Promise<RedemptionResponse> {
  return request<RedemptionResponse>(`/rewards/${rewardId}/redeem`, {
    method: 'POST',
  });
}

export { ApiError };
