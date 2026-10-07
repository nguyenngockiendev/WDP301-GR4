import React from 'react';
import { Heading, Notice, useData } from '../components/Common';
import {
  IconTrendingUp,
  IconInvoice,
  IconRoom,
  IconSparkles,
  IconShieldCheck,
} from '../components/Icons';

const money = value => (value || 0).toLocaleString('en-US') + ' VND';

const reportViews = {
  revenue: {
    eyebrow: 'REVENUE REPORT',
    title: 'Revenue Report',
    subtitle: 'Collected payments and current financial performance.',
  },
  outstanding: {
    eyebrow: 'OUTSTANDING BALANCE REPORT',
    title: 'Outstanding Balance Report',
    subtitle: 'Issued invoices, receivables and collection progress.',
  },
  occupancy: {
    eyebrow: 'OCCUPANCY REPORT',
    title: 'Occupancy Report',
    subtitle: 'Room allocation and vacancy across your properties.',
  },
};

export default function Reports({ type = 'revenue' }) {
  const state = useData('/reports');
  const report = state.data;
  const view = reportViews[type] || reportViews.revenue;

  const totalRooms = report?.occupancy?.total || 0;
  const occupiedRooms = report?.occupancy?.occupied || 0;
  const vacantRooms = report?.occupancy?.vacant || 0;
  const maintenanceRooms = report?.occupancy?.maintenance || 0;

  const occupiedPct = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const vacantPct = totalRooms ? Math.round((vacantRooms / totalRooms) * 100) : 0;
  const maintenancePct = totalRooms ? Math.round((maintenanceRooms / totalRooms) * 100) : 0;

  return (
    <div className="reports-page">
      <Heading eyebrow={view.eyebrow} subtitle={view.subtitle}>
        {view.title}
      </Heading>

      <Notice state={state} />

      {report && (
        <>
          {/* Main KPI Stats */}
          <section className="stats-grid mb-4" aria-label="Financial indicators">
            <article className={`stat-card ${type === 'outstanding' ? '' : 'd-none'}`}>
              <div className="stat-top">
                <span className="stat-label">Outstanding Receivables</span>
                <div className="stat-icon-badge text-warning bg-warning-soft">
                  <IconInvoice size={18} />
                </div>
              </div>
              <div className="stat-value text-dark">{money(report.outstandingBalance)}</div>
              <div className="stat-bottom">
                <span className="stat-hint">Issued invoices not yet settled</span>
              </div>
            </article>

            <article className={`stat-card ${type === 'revenue' ? '' : 'd-none'}`}>
              <div className="stat-top">
                <span className="stat-label">Total Realized Revenue</span>
                <div className="stat-icon-badge text-emerald bg-emerald-soft">
                  <IconTrendingUp size={18} />
                </div>
              </div>
              <div className="stat-value text-emerald">{money(report.revenue)}</div>
              <div className="stat-bottom">
                <span className="stat-hint">Payments verified in current fiscal period</span>
              </div>
            </article>

            <article className={`stat-card ${type === 'occupancy' ? '' : 'd-none'}`}>
              <div className="stat-top">
                <span className="stat-label">Average Occupancy Rate</span>
                <div className="stat-icon-badge text-primary bg-primary-soft">
                  <IconRoom size={18} />
                </div>
              </div>
              <div className="stat-value">
                {occupiedPct}
                <small className="stat-currency">%</small>
              </div>
              <div className="stat-bottom">
                <span className="stat-hint">
                  {occupiedRooms} of {totalRooms} rooms active
                </span>
              </div>
            </article>
          </section>

          {/* Occupancy Visual Progress & Breakdown */}
          <section className={`row g-4 ${type === 'occupancy' ? '' : 'd-none'}`}>
            <div className="col-lg-7">
              <div className="card p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h2 className="h5 mb-1">Room Allocation Distribution</h2>
                    <p className="text-muted small mb-0">
                      Live status breakdown across all properties ({totalRooms} total units)
                    </p>
                  </div>
                  <span className="badge bg-light text-dark border px-3 py-2">
                    {totalRooms} Total Units
                  </span>
                </div>

                {/* Multi-segment progress bar */}
                <div className="occupancy-progress-bar mb-4" role="progressbar">
                  <div
                    className="progress-segment segment-occupied"
                    style={{ width: `${occupiedPct}%` }}
                    title={`Occupied: ${occupiedRooms} (${occupiedPct}%)`}
                  />
                  <div
                    className="progress-segment segment-vacant"
                    style={{ width: `${vacantPct}%` }}
                    title={`Vacant: ${vacantRooms} (${vacantPct}%)`}
                  />
                  <div
                    className="progress-segment segment-maintenance"
                    style={{ width: `${maintenancePct}%` }}
                    title={`Maintenance: ${maintenanceRooms} (${maintenancePct}%)`}
                  />
                </div>

                {/* Legend list */}
                <div className="row g-3">
                  <div className="col-sm-4">
                    <div className="status-stat-pill status-pill-success">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="legend-dot bg-success" />
                        <span className="small fw-semibold">Occupied</span>
                      </div>
                      <div className="h4 mb-0 text-success">{occupiedRooms}</div>
                      <small className="text-muted">{occupiedPct}% of total</small>
                    </div>
                  </div>

                  <div className="col-sm-4">
                    <div className="status-stat-pill status-pill-info">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="legend-dot bg-info" />
                        <span className="small fw-semibold">Vacant</span>
                      </div>
                      <div className="h4 mb-0 text-info">{vacantRooms}</div>
                      <small className="text-muted">{vacantPct}% ready to rent</small>
                    </div>
                  </div>

                  <div className="col-sm-4">
                    <div className="status-stat-pill status-pill-warning">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="legend-dot bg-warning" />
                        <span className="small fw-semibold">Maintenance</span>
                      </div>
                      <div className="h4 mb-0 text-warning">{maintenanceRooms}</div>
                      <small className="text-muted">{maintenancePct}% offline</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card p-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <IconSparkles size={18} className="text-emerald" />
                  <h2 className="h5 mb-0">Portfolio Health Summary</h2>
                </div>
                <p className="text-muted small">
                  Automated financial ratio review based on recent invoices and collection rates.
                </p>

                <div className="health-check-list mt-3">
                  <div className="health-item d-flex align-items-center justify-content-between p-2 rounded bg-light mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <IconShieldCheck size={16} className="text-emerald" />
                      <span className="small fw-semibold">Collection Ratio</span>
                    </div>
                    <span className="badge bg-success-soft text-success">
                      {report.revenue > 0 ? 'Healthy' : 'Pending Invoices'}
                    </span>
                  </div>

                  <div className="health-item d-flex align-items-center justify-content-between p-2 rounded bg-light mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <IconShieldCheck size={16} className="text-emerald" />
                      <span className="small fw-semibold">Occupancy Rate</span>
                    </div>
                    <span
                      className={`badge ${occupiedPct >= 80 ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}
                    >
                      {occupiedPct >= 80 ? 'Optimal (80%+)' : 'Rooms Available'}
                    </span>
                  </div>

                  <div className="health-item d-flex align-items-center justify-content-between p-2 rounded bg-light">
                    <div className="d-flex align-items-center gap-2">
                      <IconShieldCheck size={16} className="text-emerald" />
                      <span className="small fw-semibold">Audit Status</span>
                    </div>
                    <span className="badge bg-info-soft text-info">Up to Date</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
