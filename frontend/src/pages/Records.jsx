import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData, Heading, Notice, Pager, format } from '../components/Common';
import { IconSearch, IconSparkles, IconShieldCheck, IconContract } from '../components/Icons';

export default function Records() {
  const { module } = useParams();
  return <RecordsPage key={module} module={module} />;
}

function RecordsPage({ module }) {
  const [page, setPage] = useState(1);
  const [filterQuery, setFilterQuery] = useState('');
  const state = useData('/workspace/' + module + '?page=' + page);

  const items = state.data?.items || [];
  const fields = state.data?.config?.fields || [];

  const filteredItems = filterQuery
    ? items.filter(item => {
        return fields.some(f => {
          const val = item[f];
          return val != null && String(val).toLowerCase().includes(filterQuery.toLowerCase());
        });
      })
    : items;

  return (
    <div className="records-page">
      <Heading
        eyebrow="WORKSPACE RECORDS"
        subtitle={state.data?.config?.description || 'Browse records in this workspace module.'}
      >
        {state.data?.config?.title || 'Records'}
      </Heading>

      <Notice state={state} />

      {state.data && (
        <>
          {/* View Notice */}
          <div className="view-notice-banner mb-3 d-flex align-items-center gap-3 p-3 rounded-3">
            <div className="view-notice-icon">
              <IconShieldCheck size={20} />
            </div>
            <div>
              <strong className="d-block text-dark">Enterprise View-Only Workspace</strong>
              <span className="text-muted small">
                Data records are synchronized in read-only mode for audit compliance. Creating and
                modifying entries for this module is restricted.
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="table-filter-bar mb-3">
            <div className="search-input-wrapper">
              <IconSearch size={16} className="search-icon" />
              <input
                type="text"
                className="form-control table-search-input"
                placeholder={`Search records in ${state.data.config.title}...`}
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
                    {fields.map(f => (
                      <th key={f}>
                        {f.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item._id}>
                      {fields.map(f => (
                        <td key={f}>{format(item[f], f)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!filteredItems.length && (
              <div className="empty-state">
                <div className="empty-icon">
                  <IconContract size={32} />
                </div>
                <h3>{filterQuery ? 'No matching records' : 'No records yet'}</h3>
                <p>
                  {filterQuery
                    ? 'Try adjusting your search criteria.'
                    : 'Records available to your account role will automatically appear in this view.'}
                </p>
              </div>
            )}
          </section>

          <Pager page={page} total={state.data.total} size={15} setPage={setPage} />
        </>
      )}
    </div>
  );
}
