'use client';

import React, { useEffect, useState } from 'react';
import { fetchRewards, fetchWallet, redeemReward } from '@/lib/api';
import type { Reward, WalletResponse } from '@/types/transaction';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import styles from './rewards.module.css';

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    Promise.all([fetchRewards(), fetchWallet()])
      .then(([rewardsRes, walletRes]) => {
        setRewards(rewardsRes.data);
        setWallet(walletRes);
      })
      .catch((err) => console.error('Failed to load rewards store:', err))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward || !wallet) return;
    setIsRedeeming(true);

    const previousBalance = wallet.coin_balance;

    // Optimistic Update
    setWallet((prev: WalletResponse | null) => (prev ? { ...prev, coin_balance: prev.coin_balance - selectedReward.coin_cost } : prev));
    const rewardToRedeem = selectedReward;
    setSelectedReward(null);

    try {
      const res = await redeemReward(rewardToRedeem.id);
      // Update with exact server response balance
      setWallet((prev: WalletResponse | null) => (prev ? { ...prev, coin_balance: res.new_balance } : prev));
      showToast(`🎉 Successfully redeemed "${rewardToRedeem.name}"!`, 'success');
    } catch (err: any) {
      // Rollback on failure
      setWallet((prev: WalletResponse | null) => (prev ? { ...prev, coin_balance: previousBalance } : prev));
      showToast(err.message || 'Redemption failed. Insufficient coins.', 'error');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className={styles.container}>
      {toastMessage && (
        <div className={`${styles.toast} ${styles[toastMessage.type]}`}>
          {toastMessage.text}
        </div>
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>Rewards Store</h1>
        <p className={styles.subtitle}>Redeem your earned coins for exclusive vouchers, gift cards, and cashback.</p>
      </div>

      {/* Wallet Balance Banner */}
      <Card className={styles.walletCard}>
        <div className={styles.walletInfo}>
          <span className={styles.walletLabel}>Available Reward Balance</span>
          <div className={styles.balanceRow}>
            <span className={styles.coinIcon}>🪙</span>
            <span className={styles.balanceValue}>
              {loading ? '...' : wallet?.coin_balance.toLocaleString()}
            </span>
            <span className={styles.coinUnit}>Coins</span>
          </div>
        </div>
        <div className={styles.walletStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Earning Rule</span>
            <span className={styles.statValue}>1 Coin per $100 spent</span>
          </div>
        </div>
      </Card>

      {/* Rewards Catalogue Grid */}
      <div className={styles.grid}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className={styles.rewardCard}>
                <div className="skeleton" style={{ height: '24px', width: '60%' }} />
                <div className="skeleton" style={{ height: '16px', width: '80%', margin: '12px 0' }} />
                <div className="skeleton" style={{ height: '36px', width: '100%', marginTop: 'auto' }} />
              </Card>
            ))
          : rewards.map((reward) => {
              const canAfford = (wallet?.coin_balance ?? 0) >= reward.coin_cost;
              return (
                <Card key={reward.id} className={styles.rewardCard}>
                  <div className={styles.rewardHeader}>
                    <h3 className={styles.rewardName}>{reward.name}</h3>
                    <div className={styles.costBadge}>
                      🪙 {reward.coin_cost} Coins
                    </div>
                  </div>
                  <p className={styles.rewardDescription}>{reward.description}</p>

                  <Button
                    variant={canAfford ? 'primary' : 'secondary'}
                    disabled={!canAfford}
                    onClick={() => setSelectedReward(reward)}
                    style={{ marginTop: 'auto', width: '100%' }}
                  >
                    {canAfford ? 'Redeem Reward' : 'Insufficient Coins'}
                  </Button>
                </Card>
              );
            })}
      </div>

      {/* Confirmation Modal */}
      {selectedReward && (
        <Modal
          isOpen={!!selectedReward}
          onClose={() => setSelectedReward(null)}
          title="Confirm Redemption"
        >
          <div className={styles.modalBody}>
            <p>
              Are you sure you want to redeem <strong>{selectedReward.name}</strong> for{' '}
              <strong style={{ color: '#fbbf24' }}>🪙 {selectedReward.coin_cost} coins</strong>?
            </p>

            <div className={styles.modalMeta}>
              <div className={styles.metaRow}>
                <span>Current Balance:</span>
                <span>🪙 {wallet?.coin_balance}</span>
              </div>
              <div className={styles.metaRow}>
                <span>After Redemption:</span>
                <span style={{ color: 'var(--success-main)', fontWeight: 600 }}>
                  🪙 {(wallet?.coin_balance ?? 0) - selectedReward.coin_cost}
                </span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setSelectedReward(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmRedeem} isLoading={isRedeeming}>
                Confirm & Redeem
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
