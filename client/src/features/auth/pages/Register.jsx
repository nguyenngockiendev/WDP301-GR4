import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../shared/api/axiosClient';

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    if (payload.password !== payload.confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); setBusy(false); return; }
    try {
      await api.post('/auth/register', payload);
      navigate(`/verify-otp?email=${encodeURIComponent(payload.email)}`);
    } catch (e) { setError(e.response?.data?.message || 'Không thể đăng ký tài khoản.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen grid place-items-center bg-slate-50 p-5"><form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-3xl bg-white p-8 shadow-xl">
    <h1 className="text-2xl font-black text-slate-800">Tạo tài khoản</h1><p className="text-sm text-slate-500">Đăng ký tài khoản người thuê, sau đó xác thực email bằng OTP.</p>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <label className="block text-sm">Họ và tên<input required name="fullName" minLength="2" className="mt-1 w-full rounded-xl border p-3" /></label>
    <label className="block text-sm">Username<input required name="username" minLength="2" className="mt-1 w-full rounded-xl border p-3" /></label>
    <label className="block text-sm">Email<input required name="email" type="email" className="mt-1 w-full rounded-xl border p-3" /></label>
    <label className="block text-sm">Số điện thoại<input name="phone" className="mt-1 w-full rounded-xl border p-3" /></label>
    <label className="block text-sm">Mật khẩu<input required name="password" type="password" minLength="8" className="mt-1 w-full rounded-xl border p-3" /></label>
    <label className="block text-sm">Nhập lại mật khẩu<input required name="confirmPassword" type="password" minLength="8" className="mt-1 w-full rounded-xl border p-3" /></label>
    <button disabled={busy} className="w-full rounded-xl bg-emerald-600 p-3 font-bold text-white disabled:opacity-50">{busy ? 'Đang tạo tài khoản…' : 'Đăng ký và gửi OTP'}</button>
    <p className="text-center text-sm text-slate-500">Đã có tài khoản? <Link className="text-emerald-700 underline" to="/login">Đăng nhập</Link></p>
  </form></main>;
}
