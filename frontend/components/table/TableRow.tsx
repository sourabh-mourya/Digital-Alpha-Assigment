import React from 'react';
import styles from './TableRow.module.css';

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function TableRow({ children, className = '', onClick, interactive = false }: TableRowProps) {
  const isClickable = !!onClick || interactive;
  
  return (
    <tr 
      className={`
        ${styles.tr} 
        ${isClickable ? styles.clickable : ''} 
        ${className}
      `}
      onClick={onClick}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </tr>
  );
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'right' | 'center';
}

export function TableCell({ children, className = '', align = 'left', ...props }: TableCellProps) {
  return (
    <td 
      className={`${styles.td} ${styles[align]} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}
