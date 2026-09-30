import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { send } from '../services/api';
import { Heading, Field } from '../components/Common';
import { IconUser, IconShieldCheck, IconMail, IconPhone, IconCheck } from '../components/Icons';

export default function Profile() {
  const { user, refresh } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await send('/profile', Object.fromEntries(new FormData(e.currentTarget)), 'PATCH');
      await refresh();
      setMessage('Your profile details have been saved successfully.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profile-page">
      <Heading
        eyebrow="USER SETTINGS"
        subtitle="Manage your personal contact details, role clearances, and workspace preferences."
      >
        Account Profile
      </Heading>

      <div className="row g-4">
        {/* Left Column: Editable Profile Details */}
        <div className="col-lg-7">
          <div className="card p-4">
            <h2 className="h5 mb-1">Personal Details</h2>
            <p className="text-muted small mb-4">
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
                  className="form-control bg-light"
                  value={user.email}
                  disabled
                  readOnly
                />
                <small className="form-helper-text">
                  Email address serves as your primary sign-in identifier and cannot be changed
                  here.
                </small>
              </div>

              <button className="btn btn-primary" disabled={busy}>
                {busy ? 'Saving Changes…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Identity Card & Role Privileges */}
        <div className="col-lg-5">
          <div className="card profile-badge-card p-4 mb-4">
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

          <div className="card p-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <IconShieldCheck size={18} className="text-emerald" />
              <h3 className="h6 mb-0">Role Permissions</h3>
            </div>
            <p className="text-muted small mb-0">
              {user.role === 'LANDLORD'
                ? 'Full administrative control over properties, room listings, user roles, financial reports, and utility rates.'
                : user.role === 'MANAGER'
                  ? 'Operational access to assigned buildings, meter reading entries, room occupancy, and tenant maintenance.'
                  : 'Tenant account with access to lease agreements, payment history, and utility invoice statements.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
