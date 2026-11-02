import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { send } from '../../../shared/api/api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function verify(event) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      await send('/auth/verify-email', { email, code });
      navigate('/login?verified=1');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function resend() {
    setBusy(true); setError(''); setMessage('');
    try {
      await send('/auth/resend-verification', { email });
      setMessage('Mã xác nhận mới đã được gửi đến email của bạn.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-container"><div className="auth-card-wrapper"><section className="card auth-card shadow-lg">
      <div className="auth-card-header text-center mb-4"><div className="auth-brand-emblem mx-auto mb-3"><span className="brand-glyph">SR</span></div><h1 className="h3 auth-title">Xác nhận email</h1><p className="small text-muted">Nhập mã 6 số được gửi qua email SMTP để kích hoạt tài khoản.</p></div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}{message && <div className="alert alert-success" role="status">{message}</div>}
      <form onSubmit={verify}>
        <label className="form-label" htmlFor="verify-email">Email</label><input className="form-control mb-3" id="verify-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <label className="form-label" htmlFor="otp-code">Mã xác nhận</label><input className="form-control mb-3 text-center" id="otp-code" inputMode="numeric" autoComplete="one-time-code" maxLength="6" pattern="[0-9]{6}" required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
        <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Đang xác nhận…' : 'Xác nhận tài khoản'}</button>
      </form>
      <button className="btn btn-link w-100 mt-2" disabled={busy || !email} onClick={resend}>Gửi lại mã</button>
      <div className="text-center small mt-2"><Link to="/login">Quay lại đăng nhập</Link></div>
    </section></div></div>
  );
}
