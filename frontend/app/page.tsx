import { TransactionsTable } from '@/components/table/TransactionsTable';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⬡</span>
            <h1>Digital Alpha</h1>
          </div>
          <div className={styles.user}>
            <div className={styles.avatar}>SM</div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.dashboardHeader}>
          <div>
            <h2 className={styles.title}>Transactions Overview</h2>
            <p className={styles.subtitle}>Manage and analyze your recent credit card activity.</p>
          </div>
          {/* We will add Wallet/Rewards here later in Phase 8 */}
        </div>

        <TransactionsTable />
      </main>
    </div>
  );
}
