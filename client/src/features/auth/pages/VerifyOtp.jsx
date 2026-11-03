import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../shared/api/axiosClient';

export default function VerifyOtp() {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function verify(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { await api.post('/auth/verify-otp', { email, otp }); setMessage('Email đã được xác thực.'); navigate('/login'); }
    catch (e) { setError(e.response?.data?.message || 'Không thể xác thực mã.'); }
    finally { setBusy(false); }
  }
  async function resend() {
    setError(''); setMessage('');
    try { await api.post('/auth/resend-otp', { email }); setMessage('Đã gửi mã mới. Kiểm tra hộp thư của bạn.'); }
    catch (e) { setError(e.response?.data?.message || 'Không thể gửi lại mã.'); }
  }
  return <main className="min-h-screen grid place-items-center bg-slate-50 p-5"><form onSubmit={verify} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-8 shadow-xl">
    <h1 className="text-2xl font-black text-slate-800">Xác thực email</h1><p className="text-sm text-slate-500">Nhập mã 6 chữ số đã gửi tới <strong>{email || 'email đăng ký'}</strong>.</p>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    <input required inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full rounded-xl border p-3 text-center text-2xl tracking-[.5em]" aria-label="Mã OTP" />
    <button disabled={busy || !email} className="w-full rounded-xl bg-emerald-600 p-3 font-bold text-white">{busy ? 'Đang xác thực…' : 'Xác thực tài khoản'}</button>
    <button type="button" onClick={resend} disabled={!email} className="w-full rounded-xl border p-3 font-semibold text-emerald-700">Gửi lại OTP</button>
    <p className="text-center text-sm"><Link className="text-emerald-700 underline" to="/login">Quay lại đăng nhập</Link></p>
  </form></main>;
}
