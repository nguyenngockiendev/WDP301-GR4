import React, { useState } from 'react';
import { useData, Heading, Notice, Field } from '../../components/Common';
import { send } from '../../services/api';

function RoomSelect({ rooms }) {
  return (
    <div className="mb-3">
      <label className="form-label" htmlFor="room">
        Room
      </label>
      <select className="form-select" id="room" name="room" required>
        <option value="">Choose a room</option>
        {rooms.map(room => (
          <option key={room._id} value={room._id}>
            {room.code || room.title}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Billing() {
  const roomsState = useData('/rooms?page=1');
  const rooms = roomsState.data?.items || [];
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event, endpoint, parseUsage = false) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const form = event.currentTarget;
      const values = Object.fromEntries(new FormData(form));
      if (parseUsage) {
        values.serviceUsage = {};
        String(values.serviceUsageText || '')
          .split('\n')
          .filter(Boolean)
          .forEach(row => {
            const [code, amount] = row.split('=').map(value => value.trim());
            if (code) values.serviceUsage[code] = Number(amount);
          });
        delete values.serviceUsageText;
      }
      await send(endpoint, values);
      setMessage(endpoint.endsWith('readings') ? 'Meter readings saved.' : 'Invoice created.');
      form.reset();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="billing-page">
      <Heading
        eyebrow="MONTHLY BILLING"
        subtitle="Save meter readings, then create an itemized invoice for that month."
      >
        Billing
      </Heading>
      <Notice state={roomsState} />
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      )}
      {roomsState.data && (
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card form-card">
              <h2 className="h5">1. Record meter readings</h2>
              <form onSubmit={event => submit(event, '/billing/readings')}>
                <RoomSelect rooms={rooms} />
                <Field label="Billing month" name="period" type="month" />
                <Field
                  label="Previous electricity (kWh)"
                  name="electricityPrevious"
                  type="number"
                  min="0"
                  step="0.01"
                />
                <Field
                  label="Current electricity (kWh)"
                  name="electricityCurrent"
                  type="number"
                  min="0"
                  step="0.01"
                />
                <Field
                  label="Previous water (m³)"
                  name="waterPrevious"
                  type="number"
                  min="0"
                  step="0.01"
                />
                <Field
                  label="Current water (m³)"
                  name="waterCurrent"
                  type="number"
                  min="0"
                  step="0.01"
                />
                <button className="btn btn-primary" disabled={busy}>
                  Save readings
                </button>
              </form>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card form-card">
              <h2 className="h5">2. Create invoice</h2>
              <form onSubmit={event => submit(event, '/billing/invoices', true)}>
                <RoomSelect rooms={rooms} />
                <Field label="Billing month" name="period" type="month" />
                <div className="form-field-group mb-3">
                  <label className="form-label" htmlFor="serviceUsageText">
                    Usage fees
                  </label>
                  <textarea
                    id="serviceUsageText"
                    name="serviceUsageText"
                    className="form-control"
                    rows="3"
                    placeholder={'PARKING=1\nLAUNDRY=2'}
                  />
                  <small className="form-helper-text">
                    For each usage fee, enter CODE=quantity on a new line. Enter 0 when there was no
                    usage.
                  </small>
                </div>
                <button className="btn btn-primary" disabled={busy}>
                  Create invoice
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
