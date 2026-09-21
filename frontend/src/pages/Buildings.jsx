import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, send } from '../services/api';
import { Heading, Notice, Pager, Field, useData } from '../components/Common';

export function BuildingsList() {
  const [page, setPage] = useState(1);
  const state = useData('/buildings?page=' + page);
  return (
    <>
      <Heading>Buildings</Heading>
      <Link className="btn btn-primary mb-4" to="/buildings/new">
        + Add building
      </Link>
      <Notice state={state} />
      {state.data && (
        <>
          <section className="card table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.data.items.map(item => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.address}</td>
                    <td>{item.status}</td>
                    <td>
                      <Link to={'/buildings/' + item._id}>Manage →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!state.data.items.length && (
              <div className="empty-state">
                <h3>No buildings yet</h3>
                <p>Create a building before assigning rooms to it.</p>
              </div>
            )}
          </section>
          <Pager page={page} total={state.data.total} setPage={setPage} />
        </>
      )}
    </>
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
  if (id && !item)
    return (
      <>
        <Heading>Edit building</Heading>
        <Notice state={state} />
      </>
    );
  return (
    <>
      <Heading>{id ? 'Edit building' : 'Add building'}</Heading>
      <div className="card form-card p-4">
        {error && (
          <p role="alert" className="alert alert-danger">
            {error}
          </p>
        )}
        <form onSubmit={submit}>
          <Field
            name="name"
            label="Building name"
            minLength="2"
            maxLength="200"
            defaultValue={item?.name}
          />
          <Field
            name="address"
            label="Address"
            minLength="2"
            maxLength="200"
            defaultValue={item?.address}
          />
          <label className="form-label" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="form-select mb-4"
            defaultValue={item?.status || 'ACTIVE'}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>{' '}
          <Link className="btn btn-light" to="/buildings">
            Cancel
          </Link>
        </form>
      </div>
    </>
  );
}

export function BuildingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const state = useData('/buildings/' + id);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const item = state.data?.item;
  async function remove() {
    if (!window.confirm('Delete this building? Rooms must be moved first.')) return;
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
    <>
      <Heading>Building details</Heading>
      <Notice state={state} />
      {item && (
        <div className="card form-card p-4">
          <h2 className="h4">{item.name}</h2>
          <dl>
            <dt>Address</dt>
            <dd>{item.address}</dd>
            <dt>Status</dt>
            <dd>{item.status}</dd>
          </dl>
          {error && (
            <p role="alert" className="alert alert-danger">
              {error}
            </p>
          )}
          <Link className="btn btn-primary me-2" to={'/buildings/' + id + '/edit'}>
            Edit
          </Link>
          <button className="btn btn-outline-danger" onClick={remove} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete'}
          </button>
          <br />
          <Link className="d-inline-block mt-4" to="/buildings">
            Back to list
          </Link>
        </div>
      )}
    </>
  );
}
