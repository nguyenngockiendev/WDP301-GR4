import React, { useState } from 'react';
import { api } from '../../../shared/api/api';
import { Heading, Notice, Pager, useData } from '../../../shared/components/Common';
import { IconBell, IconCheck } from '../../../shared/components/Icons';

export default function Notifications() {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const state = useData(`/notifications?page=${page}&v=${revision}`);
  const items = state.data?.items || [];

  async function markRead(id) {
    setError('');
    try {
      await api(`/notifications/${id}/read`, { method: 'PATCH' });
      setRevision(value => value + 1);
    } catch (e) {
      setError(e.message);
    }
  }

  async function markAllRead() {
    setError('');
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      setRevision(value => value + 1);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="notification-page">
      <Heading
        eyebrow="TIN CẬP NHẬT"
        subtitle="Thông báo hợp đồng, hóa đơn và hoạt động liên quan đến tài khoản của bạn."
        action={state.data?.unread > 0 && <button className="btn btn-outline-primary btn-sm" onClick={markAllRead}>Đánh dấu tất cả đã đọc</button>}
      >
        Thông báo
      </Heading>
      {error && <div role="alert" className="alert alert-danger">{error}</div>}
      <Notice state={state} />
      {state.data && (
        <>
          <div className="small text-muted mb-3">{state.data.unread} thông báo chưa đọc</div>
          <section className="card p-2 p-md-3">
            {!items.length ? (
              <div className="empty-state"><div className="empty-icon"><IconBell size={30} /></div><h3>Chưa có thông báo</h3><p>Các cập nhật liên quan sẽ xuất hiện tại đây.</p></div>
            ) : items.map(item => (
              <article key={item._id} className="d-flex align-items-start gap-3 border-bottom p-3">
                <span className={`rounded-circle p-2 ${item.readAt ? 'bg-light text-secondary' : 'bg-success-subtle text-success'}`}><IconBell size={17} /></span>
                <div className="flex-grow-1">
                  <div className="d-flex flex-wrap align-items-center gap-2"><strong>{item.title}</strong>{!item.readAt && <span className="badge text-bg-success">Mới</span>}</div>
                  <p className="mb-1 mt-1 text-secondary small">{item.body || item.content}</p>
                  <time className="small text-muted">{new Date(item.createdAt).toLocaleString('vi-VN')}</time>
                </div>
                {!item.readAt && <button className="btn btn-sm btn-light" title="Đánh dấu đã đọc" onClick={() => markRead(item._id)}><IconCheck size={16} /></button>}
              </article>
            ))}
          </section>
          <Pager page={page} total={state.data.total} size={15} setPage={setPage} />
        </>
      )}
    </div>
  );
}
