import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { send } from '../services/api';
import { Heading, Field } from '../components/Common';
export default function Profile() {
  const { user, refresh } = useAuth(),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await send('/profile', Object.fromEntries(new FormData(e.currentTarget)), 'PATCH');
      await refresh();
      setMessage('Profile saved.');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading>My profile</Heading>
      <div className="card form-card p-4">
        <p>
          {user.email} · {user.roleLabel}
        </p>
        {message && <p role="status">{message}</p>}
        <form onSubmit={submit}>
          <Field label="Full name" name="name" defaultValue={user.name} />
          <Field label="Phone number" name="phone" defaultValue={user.phone} required={false} />
          <button className="btn btn-primary" disabled={busy}>
            Save changes
          </button>
        </form>
      </div>
    </>
  );
}
