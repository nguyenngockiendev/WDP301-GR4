import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { send } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Heading, Field } from '../components/Common';
import {
  IconEye,
  IconEyeOff,
  IconArrowRight,
  IconSparkles,
  IconShieldCheck,
} from '../components/Icons';

export default function Auth({ register = false }) {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      await send(register ? '/auth/register' : '/auth/login', data);
      await refresh();
      navigate(register ? '/login?registered=1' : '/dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card-wrapper">
        <div className="card auth-card shadow-lg">
          <div className="auth-card-header text-center mb-4">
            <div className="auth-brand-emblem mx-auto mb-3">
              <span className="brand-glyph">SR</span>
            </div>
            <h1 className="h3 auth-title mb-1">
              {register ? 'Create Tenant Account' : 'Welcome to Smart Rental'}
            </h1>
            <p className="text-muted small">
              {register
                ? 'Sign up to manage your lease contracts, utility bills, and rental payments.'
                : 'Sign in to access your personal property workspace.'}
            </p>
          </div>

          {location.search.includes('registered=1') && (
            <div className="alert alert-success d-flex align-items-center gap-2 mb-4 py-2 small">
              <IconShieldCheck size={16} />
              <span>Account created successfully! Please sign in with your credentials.</span>
            </div>
          )}

          {error && (
            <div role="alert" className="alert alert-danger custom-alert mb-4">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="auth-form">
            {register && (
              <>
                <Field
                  label="Full Name"
                  name="name"
                  placeholder="e.g. Nguyễn Văn An"
                  minLength="2"
                  maxLength="100"
                />
                <Field
                  label="Phone Number"
                  name="phone"
                  placeholder="e.g. 0901234567"
                  required={false}
                />
              </>
            )}

            <Field
              label="Email Address"
              name="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="username"
            />

            <div className="form-field-group mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label mb-0" htmlFor="password">
                  Password <span className="required-star">*</span>
                </label>
              </div>
              <div className="password-input-group position-relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  minLength="8"
                  required
                  placeholder="••••••••"
                  autoComplete={register ? 'new-password' : 'current-password'}
                  className="form-control pe-5"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary w-100 btn-lg mb-3" disabled={busy}>
              {busy ? (
                'Processing…'
              ) : (
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <span>{register ? 'Create Account' : 'Sign in to Workspace'}</span>
                  <IconArrowRight size={16} />
                </div>
              )}
            </button>
          </form>

          <div className="auth-card-footer text-center pt-3 border-top mt-2">
            <Link
              className="text-decoration-none small text-muted hover-primary"
              to={register ? '/login' : '/register'}
            >
              {register ? (
                <>
                  Already registered? <strong className="text-emerald">Sign in here</strong>
                </>
              ) : (
                <>
                  Need a tenant account? <strong className="text-emerald">Create one now</strong>
                </>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
