import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { send } from '../services/api';
import { useData, Heading, Notice, Pager, Field, format, StatusBadge } from '../components/Common';
import {
  IconUsers,
  IconUser,
  IconRoom,
  IconPlus,
  IconSearch,
  IconArrowRight,
  IconBuilding,
  IconShieldCheck,
  IconMail,
  IconPhone,
} from '../components/Icons';

export function ManagementList({ kind }) {
  const [page, setPage] = useState(1);
  const [filterQuery, setFilterQuery] = useState('');
  const state = useData('/' + kind + '?page=' + page);
  const { user } = useAuth();

  const isUsers = kind === 'users';
  const items = state.data?.items || [];

  const filteredItems = filterQuery
    ? items.filter(item => {
        const text = isUsers
          ? `${item.name} ${item.email} ${item.roleLabel || item.role}`
          : `${item.title || item.name} ${item.status}`;
        return text.toLowerCase().includes(filterQuery.toLowerCase());
      })
    : items;

  return (
    <div className="management-page">
      <Heading
        eyebrow={isUsers ? 'USER DIRECTORY' : 'ROOM INVENTORY'}
        subtitle={
          isUsers
            ? 'Manage landlords, property managers, and tenant accounts.'
            : 'Track unit vacancy, rental pricing, and property assignments.'
        }
        action={
          user.role === 'LANDLORD' ? (
            <Link className="btn btn-primary" to={'/' + kind + '/new'}>
              <IconPlus size={16} />
              <span>Add {isUsers ? 'Account' : 'Room'}</span>
            </Link>
          ) : null
        }
      >
        {isUsers ? 'Accounts' : 'Rooms'}
      </Heading>

      <Notice state={state} />

      {state.data && (
        <>
          {/* Filter Bar */}
          <div className="table-filter-bar mb-3">
            <div className="search-input-wrapper">
              <IconSearch size={16} className="search-icon" />
              <input
                type="text"
                className="form-control table-search-input"
                placeholder={
                  isUsers
                    ? 'Search accounts by name or email...'
                    : 'Search rooms by name or status...'
                }
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
              />
            </div>
            <div className="filter-summary text-muted">
              {filteredItems.length} of {state.data.total} records
            </div>
          </div>

          <section className="card table-card">
            <div className="table-responsive">
              <table className="table custom-table">
                <thead>
                  <tr>
                    <th>{isUsers ? 'Account Holder' : 'Room Name'}</th>
                    <th>{isUsers ? 'Email & Contact' : 'Monthly Rent'}</th>
                    <th>{isUsers ? 'Access Role' : 'Availability Status'}</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id || item._id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className={`table-avatar-icon ${isUsers ? 'table-avatar-user' : ''}`}
                          >
                            {isUsers ? (
                              <span>{(item.name || 'U').charAt(0).toUpperCase()}</span>
                            ) : (
                              <IconRoom size={18} />
                            )}
                          </div>
                          <div>
                            <strong className="d-block text-dark">{item.name || item.title}</strong>
                            <small className="text-muted">
                              ID: {(item.id || item._id)?.slice(-6)}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {isUsers ? (
                          <div className="text-secondary small">
                            <div>{item.email}</div>
                            {item.phone && <div className="text-muted">{item.phone}</div>}
                          </div>
                        ) : (
                          <strong className="text-dark">{format(item.price, 'price')}</strong>
                        )}
                      </td>
                      <td>
                        {isUsers ? (
                          <span
                            className={`role-chip role-chip-${(item.role || '').toLowerCase()}`}
                          >
                            {item.roleLabel || item.role}
                          </span>
                        ) : (
                          <StatusBadge status={item.status} />
                        )}
                      </td>
                      <td className="text-end">
                        <Link
                          to={'/' + kind + '/' + (item.id || item._id)}
                          className="btn btn-outline-primary btn-sm"
                        >
                          <span>Details</span>
                          <IconArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!filteredItems.length && (
              <div className="empty-state">
                <div className="empty-icon">
                  {isUsers ? <IconUsers size={32} /> : <IconRoom size={32} />}
                </div>
                <h3>{filterQuery ? 'No matching records' : 'No entries found'}</h3>
                <p>
                  {filterQuery
                    ? 'Try different keywords to find what you are looking for.'
                    : `Get started by adding your first ${isUsers ? 'user account' : 'room unit'}.`}
                </p>
                {!filterQuery && user.role === 'LANDLORD' && (
                  <Link to={'/' + kind + '/new'} className="btn btn-primary mt-2">
                    <IconPlus size={15} /> Add First {isUsers ? 'Account' : 'Room'}
                  </Link>
                )}
              </div>
            )}
          </section>

          <Pager page={page} total={state.data.total} setPage={setPage} />
        </>
      )}
    </div>
  );
}

