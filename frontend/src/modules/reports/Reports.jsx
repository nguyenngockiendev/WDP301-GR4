import React from 'react';
import { Link } from 'react-router-dom';
import { Heading, Notice, useData } from '../../components/Common';

const money = value => `${(value || 0).toLocaleString('en-US')} VND`;
const views = {
  revenue: ['Revenue report', 'Track payments received across your portfolio.'],
  outstanding: ['Outstanding balance', 'See how much has been billed and remains unpaid.'],
  occupancy: ['Occupancy report', 'Understand how your rooms are being used.'],
};

function ReportTabs({ active }) {
  const tabs = [
    ['revenue', 'Revenue'],
    ['outstanding', 'Receivables'],
    ['occupancy', 'Occupancy'],
  ];
  return (
    <nav className="report-tabs" aria-label="Report type">
      {tabs.map(([key, label]) => (
        <Link
          key={key}
          to={`/reports/${key}`}
          className={`report-tab ${active === key ? 'active' : ''}`}
          aria-current={active === key ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Metric({ label, value, note, tone }) {
  return (
    <article className="report-metric">
      <span className={`report-metric-mark ${tone}`} />
      <div className="report-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

export default function Reports({ type = 'revenue' }) {
  const state = useData('/reports');
  const report = state.data;
  const active = views[type] ? type : 'revenue';
  const [title, subtitle] = views[active];
  const total = report?.occupancy?.total || 0;
  const occupied = report?.occupancy?.occupied || 0;
  const vacant = report?.occupancy?.vacant || 0;
  const maintenance = report?.occupancy?.maintenance || 0;
  const other = Math.max(0, total - occupied - vacant - maintenance);
  const occupancyRate = total ? Math.round((occupied / total) * 100) : 0;
  const billed = (report?.revenue || 0) + (report?.outstandingBalance || 0);
  const paidRate = billed ? Math.round((report.revenue / billed) * 100) : 0;
  const dueRate = billed ? 100 - paidRate : 0;
  const occupancyChart = `conic-gradient(#10b981 0 ${total ? (occupied / total) * 100 : 0}%, #0ea5e9 ${total ? (occupied / total) * 100 : 0}% ${total ? ((occupied + vacant) / total) * 100 : 0}%, #f59e0b ${total ? ((occupied + vacant) / total) * 100 : 0}% ${total ? ((occupied + vacant + maintenance) / total) * 100 : 0}%, #94a3b8 ${total ? ((occupied + vacant + maintenance) / total) * 100 : 0}% 100%)`;

  return (
    <div className="reports-page">
      <Heading
        eyebrow="PORTFOLIO ANALYTICS"
        subtitle={subtitle}
        action={<ReportTabs active={active} />}
      >
        {title}
      </Heading>
      <Notice state={state} />

      {report && (
        <>
          <section className="report-metrics" aria-label="Portfolio summary">
            <Metric
              label="Payments received"
              value={money(report.revenue)}
              note="Verified payments"
              tone="green"
            />
            <Metric
              label="Outstanding balance"
              value={money(report.outstandingBalance)}
              note="Still to be collected"
              tone="amber"
            />
            <Metric
              label="Room occupancy"
              value={`${occupancyRate}%`}
              note={`${occupied} of ${total} rooms occupied`}
              tone="blue"
            />
          </section>

          <section className="report-panels">
            {active === 'occupancy' ? (
              <article className="report-panel report-chart-panel">
                <div className="report-panel-heading">
                  <div>
                    <span className="report-kicker">ROOM STATUS</span>
                    <h2>Portfolio occupancy</h2>
                    <p>Current room count by status</p>
                  </div>
                  <span className="report-total-chip">{total} rooms</span>
                </div>
                <div className="occupancy-chart-layout">
                  <div
                    className="occupancy-donut"
                    style={{ background: occupancyChart }}
                    role="img"
                    aria-label={`${occupied} occupied, ${vacant} vacant, ${maintenance} under maintenance, ${other} other`}
                  >
                    <div className="occupancy-donut-center">
                      <strong>{occupancyRate}%</strong>
                      <span>occupied</span>
                    </div>
                  </div>
                  <div className="occupancy-legend">
                    {[
                      ['Occupied', occupied, 'green'],
                      ['Vacant', vacant, 'blue'],
                      ['Maintenance', maintenance, 'amber'],
                      ['Other', other, 'slate'],
                    ].map(([label, value, tone]) => (
                      <div className="occupancy-legend-row" key={label}>
                        <span className={`report-legend-dot ${tone}`} />
                        <span>{label}</span>
                        <strong>{value}</strong>
                        <small>{total ? Math.round((value / total) * 100) : 0}%</small>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="report-note">
                  The chart uses the current room statuses recorded in your properties.
                </div>
              </article>
            ) : (
              <article className="report-panel report-chart-panel">
                <div className="report-panel-heading">
                  <div>
                    <span className="report-kicker">BILLING OVERVIEW</span>
                    <h2>
                      {active === 'revenue' ? 'Collection progress' : 'Receivables breakdown'}
                    </h2>
                    <p>Paid amount compared with issued invoice balances</p>
                  </div>
                  <span className="report-total-chip">{money(billed)} billed</span>
                </div>
                <div className="collection-summary">
                  <div className="collection-summary-value">
                    <strong>{paidRate}%</strong>
                    <span>collected</span>
                  </div>
                  <div
                    className="collection-bar"
                    role="img"
                    aria-label={`${paidRate}% collected, ${dueRate}% outstanding`}
                  >
                    <span className="collection-bar-paid" style={{ width: `${paidRate}%` }} />
                    <span className="collection-bar-due" style={{ width: `${dueRate}%` }} />
                  </div>
                  <div className="collection-legend">
                    <div>
                      <span className="report-legend-dot green" />
                      <span>Received</span>
                      <strong>{money(report.revenue)}</strong>
                    </div>
                    <div>
                      <span className="report-legend-dot amber" />
                      <span>Outstanding</span>
                      <strong>{money(report.outstandingBalance)}</strong>
                    </div>
                  </div>
                </div>
                <div className="report-note">
                  Portfolio totals from issued invoices and verified payments.
                </div>
              </article>
            )}

            <aside className="report-panel report-insight-panel">
              <span className="report-kicker">PORTFOLIO SNAPSHOT</span>
              <h2>{active === 'occupancy' ? 'Room availability' : 'Collection health'}</h2>
              <p>
                {active === 'occupancy'
                  ? `${vacant} ${vacant === 1 ? 'room is' : 'rooms are'} currently vacant and ready to review.`
                  : `${money(report.outstandingBalance)} remains unpaid across issued invoices.`}
              </p>
              <div className="insight-divider" />
              <div className="insight-stat">
                <span>{active === 'occupancy' ? 'Under maintenance' : 'Collection rate'}</span>
                <strong>
                  {active === 'occupancy' ? maintenance : `${paidRate}%`}
                  {active === 'occupancy' && ' rooms'}
                </strong>
              </div>
              <div className="insight-stat">
                <span>{active === 'occupancy' ? 'Other statuses' : 'Total invoiced'}</span>
                <strong>{active === 'occupancy' ? other : money(billed)}</strong>
              </div>
              <Link
                className="report-insight-link"
                to={active === 'occupancy' ? '/buildings' : '/workspace/invoices'}
              >
                {active === 'occupancy' ? 'View properties' : 'Review invoices'}{' '}
                <span aria-hidden="true">→</span>
              </Link>
            </aside>
          </section>
        </>
      )}
    </div>
  );
}
