import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { send } from '../services/api';
import { Field, Heading, Notice, StatusBadge, useData, format } from '../components/Common';

const settingsTypes = {
  rates: { title: 'Electricity and water rates', submit: 'Save utility rates' },
  fees: { title: 'Services and fees', submit: 'Save service fee' },
  policies: { title: 'Contract and payment terms', submit: 'Publish policy version' },
};

export default function RentalSettings() {
  const [params, setParams] = useSearchParams();
  const kind = settingsTypes[params.get('type')] ? params.get('type') : 'rates';
  const building = params.get('building') || '';
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const buildingsState = useData('/buildings?page=1');
  const buildingDetailState = useData(building ? `/buildings/${building}` : '/buildings?page=1');
  const settingsState = useData(
    building ? `/settings/${kind}?building=${encodeURIComponent(building)}` : '/settings/none',
  );
  const buildings = buildingsState.data?.items || [];
  const items = settingsState.data?.items || [];
  const config = settingsTypes[kind];
  const selectedBuilding =
    buildingDetailState.data?.item || buildings.find(item => item._id === building);

  function selectKind(next) {
    setParams({ type: next, ...(building ? { building } : {}) });
    setSuccess('');
    setEditingItem(null);
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const form = event.currentTarget;
      const values = Object.fromEntries(new FormData(form));
      if (kind === 'fees' && editingItem) values.active = form.elements.active.checked;
      await send(
        editingItem ? `/settings/${kind}/${editingItem._id}` : '/settings/' + kind,
        {
          ...values,
          building,
        },
        editingItem ? 'PATCH' : 'POST',
      );
      setSuccess(
        kind === 'policies'
          ? 'A new policy version has been published.'
          : editingItem
            ? 'Settings updated.'
            : 'Settings saved.',
      );
      setEditingItem(null);
      event.currentTarget.reset();
      window.location.reload();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rental-settings-page">
      <Heading
        eyebrow="LANDLORD SETTINGS"
        subtitle="Configure prices, recurring fees and contract payment rules by boarding house."
      >
        Rental Settings
      </Heading>
      <div
        className="d-flex flex-wrap gap-2 mb-4"
        role="tablist"
        aria-label="Rental settings categories"
      >
        {Object.entries(settingsTypes).map(([key, value]) => (
          <button
            key={key}
            className={`btn ${kind === key ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => selectKind(key)}
          >
            {value.title}
          </button>
        ))}
      </div>
      {!building ? (
        <section className="settings-building-list">
          <div className="mb-2">
            <h2 className="h5 mb-1">Choose a boarding house</h2>
            <p className="text-muted mb-0">
              Open a property to review and configure its existing settings.
            </p>
          </div>
          {buildingsState.error && <div className="alert alert-danger">{buildingsState.error}</div>}
          {buildings.map(item => (
            <Link
              className="settings-building-card"
              key={item._id}
              to={`/settings?type=${kind}&building=${item._id}`}
            >
              <span className="settings-building-icon">⌂</span>
              <span className="settings-building-info">
                <strong>{item.name}</strong>
                <small>{item.address || 'No address provided'}</small>
              </span>
              <span className="settings-building-status">{item.status || 'ACTIVE'}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
          {!buildingsState.loading && !buildingsState.error && !buildings.length && (
            <div className="alert alert-info">
              Create a boarding house first in <Link to="/buildings">Manage boarding houses</Link>.
            </div>
          )}
        </section>
      ) : (
        <>
          <Link className="settings-back-link" to={`/settings?type=${kind}`}>
            ← All boarding houses
          </Link>
          <section className="settings-property-card">
            <span className="settings-property-label">BOARDING HOUSE</span>
            <h2>{selectedBuilding?.name || 'Loading boarding house…'}</h2>
            <p>{selectedBuilding?.address || ''}</p>
          </section>
        </>
      )}

      {building && (
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card p-4">
              <h2 className="h5 mb-3">{editingItem ? `Edit ${config.title}` : config.submit}</h2>
              {error && (
                <div role="alert" className="alert alert-danger">
                  {error}
                </div>
              )}
              {success && (
                <div role="status" className="alert alert-success">
                  {success}
                </div>
              )}
              <form onSubmit={save}>
                {kind === 'rates' && (
                  <>
                    <Field
                      label="Effective date"
                      name="effectiveFrom"
                      type="date"
                      required
                      defaultValue={editingItem?.effectiveFrom?.slice(0, 10)}
                    />
                    <Field
                      label="Electricity price (VND/kWh)"
                      name="electricityPrice"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={editingItem?.electricityPrice}
                    />
                    <Field
                      label="Water price (VND/m³)"
                      name="waterPrice"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={editingItem?.waterPrice}
                    />
                  </>
                )}
                {kind === 'fees' && (
                  <>
                    <Field
                      label="Fee code"
                      name="code"
                      maxLength="50"
                      defaultValue={editingItem?.code}
                    />
                    <Field
                      label="Service name"
                      name="name"
                      maxLength="200"
                      defaultValue={editingItem?.name}
                    />
                    <div className="mb-3">
                      <label className="form-label" htmlFor="fee-unit">
                        Billing unit
                      </label>
                      <select
                        id="fee-unit"
                        name="unit"
                        className="form-select"
                        defaultValue={editingItem?.unit || 'MONTH'}
                      >
                        <option value="MONTH">Per month</option>
                        <option value="PERSON">Per person</option>
                        <option value="USAGE">Per usage (unit below)</option>
                      </select>
                    </div>
                    <Field
                      label="Usage unit (only for usage fees, e.g. trip)"
                      name="usageUnit"
                      maxLength="30"
                      required={false}
                      defaultValue={editingItem?.usageUnit}
                    />
                    <Field
                      label="Price (VND)"
                      name="price"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={editingItem?.price}
                    />
                    {editingItem && (
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          id="fee-active"
                          name="active"
                          type="checkbox"
                          value="true"
                          defaultChecked={editingItem.active}
                        />
                        <label className="form-check-label" htmlFor="fee-active">
                          Service is active
                        </label>
                      </div>
                    )}
                  </>
                )}
                {kind === 'policies' && (
                  <>
                    <Field
                      label="Minimum rental term (months)"
                      name="minMonths"
                      type="number"
                      min="1"
                      max="120"
                    />
                    <Field
                      label="Notice period before move-out (days)"
                      name="noticeDays"
                      type="number"
                      min="0"
                      max="365"
                    />
                    <Field
                      label="Payment due day of month"
                      name="paymentDueDay"
                      type="number"
                      min="1"
                      max="31"
                    />
                    <Field
                      label="Payment grace period (days)"
                      name="paymentGraceDays"
                      type="number"
                      min="0"
                      max="31"
                    />
                    <div className="mb-3">
                      <label className="form-label" htmlFor="terms">
                        Contract terms
                      </label>
                      <textarea
                        id="terms"
                        name="terms"
                        className="form-control"
                        rows="5"
                        maxLength="20000"
                        required
                      />
                    </div>
                  </>
                )}
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : editingItem ? 'Update settings' : config.submit}
                </button>
                {editingItem && (
                  <button
                    className="btn btn-light ms-2"
                    type="button"
                    onClick={() => setEditingItem(null)}
                  >
                    Cancel edit
                  </button>
                )}
              </form>
            </div>
          </div>
          <div className="col-lg-7">
            <div className="card table-card">
              <div className="p-3 border-bottom">
                <h2 className="h5 mb-0">Current settings</h2>
              </div>
              <Notice state={settingsState} />
              {!settingsState.loading && !settingsState.error && !items.length && (
                <p className="p-3 text-muted mb-0">
                  No settings have been added for this boarding house.
                </p>
              )}
              {items.length > 0 && (
                <div className="table-responsive">
                  <table className="table custom-table mb-0">
                    <thead>
                      <tr>
                        <th>Details</th>
                        <th>State</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item._id}>
                          <td>
                            {kind === 'rates' ? (
                              <>
                                {format(item.effectiveFrom, 'effectiveFrom')} · Electricity{' '}
                                {format(item.electricityPrice, 'electricityPrice')} / Water{' '}
                                {format(item.waterPrice, 'waterPrice')}
                              </>
                            ) : kind === 'fees' ? (
                              <>
                                {item.name} ({item.code}) · {format(item.price, 'price')} /{' '}
                                {item.unit === 'USAGE' ? item.usageUnit : item.unit}
                              </>
                            ) : (
                              <>
                                Version {item.version} · Due day {item.paymentDueDay} · Grace{' '}
                                {item.paymentGraceDays} days · Minimum {item.minMonths} months
                              </>
                            )}
                          </td>
                          <td>
                            {kind === 'fees' ? (
                              <StatusBadge status={item.active ? 'ACTIVE' : 'INACTIVE'} />
                            ) : (
                              <StatusBadge status="ACTIVE" />
                            )}
                          </td>
                          <td>
                            {kind === 'fees' && (
                              <button
                                className="btn btn-outline-primary btn-sm"
                                type="button"
                                onClick={() => setEditingItem(item)}
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
