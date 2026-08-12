'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { fetchWallet } from '@/lib/api';
import styles from './Navbar.module.css';

export function Navbar() {
  const pathname = usePathname();
  const [coinBalance, setCoinBalance] = useState<number | null>(null);

  useEffect(() => {
    fetchWallet()
      .then((res) => setCoinBalance(res.coin_balance))
      .catch((err) => console.error('Failed to fetch wallet:', err));
  }, []);

  const navItems = [
    { label: 'Transactions', href: '/transactions' },
    { label: 'Analytics', href: '/dashboard' },
    { label: 'Rewards Store', href: '/rewards' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link href="/transactions" className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <h1>Digital Alpha Rewards</h1>
        </Link>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.rightSection}>
          {coinBalance !== null && (
            <Link href="/rewards" className={styles.coinBadge}>
              <span>🪙</span>
              <span>{coinBalance.toLocaleString()} Coins</span>
            </Link>
          )}

          <div className={styles.user}>
            <div className={styles.avatar}>SM</div>
          </div>
        </div>
      </div>
    </header>
  );
}
