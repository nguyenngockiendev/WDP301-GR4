import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { IconChevronLeft, IconChevronRight } from './Icons';

export function useData(path) {
  const [state, set] = useState({ loading: true });
  useEffect(() => {
    let active = true;
    set({ loading: true });
    api(path)
      .then(data => active && set({ data }))
      .catch(e => active && set({ error: e.message }));
    return () => {
      active = false;
    };
  }, [path]);
  return state;
}

export function StatusBadge({ status }) {
  if (!status) return <span>—</span>;
  const s = String(status).toUpperCase();

  let variant = 'default';
  if (['ACTIVE', 'PAID', 'COMPLETED', 'OCCUPIED', 'RESOLVED', 'APPROVED'].includes(s)) {
    variant = 'success';
  } else if (['PENDING', 'REQUESTED', 'REVIEW', 'DRAFT', 'PARTIAL'].includes(s)) {
    variant = 'warning';
  } else if (['INACTIVE', 'OVERDUE', 'CANCELLED', 'REJECTED', 'FAILED'].includes(s)) {
    variant = 'danger';
  } else if (['VACANT', 'AVAILABLE', 'OPEN'].includes(s)) {
    variant = 'info';
  } else if (['MAINTENANCE', 'REPAIR'].includes(s)) {
    variant = 'accent';
  }

  return (
    <span className={`status-badge status-badge-${variant}`}>
      <span className="status-badge-dot" aria-hidden="true" />
      {String(status).replace(/_/g, ' ')}
    </span>
  );
}

export function Heading({ children, subtitle, action, eyebrow = 'PROPERTY MANAGEMENT' }) {
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="page-heading">
      <div className="page-heading-main">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{children}</h1>
        {subtitle && <p className="page-heading-subtitle">{subtitle}</p>}
      </div>
      <div className="page-heading-side">
        {action && <div className="page-heading-action">{action}</div>}
        <span className="today">
          <span className="today-dot" />
          {todayFormatted}
        </span>
      </div>
    </div>
  );
}

export function Notice({ state }) {
  if (state.loading) {
    return (
      <div className="loading-state" role="status">
        <div className="spinner-border spinner-border-sm text-emerald" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span>Loading information…</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div role="alert" className="alert alert-danger custom-alert">
        <div className="alert-content">
          <strong>Notice:</strong> {state.error}
        </div>
      </div>
    );
  }

  return null;
}

export function Field({
  label,
  name,
  type = 'text',
  required = true,
  defaultValue = '',
  helperText,
  ...props
}) {
  return (
    <div className="form-field-group mb-3">
      <label className="form-label" htmlFor={name}>
        {label}
        {required && <span className="required-star">*</span>}
      </label>
      <input
        className="form-control"
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        {...props}
      />
      {helperText && <small className="form-helper-text">{helperText}</small>}
    </div>
  );
}

export function format(value, key) {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (/Date$|At$|From$/.test(key)) {
    try {
      return new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(value);
    }
  }
  if (key === 'status') {
    return <StatusBadge status={value} />;
  }
  if (typeof value === 'number') {
    const isMoney = [
      'total',
      'amount',
      'rent',
      'price',
      'deposit',
      'paidAmount',
      'electricityPrice',
      'waterPrice',
    ].includes(key);

    return (
      <span className={isMoney ? 'font-money' : ''}>
        {value.toLocaleString('en-US')}
        {isMoney && <span className="currency-unit"> VND</span>}
      </span>
    );
  }
  return String(value).replaceAll('_', ' ');
}

export function Pager({ page, total, size = 10, setPage }) {
  const maxPage = Math.max(1, Math.ceil(total / size));

  return (
    <nav className="pagination-bar" aria-label="Pagination">
      <div className="pagination-info">
        Showing <strong>{Math.min(total, (page - 1) * size + 1)}</strong> to{' '}
        <strong>{Math.min(total, page * size)}</strong> of <strong>{total}</strong> records
      </div>
      <div className="pagination-controls">
        <button
          className="btn btn-pagination"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          aria-label="Previous page"
        >
          <IconChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <span className="pagination-current">
          Page <strong>{page}</strong> of <strong>{maxPage}</strong>
        </span>

        <button
          className="btn btn-pagination"
          disabled={page * size >= total}
          onClick={() => setPage(page + 1)}
          aria-label="Next page"
        >
          <span>Next</span>
          <IconChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
