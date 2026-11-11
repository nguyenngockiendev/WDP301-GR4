import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../shared/api/axiosClient';


import { inputCls, labelCls } from '../../../shared/components/Modal';
const Field = ({ label, helperText, ...props }) => <label className="block mb-4"><span className={labelCls}>{label}</span><input className={inputCls} required {...props} />{helperText && <small className="text-slate-500">{helperText}</small>}</label>;
const Heading = ({ children, subtitle }) => <div className="mb-6"><Link to="/" className="text-emerald-700">← Trang chủ</Link><h1 className="text-2xl font-bold mt-4">{children}</h1><p className="text-sm text-slate-500">{subtitle}</p></div>;
import { ShieldCheck as IconShieldCheck, Mail as IconMail, Phone as IconPhone, Check as IconCheck } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loadError, setLoadError] = useState('');
  const refresh = async () => {
    const response = await api.get('/auth/profile');
    setUser({ ...response.data, name: response.data.fullName, roleLabel: ({ tenant: 'Người thuê', landlord: 'Chủ trọ', manager: 'Quản lý' })[response.data.role] });
  };
  useEffect(() => { let active = true;
    api.get('/auth/profile').then(response => { if (active) setUser({ ...response.data, name: response.data.fullName, roleLabel: ({ tenant: 'Người thuê', landlord: 'Chủ trọ', manager: 'Quản lý' })[response.data.role] }); })
      .catch(() => { if (active) setLoadError('Không tải được thông tin tài khoản. Vui lòng tải lại trang.'); });
    return () => { active = false; };
  }, []);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const values = Object.fromEntries(new FormData(e.currentTarget));
      await api.patch('/auth/profile', { fullName: values.name, phone: values.phone });
      await refresh();
      setMessage('Your profile details have been saved successfully.');
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setPasswordBusy(true);
    setPasswordMessage('');
    setPasswordError('');
    try {
      await api.post('/auth/password', Object.fromEntries(new FormData(form)));
      form.reset();
      setPasswordMessage('Mật khẩu đã được cập nhật.');
    } catch (e) {
      setPasswordError(e.response?.data?.message || e.message);
    } finally {
      setPasswordBusy(false);
    }
  }

  if (!user) return <div className="p-8" role={loadError ? 'alert' : 'status'}>{loadError || 'Đang tải thông tin tài khoản...'}</div>;
  return (
    <div className="max-w-6xl mx-auto p-6 text-slate-800">
      <Heading
        eyebrow="USER SETTINGS"
        subtitle="Manage your personal contact details, role clearances, and workspace preferences."
      >
        Account Profile
      </Heading>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Editable Profile Details */}
        <div className="min-w-0">
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-1">Personal Details</h2>
            <p className="text-sm text-slate-500 mb-4">
              Update how your name and contact phone appear across invoices, leases, and staff
              directories.
            </p>

            {message && (
              <div
                className="alert alert-success d-flex align-items-center gap-2 mb-3 py-2 small"
                role="status"
              >
                <IconCheck size={16} />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="alert alert-danger mb-3 py-2 small" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={submit}>
              <Field
                label="Full Name"
                name="name"
                defaultValue={user.name}
                placeholder="e.g. Nguyễn Văn An"
              />
              <Field
                label="Phone Number"
                name="phone"
                defaultValue={user.phone}
                required={false}
                placeholder="e.g. 0901234567"
                helperText="Used for SMS notifications and tenant emergency calls."
              />

              <div className="form-field-group mb-4">
                <label className="form-label" htmlFor="email-disabled">
                  Email Address
                </label>
                <input
                  id="email-disabled"
                  type="email"
                  className="w-full rounded-xl border bg-slate-100 p-3"
                  value={user.email}
                  disabled
                  readOnly
                />
                <small className="form-helper-text">
                  Email address serves as your primary sign-in identifier and cannot be changed
                  here.
                </small>
              </div>

              <button className="rounded-xl bg-emerald-600 text-white px-4 py-2 font-bold disabled:opacity-50" disabled={busy}>
                {busy ? 'Saving Changes…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Identity Card & Role Privileges */}
        <div className="min-w-0">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 mb-4">
            <h2 className="text-lg font-bold mb-1">Đổi mật khẩu</h2>
            <p className="text-sm text-slate-500 mb-3">Xác nhận mật khẩu hiện tại trước khi lưu mật khẩu mới.</p>
            {passwordMessage && <div className="alert alert-success py-2 small" role="status">{passwordMessage}</div>}
            {passwordError && <div className="alert alert-danger py-2 small" role="alert">{passwordError}</div>}
            <form onSubmit={changePassword}>
              <Field label="Mật khẩu hiện tại" name="currentPassword" type="password" autoComplete="current-password" minLength="8" />
              <Field label="Mật khẩu mới" name="newPassword" type="password" autoComplete="new-password" minLength="8" helperText="Tối thiểu 8 ký tự." />
              <button className="rounded-xl bg-emerald-600 text-white px-4 py-2 font-bold disabled:opacity-50" disabled={passwordBusy}>{passwordBusy ? 'Đang lưu…' : 'Cập nhật mật khẩu'}</button>
            </form>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-6 mb-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="profile-large-avatar">
                {user.name?.trim().charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="h5 mb-0 text-dark">{user.name}</h3>
                <span className={`role-chip role-chip-${(user.role || '').toLowerCase()}`}>
                  {user.roleLabel || user.role}
                </span>
              </div>
            </div>

            <hr className="my-3" />

            <div className="profile-meta-list small">
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted d-flex align-items-center gap-2">
                  <IconMail size={14} /> Email:
                </span>
                <strong className="text-dark">{user.email}</strong>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted d-flex align-items-center gap-2">
                  <IconPhone size={14} /> Phone:
                </span>
                <span>{user.phone || '—'}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted d-flex align-items-center gap-2">
                  <IconShieldCheck size={14} /> Role:
                </span>
                <span className="fw-semibold text-emerald">{user.roleLabel || user.role}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <div className="d-flex align-items-center gap-2 mb-2">
              <IconShieldCheck size={18} className="text-emerald" />
              <h3 className="h6 mb-0">Role Permissions</h3>
            </div>
            <p className="text-muted small mb-0">
              {user.role === 'landlord'
                ? 'Full administrative control over properties, room listings, user roles, financial reports, and utility rates.'
                : user.role === 'manager'
                  ? 'Operational access to assigned buildings, meter reading entries, room occupancy, and tenant maintenance.'
                  : 'Tenant account with access to lease agreements, payment history, and utility invoice statements.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