export function ManagementForm({ kind }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const buildings = useData('/buildings?page=1');
  const isUsers = kind === 'users';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await send('/' + kind, Object.fromEntries(new FormData(e.currentTarget)));
      navigate('/' + kind + '/' + (data.user?.id || data.item._id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="management-form-page">
      <Heading
        eyebrow={isUsers ? 'USER MANAGEMENT' : 'ROOM SETUP'}
        subtitle={
          isUsers
            ? 'Provision a new tenant, manager, or landlord profile.'
            : 'Configure a new rentable unit and assign it to a building.'
        }
      >
        Add {isUsers ? 'User Account' : 'Room Unit'}
      </Heading>

      <div className="card form-card">
        {error && (
          <div role="alert" className="alert alert-danger custom-alert mb-4">
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          {isUsers ? (
            <>
              <Field
                name="name"
                label="Full Name"
                placeholder="e.g. Nguyễn Văn An"
                minLength="2"
                maxLength="100"
              />
              <Field
                name="email"
                label="Email Address"
                placeholder="e.g. user@example.com"
                type="email"
              />
              <Field
                name="phone"
                label="Phone Number"
                placeholder="e.g. 0901234567"
                required={false}
              />
              <Field
                name="password"
                label="Initial Password"
                type="password"
                minLength="8"
                autoComplete="new-password"
                helperText="Must be at least 8 characters long."
              />
              <div className="form-field-group mb-4">
                <label className="form-label" htmlFor="role">
                  System Role
                </label>
                <select id="role" name="role" className="form-select">
                  <option value="TENANT">Tenant (View leases, invoices, and payments)</option>
                  <option value="MANAGER">
                    Property Manager (Manage rooms, utilities, reports)
                  </option>
                  <option value="LANDLORD">
                    Landlord (Full operational and financial control)
                  </option>
                </select>
              </div>
            </>
          ) : (
            <>
              <Field
                name="title"
                label="Room Designation / Title"
                placeholder="e.g. Room 201 - Studio, Penthouse 502"
                minLength="2"
                maxLength="150"
              />
              <div className="form-field-group mb-3">
                <label className="form-label" htmlFor="building">
                  Associated Building
                </label>
                <select id="building" name="building" className="form-select">
                  <option value="">— Not assigned to a building —</option>
                  {(buildings.data?.items || [])
                    .filter(b => b.status === 'ACTIVE')
                    .map(b => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.address})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-field-group mb-3">
                <label className="form-label" htmlFor="description">
                  Room Description & Amenities
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="form-control"
                  rows="4"
                  required
                  minLength="5"
                  maxLength="5000"
                  placeholder="Detail room area (sqm), furnishings (air conditioner, bed, wardrobe), and policies..."
                />
              </div>

              <Field
                name="price"
                label="Monthly Rent (VND)"
                type="number"
                min="0"
                max="1000000000"
                step="1"
                placeholder="e.g. 4500000"
                helperText="Base monthly rental rate in Vietnamese Dong."
              />
            </>
          )}

          <div className="form-actions d-flex gap-2">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : `Create ${isUsers ? 'Account' : 'Room'}`}
            </button>
            <Link className="btn btn-light" to={'/' + kind}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ManagementDetail({ kind }) {
  const { id } = useParams();
  const { user } = useAuth();
  const state = useData('/' + kind + '/' + id);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const isUsers = kind === 'users';

  async function assign(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await send(
        '/rooms/' + id + '/manager',
        Object.fromEntries(new FormData(e.currentTarget)),
        'PATCH',
      );
      setMessage('Property manager assignment updated successfully.');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function assignBuilding(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await send(
        '/rooms/' + id + '/building',
        Object.fromEntries(new FormData(e.currentTarget)),
        'PATCH',
      );
      setMessage('Building assignment updated successfully.');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await send(
        '/users/' + id + '/role',
        Object.fromEntries(new FormData(e.currentTarget)),
        'PATCH',
      );
      setMessage('Account role updated successfully.');
      window.setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  const item = state.data?.user || state.data?.item;

  return (
    <div className="management-detail-page">
      <Heading
        eyebrow={isUsers ? 'ACCOUNT PROFILE' : 'UNIT DETAILS'}
        subtitle={
          isUsers
            ? 'Account identity, contact information, and permission level.'
            : 'Pricing, current occupancy state, and building assignments.'
        }
        action={
          <Link className="btn btn-outline-primary btn-sm" to={'/' + kind}>
            Back to List
          </Link>
        }
      >
        {item ? item.name || item.title : isUsers ? 'User Details' : 'Room Details'}
      </Heading>

      <Notice state={state} />

      {message && (
        <div className="alert alert-info py-2 mb-4" role="status">
          {message}
        </div>
      )}

      {item && (
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card detail-card p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div className={`table-avatar-icon ${isUsers ? 'table-avatar-user' : ''}`}>
                    {isUsers ? (
                      <span>{(item.name || 'U').charAt(0).toUpperCase()}</span>
                    ) : (
                      <IconRoom size={20} />
                    )}
                  </div>
                  <div>
                    <h2 className="h4 mb-0">{item.name || item.title}</h2>
                    <small className="text-muted">ID: {item.id || item._id}</small>
                  </div>
                </div>
                {isUsers ? (
                  <span className={`role-chip role-chip-${(item.role || '').toLowerCase()}`}>
                    {item.roleLabel || item.role}
                  </span>
                ) : (
                  <StatusBadge status={item.status} />
                )}
              </div>

              <hr className="my-3" />

              {isUsers ? (
                <dl className="property-meta-list">
                  <div className="meta-row">
                    <dt className="d-flex align-items-center gap-2">
                      <IconMail size={14} /> Email
                    </dt>
                    <dd>{item.email}</dd>
                  </div>
                  <div className="meta-row">
                    <dt className="d-flex align-items-center gap-2">
                      <IconPhone size={14} /> Phone
                    </dt>
                    <dd>{item.phone || <span className="text-muted">Not provided</span>}</dd>
                  </div>
                  <div className="meta-row">
                    <dt className="d-flex align-items-center gap-2">
                      <IconShieldCheck size={14} /> Permission
                    </dt>
                    <dd>
                      <strong>{item.roleLabel || item.role}</strong>
                    </dd>
                  </div>
                </dl>
              ) : (
                <>
                  <div className="room-price-banner mb-3 p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted small d-block">Monthly Rental Price</span>
                      <strong className="h4 text-emerald mb-0">
                        {format(item.price, 'price')}
                      </strong>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <h3 className="h6 fw-bold mt-3">Description & Facilities</h3>
                  <div className="description p-3 bg-light rounded-3 small">
                    {item.description || 'No description provided.'}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="col-lg-5">
            {isUsers
              ? user.role === 'LANDLORD' &&
                user.id !== item.id && (
                  <div className="card role-editor-card p-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <IconShieldCheck size={18} className="text-emerald" />
                      <h3 className="h5 mb-0">Modify Account Role</h3>
                    </div>
                    <p className="text-muted small">
                      Adjust this user's administrative clearance. Changes will apply on their next
                      request.
                    </p>

                    <form onSubmit={changeRole}>
                      <div className="mb-3">
                        <label htmlFor="role" className="form-label small fw-semibold">
                          Select Role
                        </label>
                        <select
                          id="role"
                          name="role"
                          className="form-select"
                          defaultValue={item.role}
                        >
                          <option value="TENANT">Tenant (Lease & Billing Access)</option>
                          <option value="MANAGER">Property Manager (Operational Control)</option>
                          <option value="LANDLORD">Landlord (Master Admin)</option>
                        </select>
                      </div>

                      <button className="btn btn-primary w-100" disabled={busy}>
                        {busy ? 'Saving…' : 'Update User Role'}
                      </button>
                    </form>
                  </div>
                )
              : user.role === 'LANDLORD' && (
                  <div className="d-flex flex-column gap-3">
                    {/* Manager assignment card */}
                    <div className="card p-4">
                      <h3 className="h6 fw-bold mb-2">Assign Property Manager</h3>
                      <p className="text-muted small mb-3">
                        Assign a staff member responsible for unit inspections and maintenance.
                      </p>
                      <form onSubmit={assign}>
                        <select
                          id="manager"
                          name="manager"
                          defaultValue={item.manager || ''}
                          className="form-select mb-3"
                        >
                          <option value="">— Unassigned —</option>
                          {(state.data?.managers || []).map(m => (
                            <option key={m._id} value={m._id}>
                              {m.name} ({m.email})
                            </option>
                          ))}
                        </select>
                        <button className="btn btn-primary btn-sm w-100" disabled={busy}>
                          {busy ? 'Saving…' : 'Save Manager'}
                        </button>
                      </form>
                    </div>

                    {/* Building assignment card */}
                    <div className="card p-4">
                      <h3 className="h6 fw-bold mb-2">Assign Building</h3>
                      <p className="text-muted small mb-3">
                        Link this room to an existing property building.
                      </p>
                      <form onSubmit={assignBuilding}>
                        <select
                          id="building"
                          name="building"
                          defaultValue={item.building || ''}
                          className="form-select mb-3"
                        >
                          <option value="">— Not assigned to a building —</option>
                          {(state.data?.buildings || []).map(b => (
                            <option key={b._id} value={b._id}>
                              {b.name} ({b.address})
                            </option>
                          ))}
                        </select>
                        <button className="btn btn-primary btn-sm w-100" disabled={busy}>
                          {busy ? 'Saving…' : 'Save Building'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
          </div>
        </div>
      )}
    </div>
  );
}
