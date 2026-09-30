import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData, Heading, Notice, format, StatusBadge } from '../components/Common';
import {
  IconBuilding,
  IconRoom,
  IconInvoice,
  IconTrendingUp,
  IconArrowRight,
  IconPlus,
  IconSparkles,
  IconReports,
} from '../components/Icons';

export default function Dashboard() {
  const state = useData('/dashboard');
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const statIcons = [IconBuilding, IconRoom, IconInvoice, IconTrendingUp];

  return (
    <div className="dashboard-page">
      <Heading
        eyebrow="PORTFOLIO DASHBOARD"
        subtitle={`Welcome back! Here is a summary of your properties and recent activities.`}
        action={
          user.role === 'LANDLORD' ? (
            <div className="d-flex gap-2">
              <Link to="/buildings/new" className="btn btn-outline-primary btn-sm">
                <IconPlus size={14} /> Add Building
              </Link>
              <Link to="/rooms/new" className="btn btn-primary btn-sm">
                <IconPlus size={14} /> Add Room
              </Link>
            </div>
          ) : null
        }
      >
        Dashboard
      </Heading>

      {/* Hero Welcome Banner */}
      <section className="welcome-banner">
        <div className="welcome-banner-content">
          <div className="welcome-badge">
            <IconSparkles size={14} />
            <span>{user.roleLabel || user.role} WORKSPACE</span>
          </div>
          <h2>
            {getGreeting()}, {user.name}.
          </h2>
          <p>
            Monitor real-time rental performance, review recent invoice items, and manage day-to-day
            room allocations.
          </p>
          <div className="welcome-actions">
            <Link
              className="btn btn-primary"
              to={user.role === 'TENANT' ? '/workspace/invoices' : '/rooms'}
            >
              <span>{user.role === 'TENANT' ? 'View My Invoices' : 'Manage Rooms'}</span>
              <IconArrowRight size={15} />
            </Link>
            {user.role === 'LANDLORD' && (
              <Link className="btn btn-light" to="/reports">
                <IconReports size={15} />
                <span>Business Reports</span>
              </Link>
            )}
          </div>
        </div>

        <div className="welcome-banner-graphic" aria-hidden="true">
          <div className="graphic-glow" />
          <div className="graphic-card mini-card-1">
            <IconBuilding size={20} className="text-emerald" />
            <div>
              <strong>Properties</strong>
              <small>Multi-unit Ready</small>
            </div>
          </div>
          <div className="graphic-card mini-card-2">
            <IconTrendingUp size={20} className="text-brand" />
            <div>
              <strong>Automated</strong>
              <small>Utility & Bills</small>
            </div>
          </div>
        </div>
      </section>

      <Notice state={state} />

      {state.data && (
        <>
          {/* Stats Grid */}
          <section className="stats-grid" aria-label="Key statistics">
            {state.data.stats.map((stat, idx) => {
              const IconComp = statIcons[idx % statIcons.length];
              return (
                <article className="stat-card" key={stat.label}>
                  <div className="stat-top">
                    <span className="stat-label">{stat.label}</span>
                    <div className="stat-icon-badge">
                      <IconComp size={18} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {stat.value.toLocaleString('en-US')}
                    {stat.money && <small className="stat-currency">VND</small>}
                  </div>
                  <div className="stat-bottom">
                    <span className="stat-hint">{stat.hint}</span>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Recent Invoices Card */}
          <section className="card table-card">
            <div className="panel-heading">
              <div>
                <h2>Recent Invoices</h2>
                <p>Latest billing statements generated across your workspace</p>
              </div>
              <Link to="/workspace/invoices" className="panel-heading-link">
                <span>View all invoices</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            {state.data.recent.length ? (
              <div className="table-responsive">
                <table className="table custom-table">
                  <thead>
                    <tr>
                      <th>Invoice Code</th>
                      <th>Billing Period</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.data.recent.map(i => (
                      <tr key={i._id}>
                        <td>
                          <span className="fw-semibold font-mono">{i.code}</span>
                        </td>
                        <td>{i.period}</td>
                        <td>
                          <strong className="text-dark">{format(i.total, 'total')}</strong>
                        </td>
                        <td>
                          <StatusBadge status={i.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <IconInvoice size={28} />
                </div>
                <h3>No invoices recorded yet</h3>
                <p>Billing activity and payment records will automatically appear here.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
