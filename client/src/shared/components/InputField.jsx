import React from 'react';

export default function InputField({
  label,
  name,
  type = 'text',
  placeholder = '',
  required = false,
  error = '',
  ...rest
}) {
  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={name} className="form-label fw-medium">
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className={`form-control ${error ? 'is-invalid' : ''}`.trim()}
        {...rest}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
