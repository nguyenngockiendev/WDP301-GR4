import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData, Heading, Notice, Field } from '../../components/Common';
import { send } from '../../services/api';

export default function NewContract() {
  const state = useData('/contracts/options');
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await send('/contracts', Object.fromEntries(new FormData(event.currentTarget)));
      navigate('/workspace/contracts');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form-page">
      <Heading
        eyebrow="LEASES"
        subtitle="Rent and active service fees are saved with this contract."
      >
        New Contract
      </Heading>
      <Notice state={state} />
      {state.data && (
        <div className="card form-card">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={save}>
            <div className="mb-3">
              <label className="form-label" htmlFor="room">
                Room
              </label>
              <select className="form-select" id="room" name="room" required>
                <option value="">Choose a vacant room</option>
                {state.data.rooms.map(room => (
                  <option key={room._id} value={room._id}>
                    {room.code || room.title} · {Number(room.price).toLocaleString()} VND/month
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="tenant">
                Tenant
              </label>
              <select className="form-select" id="tenant" name="tenant" required>
                <option value="">Choose a tenant</option>
                {state.data.tenants.map(tenant => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name} · {tenant.email}
                  </option>
                ))}
              </select>
            </div>
            <Field name="startDate" label="Start date" type="date" />
            <Field name="endDate" label="End date" type="date" />
            <Field
              name="deposit"
              label="Deposit (VND)"
              type="number"
              min="0"
              max="1000000000"
              step="1"
            />
            <Field
              name="occupantCount"
              label="Number of occupants"
              type="number"
              min="1"
              max="100"
              step="1"
              defaultValue="1"
            />
            <p className="text-muted small">
              The contract starts immediately. The rent rate, policy and active service fees are
              saved with it.
            </p>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Create contract'}
            </button>
            <Link className="btn btn-light ms-2" to="/workspace/contracts">
              Cancel
            </Link>
          </form>
        </div>
      )}
    </div>
  );
}
