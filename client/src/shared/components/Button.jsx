import React from 'react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className}`.trim()}
      {...rest}
    >
      {loading ? 'Đang xử lý...' : children}
    </button>
  );
}
