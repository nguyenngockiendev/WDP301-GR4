import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData, Heading, Notice, format } from '../components/Common';
export default function Dashboard() {
  const state = useData('/dashboard'),
    { user } = useAuth();
  return (
    <>
      <Heading>Overview</Heading>
      <section className="welcome">
        <div>
          <span className="welcome-tag">YOUR WORKSPACE, AT A GLANCE</span>
          <h2>Welcome back, {user.name}.</h2>
          <p>A clear view of your properties, people and payments.</p>
          <Link
            className="btn btn-light mt-2"
            to={user.role === 'TENANT' ? '/workspace/contracts' : '/rooms'}
          >
            Explore your workspace ↗
          </Link>
        </div>
        <div className="house-art" aria-hidden="true">
          <div className="house-roof" />
          <div className="house-body">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="house-ground" />
        </div>
      </section>
      <Notice state={state} />
      {state.data && (
        <>
          <section className="stats-grid">
            {state.data.stats.map(stat => (
              <article className="stat-card" key={stat.label}>
                <div className="stat-top">{stat.label}</div>
                <div className="stat-value">
                  {stat.value.toLocaleString('en-US')}
                  {stat.money && <small>VND</small>}
                </div>
                <p>{stat.hint}</p>
              </article>
            ))}
          </section>
          <section className="card">
            <div className="panel-heading">
              <div>
                <h2>Recent invoices</h2>
                <p>Your latest billing activity</p>
              </div>
              <Link to="/workspace/invoices">View all ↗</Link>
            </div>
            {state.data.recent.length ? (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Period</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.data.recent.map(i => (
                      <tr key={i._id}>
                        <td>{i.code}</td>
                        <td>{i.period}</td>
                        <td>{format(i.total, 'total')}</td>
                        <td>{i.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <h3>No invoices yet</h3>
                <p>Your billing activity will appear here.</p>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
