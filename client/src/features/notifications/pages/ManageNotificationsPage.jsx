import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../shared/api/axiosClient';

export default function ManageNotificationsPage() {
  const [recipients, setRecipients] = useState([]);
  const [selected, setSelected] = useState('');
  const [audience, setAudience] = useState('individual');
  const [chosenIds, setChosenIds] = useState([]);
  const properties = [
    ...new Map(
      recipients.map(item => [item.propertyId, { id: item.propertyId, name: item.propertyName }]),
    ).values(),
  ];
  const selectedCount =
    audience === 'properties'
      ? new Set(
          recipients
            .filter(item => chosenIds.includes(item.propertyId))
            .map(item => item.recipientId),
        ).size
      : audience === 'property'
        ? recipients.filter(item => item.propertyId === selected).length
        : recipients.filter(item => `${item.propertyId}:${item.recipientId}` === selected).length;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [history, setHistory] = useState(null);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError('');
      setAllowed(false);
      try {
        const [people, sent] = await Promise.all([
          api.get('/notifications/recipients', { signal: controller.signal }),
          api.get('/notifications/sent', {
            params: { page, limit: 10 },
            signal: controller.signal,
          }),
        ]);
        if (controller.signal.aborted) return;
        setRecipients(people.data);
        setHistory(sent.data);
        setAllowed(true);
      } catch (error) {
        if (!controller.signal.aborted)
          setError(error.response?.data?.message || 'Không tải được dữ liệu. Vui lòng thử lại.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [page, revision]);

  const send = async event => {
    event.preventDefault();
    if (sending) return;
    const recipient = recipients.find(
      item => `${item.propertyId}:${item.recipientId}` === selected,
    );
    if (!selectedCount) return;
    if (
      audience !== 'individual' &&
      !window.confirm(
        `Gửi thông báo cho ${selectedCount} người nhận tại ${properties
          .filter(item =>
            audience === 'property' ? item.id === selected : chosenIds.includes(item.id),
          )
          .map(item => item.name)
          .join(', ')}?`,
      )
    )
      return;
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/notifications/send', {
        audience,
        propertyId:
          audience === 'properties'
            ? undefined
            : audience === 'property'
              ? selected
              : recipient.propertyId,
        propertyIds: audience === 'properties' ? chosenIds : undefined,
        recipientId: audience === 'individual' ? recipient.recipientId : undefined,
        title,
        content,
      });
      setSuccess(`Đã gửi thông báo cho ${response.data.sentCount || 1} người nhận.`);
      setTitle('');
      setContent('');
      setPage(1);
      setRevision(value => value + 1);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Chưa xác nhận được kết quả gửi. Hãy kiểm tra lịch sử trước khi gửi lại.',
      );
    } finally {
      setSending(false);
    }
  };

  const inputClass =
    'mt-2 w-full rounded-xl border border-surface-border bg-surface-card p-3 text-sm';
  return (
    <section className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">HAVEN STAY</p>
          <h1 className="mt-2 text-2xl font-bold">Quản lý thông báo</h1>
        </div>
        <Link to="/notifications" className="text-sm font-semibold text-primary">
          Thông báo của tôi
        </Link>
      </div>
      <p className="text-sm text-content-sub">
        Chủ trọ gửi cho quản lý được phân công. Quản lý gửi cho người thuê có hợp đồng còn hiệu lực
        trong các dãy được giao.
      </p>
      {error && (
        <p role="alert" className="rounded-xl border border-status-danger p-4 text-status-danger">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-xl bg-primary/10 p-4 text-primary">
          {success}
        </p>
      )}
      <button
        type="button"
        disabled={loading || sending}
        onClick={() => setRevision(value => value + 1)}
        className="text-sm font-semibold text-primary disabled:opacity-50"
      >
        Làm mới dữ liệu
      </button>
      {loading && <p role="status">Đang tải…</p>}
      {allowed && (
        <>
          <form
            onSubmit={send}
            className="space-y-4 rounded-2xl border border-surface-border bg-surface-card p-6 shadow-card"
          >
            <h2 className="font-bold">Soạn thông báo</h2>
            {!recipients.length && (
              <p className="text-sm text-content-sub">Chưa có người nhận đủ điều kiện.</p>
            )}
            <fieldset disabled={sending || loading} className="space-y-4 disabled:opacity-60">
              <label className="block text-sm font-semibold">
                Phạm vi gửi
                <select
                  value={audience}
                  onChange={event => {
                    setAudience(event.target.value);
                    setSelected('');
                  }}
                  className={inputClass}
                >
                  <option value="individual">Một người nhận</option>
                  <option value="property">Toàn bộ một dãy trọ</option>
                  <option value="properties">Chọn nhiều dãy trọ</option>
                </select>
              </label>
              {audience === 'properties' ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">
                    Chọn dãy trọ ({selectedCount} người nhận, đã loại trùng)
                  </p>
                  {properties.map(item => (
                    <label key={item.id} className="block text-sm">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={chosenIds.includes(item.id)}
                        onChange={event =>
                          setChosenIds(current =>
                            event.target.checked
                              ? [...current, item.id]
                              : current.filter(id => id !== item.id),
                          )
                        }
                      />
                      {item.name}
                    </label>
                  ))}
                </div>
              ) : (
                <label className="block text-sm font-semibold">
                  Người nhận
                  <select
                    required
                    value={selected}
                    onChange={event => setSelected(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Chọn nhà trọ / người nhận</option>
                    {audience === 'property'
                      ? properties.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))
                      : recipients.map(item => (
                          <option
                            key={`${item.propertyId}:${item.recipientId}`}
                            value={`${item.propertyId}:${item.recipientId}`}
                          >
                            {item.propertyName} / {item.roomNumber} — {item.fullName}
                          </option>
                        ))}
                  </select>
                </label>
              )}
              {audience === 'property' && (
                <p className="text-sm text-content-sub">
                  {selectedCount} người nhận. Với quản lý: người đại diện và thành viên ở cùng còn
                  hợp đồng hiệu lực, mỗi người nhận một lần. Chỉ liệt kê dãy có người nhận đủ điều
                  kiện.
                </p>
              )}
              <label className="block text-sm font-semibold">
                Tiêu đề
                <input
                  required
                  maxLength={200}
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-semibold">
                Nội dung
                <textarea
                  required
                  maxLength={5000}
                  rows={6}
                  value={content}
                  onChange={event => setContent(event.target.value)}
                  className={inputClass}
                />
              </label>
              <button
                disabled={!title.trim() || !content.trim() || !selectedCount}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {sending ? 'Đang gửi…' : 'Gửi thông báo'}
              </button>
            </fieldset>
          </form>
          <div className="rounded-2xl border border-surface-border bg-surface-card p-6">
            <h2 className="font-bold">Thông báo tôi đã gửi ({history?.total || 0})</h2>
            <p className="mt-2 text-sm text-content-sub">
              Trong phạm vi nhà trọ bạn hiện quản lý. Bấm Làm mới để cập nhật trạng thái đọc.
            </p>
            {!history?.items.length && <p className="mt-4">Chưa có thông báo đã gửi.</p>}
            <ul className="divide-y divide-surface-border">
              {history?.items.map(item => (
                <li key={item._id} className="space-y-2 py-4">
                  <p className="font-semibold break-words">{item.title}</p>
                  <p className="text-sm text-content-sub">
                    {item.recipient?.fullName || 'Tài khoản không còn tồn tại'} ·{' '}
                    {item.property?.name || 'Nhà trọ không còn tồn tại'} ·{' '}
                    {new Date(item.createdAt).toLocaleString('vi-VN')} ·{' '}
                    {item.isRead ? 'Đã đọc' : 'Chưa đọc'}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm">{item.content}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-4 text-sm">
              <button
                disabled={page <= 1 || loading || sending}
                onClick={() => setPage(value => value - 1)}
                className="text-primary disabled:opacity-40"
              >
                Trang trước
              </button>
              <span>
                Trang {page} / {Math.max(1, history?.totalPages || 0)}
              </span>
              <button
                disabled={page >= (history?.totalPages || 0) || loading || sending}
                onClick={() => setPage(value => value + 1)}
                className="text-primary disabled:opacity-40"
              >
                Trang sau
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
