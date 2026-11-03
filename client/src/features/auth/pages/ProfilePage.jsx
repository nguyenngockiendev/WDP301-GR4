import { useEffect, useState } from 'react';
import api from '../../../shared/api/axiosClient';

export default function ProfilePage() {
  const [user, setUser] = useState(null); const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  useEffect(() => { api.get('/auth/me').then(r => setUser(r.data.user)).catch(e => setError(e.response?.data?.message || 'Không tải được hồ sơ.')); }, []);
  async function saveProfile(e) {
    e.preventDefault(); setError(''); setNotice(''); const values = Object.fromEntries(new FormData(e.currentTarget));
    try { const r = await api.put('/auth/profile', values); setUser(r.data.user); setNotice(r.message); }
    catch (e) { setError(e.response?.data?.message || 'Cập nhật hồ sơ thất bại.'); }
  }
  async function changePassword(e) {
    e.preventDefault(); setError(''); setNotice(''); const form=e.currentTarget;const values = Object.fromEntries(new FormData(form));
    try { const r = await api.post('/auth/change-password', values); form.reset(); setNotice(r.message); }
    catch (e) { setError(e.response?.data?.message || 'Đổi mật khẩu thất bại.'); }
  }
  return <section className="mx-auto max-w-4xl space-y-6 py-6"><header><h1 className="text-2xl font-black text-slate-800">Hồ sơ cá nhân</h1><p className="text-sm text-slate-500">Cập nhật thông tin liên hệ và bảo mật tài khoản.</p></header>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{notice && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    <form onSubmit={saveProfile} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"><h2 className="font-bold">Thông tin cá nhân</h2>
      <label className="block text-sm">Họ tên<input name="fullName" defaultValue={user?.fullName || ''} required minLength="2" className="mt-1 w-full rounded-xl border p-3" /></label>
      <label className="block text-sm">Số điện thoại<input name="phone" defaultValue={user?.phone || ''} className="mt-1 w-full rounded-xl border p-3" /></label>
      <p className="text-sm text-slate-500">Username: {user?.username} · Email: {user?.email}</p><button className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white">Lưu hồ sơ</button>
    </form>
    <form onSubmit={changePassword} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"><h2 className="font-bold">Đổi mật khẩu</h2>
      <label className="block text-sm">Mật khẩu hiện tại<input name="currentPassword" required type="password" className="mt-1 w-full rounded-xl border p-3" /></label>
      <label className="block text-sm">Mật khẩu mới<input name="newPassword" required minLength="8" type="password" className="mt-1 w-full rounded-xl border p-3" /></label>
      <label className="block text-sm">Xác nhận mật khẩu mới<input name="confirmPassword" required minLength="8" type="password" className="mt-1 w-full rounded-xl border p-3" /></label>
      <button className="rounded-xl border border-emerald-600 px-5 py-3 font-bold text-emerald-700">Đổi mật khẩu</button>
    </form>
  </section>;
}
