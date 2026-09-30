import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, send } from '../services/api';
import { Heading, Notice, Pager, Field, useData, StatusBadge } from '../components/Common';
import {
  IconBuilding,
  IconMapPin,
  IconPlus,
  IconEdit,
  IconTrash,
  IconArrowRight,
  IconUser,
  IconSearch,
} from '../components/Icons';

export function BuildingsList() {
  const [page, setPage] = useState(1);
  const [filterQuery, setFilterQuery] = useState('');
  const state = useData('/buildings?page=' + page);

  const items = state.data?.items || [];
  const filteredItems = filterQuery
    ? items.filter(
        b =>
          b.name?.toLowerCase().includes(filterQuery.toLowerCase()) ||
          b.address?.toLowerCase().includes(filterQuery.toLowerCase()),
      )
    : items;

  return (
    <div className="buildings-page">
      <Heading
        eyebrow="PROPERTY PORTFOLIO"
        subtitle="Manage your boarding houses, apartments, and commercial complexes."
        action={
          <Link className="btn btn-primary" to="/buildings/new">
            <IconPlus size={16} />
            <span>Add Building</span>
          </Link>
        }
      >
        Buildings
      </Heading>

      <Notice state={state} />

      {state.data && (
        <>
          {/* Search bar */}
          <div className="table-filter-bar mb-3">
            <div className="search-input-wrapper">
              <IconSearch size={16} className="search-icon" />
              <input
                type="text"
                className="form-control table-search-input"
                placeholder="Filter buildings by name or address..."
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
              />
            </div>
            <div className="filter-summary text-muted">
              {filteredItems.length} of {state.data.total} buildings
            </div>
          </div>

          <section className="card table-card">
            <div className="table-responsive">
              <table className="table custom-table">
                <thead>
                  <tr>
                    <th>Building Name</th>
                    <th>Location / Address</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item._id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div className="table-avatar-icon">
                            <IconBuilding size={18} />
                          </div>
                          <div>
                            <strong className="d-block text-dark">{item.name}</strong>
                            <small className="text-muted">ID: {item._id?.slice(-6)}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2 text-secondary">
                          <IconMapPin size={15} className="text-muted flex-shrink-0" />
                          <span>{item.address}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="text-end">
                        <Link
                          to={'/buildings/' + item._id}
                          className="btn btn-outline-primary btn-sm"
                        >
                          <span>Manage</span>
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
                  <IconBuilding size={32} />
                </div>
                <h3>{filterQuery ? 'No matching buildings' : 'No buildings registered yet'}</h3>
                <p>
                  {filterQuery
                    ? 'Try adjusting your search criteria.'
                    : 'Create your first building to start allocating rooms and assigning managers.'}
                </p>
                {!filterQuery && (
                  <Link to="/buildings/new" className="btn btn-primary mt-2">
                    <IconPlus size={15} /> Add First Building
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

export function BuildingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const state = useData(id ? '/buildings/' + id : '/buildings?page=1');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const item = state.data?.item;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await send(
        id ? '/buildings/' + id : '/buildings',
        Object.fromEntries(new FormData(event.currentTarget)),
        id ? 'PATCH' : 'POST',
      );
      navigate('/buildings/' + result.item._id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (id && !item) {
    return (
      <div className="building-form-page">
        <Heading eyebrow="PROPERTY PORTFOLIO">{id ? 'Edit Building' : 'Add Building'}</Heading>
        <Notice state={state} />
      </div>
    );
  }

  return (
    <div className="building-form-page">
      <Heading
        eyebrow="PROPERTY PORTFOLIO"
        subtitle={
          id
            ? 'Update property details and operational status.'
            : 'Register a new property complex into your workspace.'
        }
      >
        {id ? 'Edit Building' : 'Add New Building'}
      </Heading>

      <div className="card form-card">
        {error && (
          <div role="alert" className="alert alert-danger custom-alert mb-4">
            {error}
          </div>
        )}
        <form onSubmit={submit}>
          <Field
            name="name"
            label="Building Name"
            placeholder="e.g. Sunrise Apartments, Sunshine Boarding House"
            minLength="2"
            maxLength="200"
            defaultValue={item?.name}
            helperText="The public identification name for this property."
          />
          <Field
            name="address"
            label="Physical Address"
            placeholder="e.g. 123 Nguyen Trai, District 1, Ho Chi Minh City"
            minLength="2"
            maxLength="200"
            defaultValue={item?.address}
            helperText="Full street address and location."
          />
          <div className="form-field-group mb-4">
            <label className="form-label" htmlFor="status">
              Operational Status
            </label>
            <select
              id="status"
              name="status"
              className="form-select"
              defaultValue={item?.status || 'ACTIVE'}
            >
              <option value="ACTIVE">Active (Leasing & Operations Open)</option>
              <option value="INACTIVE">Inactive (Under renovation or closed)</option>
            </select>
          </div>

          <div className="form-actions d-flex gap-2">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : id ? 'Update Building' : 'Create Building'}
            </button>
            <Link className="btn btn-light" to="/buildings">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BuildingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const state = useData('/buildings/' + id);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const item = state.data?.item;

  async function assignManager(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setAssignSuccess(false);
    try {
      await send(
        '/buildings/' + id + '/manager',
        Object.fromEntries(new FormData(event.currentTarget)),
        'PATCH',
      );
      setAssignSuccess(true);
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        'Delete this building? All rooms under this building must be relocated first.',
      )
    ) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/buildings/' + id, { method: 'DELETE' });
      navigate('/buildings');
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="building-detail-page">
      <Heading
        eyebrow="PROPERTY MANAGEMENT"
        subtitle="Detailed configuration and assigned staff for this building."
        action={
          <div className="d-flex gap-2">
            <Link className="btn btn-outline-primary btn-sm" to="/buildings">
              Back to List
            </Link>
            <Link className="btn btn-primary btn-sm" to={'/buildings/' + id + '/edit'}>
              <IconEdit size={14} /> Edit Building
            </Link>
          </div>
        }
      >
        {item ? item.name : 'Building Details'}
      </Heading>

      <Notice state={state} />

      {item && (
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card detail-card p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h2 className="h4 mb-1">{item.name}</h2>
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <IconMapPin size={15} />
                    <span>{item.address}</span>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>

              <hr className="my-3" />

              <dl className="property-meta-list">
                <div className="meta-row">
                  <dt>Building ID</dt>
                  <dd className="font-mono">{item._id}</dd>
                </div>
                <div className="meta-row">
                  <dt>Address</dt>
                  <dd>{item.address}</dd>
                </div>
                <div className="meta-row">
                  <dt>Status</dt>
                  <dd>
                    <StatusBadge status={item.status} />
                  </dd>
                </div>
              </dl>

              <div className="danger-zone mt-4 pt-3 border-top">
                <h3 className="h6 text-danger mb-2">Danger Zone</h3>
                <p className="text-muted small mb-3">
                  Permanently remove this property from the system. Cannot be undone.
                </p>
                <button className="btn btn-outline-danger btn-sm" onClick={remove} disabled={busy}>
                  <IconTrash size={14} /> {busy ? 'Deleting…' : 'Delete Building'}
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card manager-assignment-card p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <IconUser size={18} className="text-emerald" />
                <h2 className="h5 mb-0">Assigned Property Manager</h2>
              </div>
              <p className="text-muted small">
                The designated manager has administrative permissions to manage rooms, utilities,
                and tenant requests for this property.
              </p>

              {assignSuccess && (
                <div className="alert alert-success py-2 small">Manager assigned successfully!</div>
              )}

              {error && (
                <div role="alert" className="alert alert-danger py-2 small">
                  {error}
                </div>
              )}

              <form onSubmit={assignManager}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor="manager">
                    Select Staff Member
                  </label>
                  <select
                    id="manager"
                    name="manager"
                    className="form-select"
                    defaultValue={item.manager || ''}
                  >
                    <option value="">— Unassigned —</option>
                    {(state.data.managers || []).map(manager => (
                      <option key={manager._id} value={manager._id}>
                        {manager.name} ({manager.email})
                      </option>
                    ))}
                  </select>
                </div>

                <button className="btn btn-primary w-100" disabled={busy}>
                  {busy ? 'Updating Assignment…' : 'Save Manager Assignment'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
