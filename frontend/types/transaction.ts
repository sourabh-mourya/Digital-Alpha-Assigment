/**
 * TypeScript interfaces matching backend Pydantic models.
 */

export interface Transaction {
  id: string;
  merchant_name: string;
  category: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: 'success' | 'failed' | 'pending';
  txn_date: string;
  created_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface TransactionListResponse {
  data: Transaction[];
  pagination: PaginationMeta;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface WalletResponse {
  id: number;
  coin_balance: number;
}

export interface RewardItem {
  id: number;
  name: string;
  description: string | null;
  coin_cost: number;
}

export interface RewardsListResponse {
  data: RewardItem[];
}

export interface RedemptionResponse {
  id: string;
  reward_id: number;
  reward_name: string;
  coins_spent: number;
  status: 'confirmed' | 'failed';
  new_balance: number;
  created_at: string;
}

export interface CategoryBreakdown {
  category: string;
  total_amount: number;
  transaction_count: number;
}

export interface MonthlyTrend {
  month: string;
  total_amount: number;
  transaction_count: number;
}

export interface SummaryStats {
  total_transactions: number;
  total_spend: number;
  success_count: number;
  failed_count: number;
  pending_count: number;
}
