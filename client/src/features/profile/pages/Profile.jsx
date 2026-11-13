import { useEffect, useState } from 'react';
import { ArrowLeft, AtSign, LockKeyhole, Mail, Pencil, Phone, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../../shared/api/axiosClient';
import { inputCls, labelCls, btnGhost, btnPrimary } from '../../../shared/components/Modal';

const roles = { tenant: 'Người thuê', landlord: 'Chủ trọ', manager: 'Quản lý' };
const cardClass = 'min-w-0 rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7';

function Field({ label, ...props }) {
  return (
    <label className="block space-y-1">
      <span className={labelCls}>{label}</span>
      <input className={inputCls} {...props} />
    </label>
  );
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.get('/auth/profile', { signal: controller.signal })
      .then(response => setUser(response.data))
      .catch(error => {
        if (!controller.signal.aborted) {
          setLoadError(error.response?.data?.message || 'Không tải được thông tin tài khoản.');
        }
      });
    return () => controller.abort();
  }, [retry]);

  async function saveProfile(event) {
    event.preventDefault();
    const { fullName, phone } = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setError('');
    try {
      const response = await api.patch('/auth/profile', { fullName, phone });
      setUser(response.data);
      setEditing(false);
      setMessage(response.message);
    } catch (error) {
      setError(error.response?.data?.message || 'Không lưu được thông tin. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setPasswordBusy(true);
    setPasswordMessage('');
    setPasswordError('');
    try {
      const response = await api.post('/auth/password', Object.fromEntries(new FormData(form)));
      form.reset();
      setPasswordMessage(response.message);
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Không đổi được mật khẩu.');
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 text-slate-800 sm:px-6 sm:py-12">
      <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50">
        <ArrowLeft size={16} /> Về bảng điều khiển
      </Link>
      <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-5 py-7 text-white sm:px-8 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 -z-10 h-72 w-72 rounded-full border-[36px] border-white/10" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Hồ sơ cá nhân</h1>
        {user && (
          <div className="mt-5 flex min-w-0 items-center gap-4">
            <div aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-lg font-bold ring-1 ring-inset ring-white/25 sm:h-14 sm:w-14">
              {user.fullName.trim().charAt(0).toLocaleUpperCase('vi') || <UserRound size={22} />}
            </div>
            <div className="min-w-0">
              <p className="break-words text-lg font-semibold sm:text-xl">{user.fullName}</p>
              <p className="mt-0.5 text-sm text-emerald-100">{roles[user.role] || user.role}</p>
            </div>
          </div>
        )}
      </div>

      {!user && (
        <div className={cardClass}>
          <p role={loadError ? 'alert' : 'status'}>{loadError || 'Đang tải hồ sơ…'}</p>
          {loadError && (
            <button type="button" className="mt-3 font-semibold text-emerald-700" onClick={() => {
              setLoadError('');
              setRetry(value => value + 1);
            }}>
              Thử lại
            </button>
          )}
        </div>
      )}

      {user && (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight">Thông tin cá nhân</h2>
              {!editing && (
                <button type="button" className={btnGhost} onClick={() => { setEditing(true); setMessage(''); }}>
                  <span className="inline-flex items-center gap-2"><Pencil size={15} /> Chỉnh sửa</span>
                </button>
              )}
            </div>

            {message && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
            {editing ? (
              <form onSubmit={saveProfile} className="mt-5 space-y-4">
                <Field label="Họ và tên" name="fullName" defaultValue={user.fullName} autoComplete="name" required minLength={2} maxLength={100} disabled={saving} />
                <Field label="Số điện thoại" name="phone" defaultValue={user.phone ?? ''} type="tel" autoComplete="tel" maxLength={20} disabled={saving} />
                {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className={btnPrimary} disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
                  <button type="button" className={btnGhost} disabled={saving} onClick={() => { setEditing(false); setError(''); }}>Hủy</button>
                </div>
              </form>
            ) : (
              <dl className="mt-5 divide-y divide-slate-200/70 rounded-2xl bg-slate-50 px-4">
                {[
                  ['Họ và tên', user.fullName, UserRound],
                  ['Số điện thoại', user.phone || 'Chưa cập nhật', Phone],
                  ['Email', user.email, Mail],
                  ['Tên đăng nhập', user.username, AtSign],
                ].map(([label, value, Icon]) => (
                  <div key={label} className="grid gap-1 py-3.5 text-sm sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
                    <dt className="flex items-center gap-2.5 font-medium text-slate-600"><Icon aria-hidden="true" size={16} className="shrink-0 text-emerald-700" />{label}</dt>
                    <dd className="break-words font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className={cardClass}>
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <LockKeyhole aria-hidden="true" size={19} />
              </div>
              <h2 className="text-lg font-bold tracking-tight">Đổi mật khẩu</h2>
            </div>
            <form onSubmit={changePassword} className="space-y-4">
              <Field label="Mật khẩu hiện tại" name="currentPassword" type="password" autoComplete="current-password" required disabled={passwordBusy} />
              <Field label="Mật khẩu mới" name="newPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} disabled={passwordBusy} />
              {passwordMessage && <p role="status" className="text-sm text-emerald-700">{passwordMessage}</p>}
              {passwordError && <p role="alert" className="text-sm text-rose-700">{passwordError}</p>}
              <button type="submit" className={btnPrimary} disabled={passwordBusy}>
                {passwordBusy ? 'Đang lưu…' : 'Cập nhật mật khẩu'}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
