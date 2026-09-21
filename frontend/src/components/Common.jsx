import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
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
export function Heading({ children }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">PROPERTY MANAGEMENT</div>
        <h1>{children}</h1>
      </div>
      <span className="today">{new Date().toLocaleDateString('en-GB')}</span>
    </div>
  );
}
export function Notice({ state }) {
  return state.loading ? (
    <p role="status">Loading…</p>
  ) : state.error ? (
    <div role="alert" className="alert alert-danger">
      {state.error}
    </div>
  ) : null;
}
export function Field({
  label,
  name,
  type = 'text',
  required = true,
  defaultValue = '',
  ...props
}) {
  return (
    <div className="mb-3">
      <label className="form-label" htmlFor={name}>
        {label}
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
    </div>
  );
}
export function format(value, key) {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (/Date$|At$|From$/.test(key)) return new Date(value).toLocaleDateString('en-GB');
  if (typeof value === 'number')
    return (
      value.toLocaleString('en-US') +
      ([
        'total',
        'amount',
        'rent',
        'price',
        'deposit',
        'paidAmount',
        'electricityPrice',
        'waterPrice',
      ].includes(key)
        ? ' VND'
        : '')
    );
  return String(value).replaceAll('_', ' ');
}
export function Pager({ page, total, size = 10, setPage }) {
  return (
    <nav className="d-flex gap-3 align-items-center mt-4" aria-label="Pagination">
      <button className="btn btn-light" disabled={page <= 1} onClick={() => setPage(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} · {total} records
      </span>
      <button
        className="btn btn-light"
        disabled={page * size >= total}
        onClick={() => setPage(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
