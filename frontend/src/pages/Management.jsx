import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { send } from '../services/api';
import { useData, Heading, Notice, Pager, Field, format } from '../components/Common';
export function ManagementList({ kind }) {
  const [page, setPage] = useState(1),
    state = useData('/' + kind + '?page=' + page),
    { user } = useAuth();
  return (
    <>
      <Heading>{kind === 'users' ? 'People' : 'Rooms'}</Heading>
      {user.role === 'ADMIN' && (
        <Link className="btn btn-primary mb-4" to={'/' + kind + '/new'}>
          + Add {kind === 'users' ? 'user' : 'room'}
        </Link>
      )}
      <Notice state={state} />
      {state.data && (
        <>
          <div className="card table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>{kind === 'users' ? 'Email' : 'Monthly rent'}</th>
                  <th>{kind === 'users' ? 'Role' : 'Status'}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.data.items.map(item => (
                  <tr key={item.id || item._id}>
                    <td>{item.name || item.title}</td>
                    <td>{kind === 'users' ? item.email : format(item.price, 'price')}</td>
                    <td>{item.roleLabel || item.status}</td>
                    <td>
                      <Link to={'/' + kind + '/' + (item.id || item._id)}>Details →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!state.data.items.length && (
              <div className="empty-state">
                <h3>No records yet</h3>
                <p>Your records will appear here.</p>
              </div>
            )}
          </div>
          <Pager page={page} total={state.data.total} setPage={setPage} />
        </>
      )}
    </>
  );
}
export function ManagementForm({ kind }) {
  const navigate = useNavigate(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    buildings = useData('/buildings?page=1');
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
    <>
      <Heading>Add {kind === 'users' ? 'user' : 'room'}</Heading>
      <div className="card form-card p-4">
        {error && (
          <p role="alert" className="alert alert-danger">
            {error}
          </p>
        )}
        <form onSubmit={submit}>
          {kind === 'users' ? (
            <>
              <Field name="name" label="Full name" minLength="2" maxLength="100" />
              <Field name="email" label="Email" type="email" />
              <Field name="phone" label="Phone number" required={false} />
              <Field
                name="password"
                label="Password"
                type="password"
                minLength="8"
                autoComplete="new-password"
              />
              <label className="form-label" htmlFor="role">
                Role
              </label>
              <select id="role" name="role" className="form-select mb-4">
                <option value="TENANT">Tenant</option>
                <option value="MANAGER">Property Manager</option>
                <option value="ADMIN">Landlord</option>
              </select>
            </>
          ) : (
            <>
              <Field name="title" label="Room name" minLength="2" maxLength="150" />
              <label className="form-label" htmlFor="building">
                Building
              </label>
              <select id="building" name="building" className="form-select mb-3">
                <option value="">Not assigned to a building</option>
                {(buildings.data?.items || [])
                  .filter(b => b.status === 'ACTIVE')
                  .map(b => (
                    <option key={b._id} value={b._id}>
                      {b.name} — {b.address}
                    </option>
                  ))}
              </select>
              <label className="form-label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className="form-control mb-3"
                rows="5"
                required
                minLength="5"
                maxLength="5000"
              />
              <Field
                name="price"
                label="Monthly rent (VND)"
                type="number"
                min="0"
                max="1000000000"
                step="1"
              />
            </>
          )}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>{' '}
          <Link className="btn btn-light" to={'/' + kind}>
            Cancel
          </Link>
        </form>
      </div>
    </>
  );
}
export function ManagementDetail({ kind }) {
  const { id } = useParams(),
    { user } = useAuth(),
    state = useData('/' + kind + '/' + id),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  async function assign(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await send(
        '/rooms/' + id + '/manager',
        Object.fromEntries(new FormData(e.currentTarget)),
        'PATCH',
      );
      setMessage('Manager assignment saved.');
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
      setMessage('Building assignment saved.');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  const item = state.data?.user || state.data?.item;
  return (
    <>
      <Heading>{kind === 'users' ? 'User details' : 'Room details'}</Heading>
      <Notice state={state} />
      {item && (
        <div className="card form-card p-4">
          <h2 className="h4">{item.name || item.title}</h2>
          {kind === 'users' ? (
            <dl>
              <dt>Email</dt>
              <dd>{item.email}</dd>
              <dt>Phone</dt>
              <dd>{item.phone || 'Not provided'}</dd>
              <dt>Role</dt>
              <dd>{item.roleLabel}</dd>
            </dl>
          ) : (
            <>
              <p className="h4 text-primary my-3">{format(item.price, 'price')} / month</p>
              <p>{item.status}</p>
              <p className="description">{item.description}</p>
              {user.role === 'ADMIN' && (
                <>
                  <form onSubmit={assign}>
                    <label htmlFor="manager" className="form-label">
                      Assign property manager
                    </label>
                    <select
                      id="manager"
                      name="manager"
                      defaultValue={item.manager || ''}
                      className="form-select mb-3"
                    >
                      <option value="">Unassigned</option>
                      {state.data.managers.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.name} — {m.email}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-primary" disabled={busy}>
                      Save assignment
                    </button>
                    {message && (
                      <p className="mt-3" role="status">
                        {message}
                      </p>
                    )}
                  </form>
                  <form className="mt-4" onSubmit={assignBuilding}>
                    <label htmlFor="building" className="form-label">
                      Assign building
                    </label>
                    <select
                      id="building"
                      name="building"
                      defaultValue={item.building || ''}
                      className="form-select mb-3"
                    >
                      <option value="">Not assigned to a building</option>
                      {(state.data.buildings || []).map(b => (
                        <option key={b._id} value={b._id}>
                          {b.name} — {b.address}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-primary" disabled={busy}>
                      Save building
                    </button>
                  </form>
                </>
              )}
            </>
          )}
          <Link className="mt-4" to={'/' + kind}>
            Back to list
          </Link>
        </div>
      )}
    </>
  );
}
