import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'pending' | 'neutral';
}

export function Badge({ children, variant = 'neutral', className = '', ...props }: BadgeProps) {
  const rootClasses = [
    styles.badge,
    styles[variant],
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={rootClasses} {...props}>
      {children}
    </span>
  );
}
