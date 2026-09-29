import React from 'react';
import { Heading, Notice, useData } from '../components/Common';

const money = value => value.toLocaleString('en-US') + ' VND';

export default function Reports() {
  const state = useData('/reports');
  const report = state.data;
  return (
    <>
      <Heading>Business reports</Heading>
      <Notice state={state} />
      {report && (
        <>
          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-top">Outstanding balance report</div>
              <div className="stat-value">{money(report.outstandingBalance)}</div>
              <p>Issued invoices not yet collected</p>
            </article>
            <article className="stat-card">
              <div className="stat-top">Revenue report</div>
              <div className="stat-value">{money(report.revenue)}</div>
              <p>Payments recorded from issued invoices</p>
            </article>
            <article className="stat-card">
              <div className="stat-top">Occupancy report</div>
              <div className="stat-value">
                {report.occupancy.total
                  ? Math.round((report.occupancy.occupied / report.occupancy.total) * 100)
                  : 0}
                <small>%</small>
              </div>
              <p>
                {report.occupancy.occupied} occupied of {report.occupancy.total} rooms
              </p>
            </article>
          </section>
          <section className="card form-card p-4">
            <h2 className="h4">Room status</h2>
            <dl>
              <dt>Occupied</dt>
              <dd>{report.occupancy.occupied}</dd>
              <dt>Vacant</dt>
              <dd>{report.occupancy.vacant}</dd>
              <dt>Maintenance</dt>
              <dd>{report.occupancy.maintenance}</dd>
            </dl>
          </section>
        </>
      )}
    </>
  );
}
