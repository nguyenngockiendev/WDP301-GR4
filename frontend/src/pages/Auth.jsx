import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { send } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Heading, Field } from '../components/Common';
export default function Auth({ register = false }) {
  const { user, refresh } = useAuth(),
    navigate = useNavigate(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      await send(register ? '/auth/register' : '/auth/login', data);
      await refresh();
      navigate(register ? '/login?registered=1' : '/');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading>{register ? 'Create account' : 'Sign in'}</Heading>
      <section className="card form-card p-4">
        <h2 className="h4">{register ? 'Make yourself at home' : 'Welcome back'}</h2>
        <p className="text-secondary">
          {register
            ? 'Create your tenant account to get started.'
            : 'Sign in to your property workspace.'}
        </p>
        {location.search.includes('registered=1') && (
          <div className="alert alert-success">Account created. You can now sign in.</div>
        )}
        {error && (
          <div role="alert" className="alert alert-danger">
            {error}
          </div>
        )}
        <form onSubmit={submit}>
          {register && (
            <>
              <Field label="Full name" name="name" minLength="2" maxLength="100" />
              <Field label="Phone number" name="phone" required={false} />
            </>
          )}
          <Field label="Email" name="email" type="email" autoComplete="username" />
          <Field
            label="Password"
            name="password"
            type="password"
            minLength="8"
            autoComplete={register ? 'new-password' : 'current-password'}
          />
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <Link className="mt-3" to={register ? '/login' : '/register'}>
          {register ? 'Already have an account? Sign in' : 'New here? Create account'}
        </Link>
      </section>
    </>
  );
}
