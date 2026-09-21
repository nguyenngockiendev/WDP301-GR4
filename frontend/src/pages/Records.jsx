import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData, Heading, Notice, Pager, format } from '../components/Common';
export default function Records() {
  const { module } = useParams();
  return <RecordsPage key={module} module={module} />;
}
function RecordsPage({ module }) {
  const [page, setPage] = useState(1),
    state = useData('/workspace/' + module + '?page=' + page);
  return (
    <>
      <Heading>{state.data?.config.title || 'Workspace'}</Heading>
      <Notice state={state} />
      {state.data && (
        <>
          <p>{state.data.config.description}</p>
          <div className="view-notice">
            <strong>View-only workspace</strong>
            <span>
              Creating, approving and processing records in this module is not available yet.
            </span>
          </div>
          <section className="card table-responsive">
            <table className="table">
              <thead>
                <tr>
                  {state.data.config.fields.map(f => (
                    <th key={f}>
                      {f.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.data.items.map(item => (
                  <tr key={item._id}>
                    {state.data.config.fields.map(f => (
                      <td key={f}>{format(item[f], f)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!state.data.items.length && (
              <div className="empty-state">
                <h2>No records yet</h2>
                <p>Records available to your account will appear here.</p>
              </div>
            )}
          </section>
          <Pager page={page} total={state.data.total} size={15} setPage={setPage} />
        </>
      )}
    </>
  );
}
