import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { send } from '../../../shared/api/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [requested, setRequested] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function requestCode(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const result = await send('/auth/forgot-password', { email });
      setRequested(true);
      setMessage(result.message || 'Nếu tài khoản tồn tại, mã xác nhận đã được gửi.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function reset(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await send('/auth/reset-password', { email, code, newPassword });
      setMessage('Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.');
      setRequested(false); setCode(''); setNewPassword('');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-container"><div className="auth-card-wrapper"><section className="card auth-card shadow-lg">
      <div className="auth-card-header text-center mb-4"><div className="auth-brand-emblem mx-auto mb-3"><span className="brand-glyph">SR</span></div><h1 className="h3 auth-title">Khôi phục mật khẩu</h1><p className="small text-muted">Mã OTP sẽ được gửi qua dịch vụ email SMTP của dự án.</p></div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}{message && <div className="alert alert-success" role="status">{message}</div>}
      {!requested ? <form onSubmit={requestCode}><label className="form-label" htmlFor="reset-email">Email tài khoản</label><input className="form-control mb-3" id="reset-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} /><button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi mã xác nhận'}</button></form> : <form onSubmit={reset}><label className="form-label" htmlFor="reset-code">Mã OTP</label><input className="form-control mb-3" id="reset-code" inputMode="numeric" maxLength="6" pattern="[0-9]{6}" required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} /><label className="form-label" htmlFor="new-password">Mật khẩu mới</label><input className="form-control mb-3" id="new-password" type="password" autoComplete="new-password" minLength="8" required value={newPassword} onChange={e => setNewPassword(e.target.value)} /><button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Đang cập nhật…' : 'Đặt lại mật khẩu'}</button></form>}
      <div className="text-center small mt-3"><Link to="/login">Quay lại đăng nhập</Link></div>
    </section></div></div>
  );
}
