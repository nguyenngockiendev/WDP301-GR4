import { useEffect, useState } from 'react';
import { Eye, X } from 'lucide-react';
import api from '../../shared/api/axiosClient';

const roleLabels = { landlord: 'Chủ trọ', manager: 'Quản lý viên (Manager)', tenant: 'Người thuê' };

export default function ManagersPage() {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState([]);
  const [managerId, setManagerId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busyUserId, setBusyUserId] = useState('');
  const [detailUser, setDetailUser] = useState(null);

  async function load() {
    try {
      const [u, m, p, a] = await Promise.all([
        api.get('/landlord/users'),
        api.get('/landlord/managers'),
        api.get('/landlord/properties'),
        api.get('/landlord/assignments'),
      ]);
      setUsers(u.data || []);
      setManagers(m.data || []);
      setProperties(p.data || []);
      setAssignments(a.data || []);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Không tải được dữ liệu quản lý.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      await api.post('/landlord/managers', values);
      form.reset();
      setNotice('Đã tạo tài khoản quản lý.');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Tạo tài khoản thất bại.');
    }
  }

  async function promote(user) {
    setError('');
    setNotice('');
    setBusyUserId(user._id);
    try {
      await api.patch(`/landlord/users/${user._id}/role`, { role: 'manager' });
      setNotice(`Đã nâng ${user.fullName} thành Quản lý viên. Hãy phân công nhà trọ bên dưới.`);
      setDetailUser(current => current?._id === user._id ? { ...current, role: 'manager' } : current);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Không thể đổi vai trò tài khoản.');
    } finally {
      setBusyUserId('');
    }
  }

  async function assign(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      await api.post('/landlord/assignments', { managerId, propertyIds: selected });
      setNotice('Đã lưu phân công.');
      setSelected([]);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Phân công thất bại.');
    }
  }

  async function remove(assignmentId) {
    try {
      await api.delete(`/landlord/assignments/${assignmentId}`);
      setNotice('Đã gỡ phân công.');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Không gỡ được phân công.');
    }
  }

  async function toggle(manager) {
    const status = manager.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/landlord/managers/${manager._id}/status`, { status });
      setNotice('Đã cập nhật trạng thái tài khoản.');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Không cập nhật được tài khoản.');
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 py-6">
      <header>
        <h1 className="text-2xl font-black text-slate-800">Quản lý viên</h1>
        <p className="text-sm text-slate-500">
          Quản lý các manager nghiệp vụ, phân công họ vào nhà trọ và chọn người thuê đủ điều kiện để bổ nhiệm.
        </p>
      </header>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-bold">Danh sách tài khoản ({users.length})</h2>
          <p className="mt-1 text-sm text-slate-500">Danh sách này dùng để xem chi tiết hoặc bổ nhiệm người thuê đã xác thực thành manager nghiệp vụ.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b text-xs text-slate-500">
              <tr><th className="p-3">Họ tên</th><th className="p-3">Username</th><th className="p-3">Email</th><th className="p-3">Vai trò</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th></tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className="border-b last:border-0">
                  <td className="p-3 font-semibold">{user.fullName}</td>
                  <td className="p-3">@{user.username}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{roleLabels[user.role] || user.role}</td>
                  <td className="p-3">
                    <span>{user.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}</span>
                    {!user.isVerified && <span className="ml-2 text-amber-700">· Chưa xác thực</span>}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      aria-label={`Xem chi tiết ${user.fullName}`}
                      title="Xem chi tiết"
                      onClick={() => setDetailUser(user)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <Eye size={17} />
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan="6" className="p-5 text-center text-slate-500">Chưa có tài khoản nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <form onSubmit={create} className="grid gap-3 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-3">
        <h2 className="font-bold md:col-span-3">Tạo tài khoản quản lý mới</h2>
        <input name="fullName" required minLength="2" placeholder="Họ tên" className="rounded-xl border p-3" />
        <input name="username" required minLength="2" placeholder="Username" className="rounded-xl border p-3" />
        <input name="email" required type="email" placeholder="Email" className="rounded-xl border p-3" />
        <input name="phone" placeholder="Số điện thoại" className="rounded-xl border p-3" />
        <input name="password" required type="password" minLength="8" placeholder="Mật khẩu tạm thời (8+ ký tự)" className="rounded-xl border p-3 md:col-span-2" />
        <button className="rounded-xl bg-emerald-600 p-3 font-bold text-white md:col-span-3">Tạo tài khoản</button>
      </form>

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">Manager nghiệp vụ ({managers.length})</h2>
        {managers.map(manager => (
          <div key={manager._id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0">
            <div>
              <p className="font-semibold">{manager.fullName} <span className="text-xs text-slate-400">@{manager.username}</span></p>
              <p className="text-sm text-slate-500">{manager.email} · {manager.phone || 'Chưa có số điện thoại'}</p>
              {manager.isVerified === false && <p className="mt-1 text-xs text-amber-700">Chưa xác thực tài khoản; chưa thể phân công.</p>}
              <p className="mt-1 text-xs text-emerald-700">
                {assignments.filter(assignment => String(assignment.manager?._id || assignment.manager) === String(manager._id)).map(assignment => assignment.property?.name).filter(Boolean).join(' · ') || 'Chưa được phân công nhà trọ'}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDetailUser(users.find(user => user._id === manager._id) || manager)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-slate-600 hover:bg-emerald-50" aria-label={`Xem chi tiết ${manager.fullName}`} title="Xem chi tiết"><Eye size={17} /></button>
              <button type="button" onClick={() => toggle(manager)} className="rounded-lg border px-3 py-2 text-sm">{manager.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}</button>
            </div>
          </div>
        ))}
        {!managers.length && <p className="text-sm text-slate-500">Chưa có tài khoản quản lý.</p>}
      </section>

      <form onSubmit={assign} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">Phân công nhà trọ</h2>
        <select required value={managerId} onChange={event => setManagerId(event.target.value)} className="w-full rounded-xl border p-3">
          <option value="">Chọn quản lý viên</option>
          {managers.filter(manager => manager.status === 'active' && manager.isVerified !== false).map(manager => <option key={manager._id} value={manager._id}>{manager.fullName} · {manager.email}</option>)}
        </select>
        <div className="grid gap-2 sm:grid-cols-2">
          {properties.filter(property => property.status === 'active').map(property => (
            <label key={property._id} className="flex items-center gap-2 rounded-xl border p-3">
              <input type="checkbox" checked={selected.includes(property._id)} onChange={event => setSelected(event.target.checked ? [...selected, property._id] : selected.filter(id => id !== property._id))} />
              <span>{property.name} — {property.address}</span>
            </label>
          ))}
        </div>
        <button disabled={!managerId || selected.length === 0} className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-50">Lưu phân công</button>
      </form>

      <section className="space-y-2 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">Phân công đang hoạt động</h2>
        {assignments.map(assignment => (
          <div key={assignment._id} className="flex items-center justify-between gap-3 border-b py-3 text-sm last:border-0">
            <span>{assignment.manager?.fullName || 'Quản lý'} → {assignment.property?.name || 'Nhà trọ'}</span>
            <button type="button" onClick={() => remove(assignment._id)} className="rounded-lg border px-3 py-2 text-rose-700">Gỡ</button>
          </div>
        ))}
        {!assignments.length && <p className="text-sm text-slate-500">Chưa có phân công.</p>}
      </section>

      {detailUser && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/40 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setDetailUser(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="account-detail-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="account-detail-title" className="text-xl font-black text-slate-800">Chi tiết tài khoản</h2>
                <p className="mt-1 text-sm text-slate-500">Thông tin hồ sơ chỉ chủ tài khoản mới được chỉnh sửa.</p>
              </div>
              <button type="button" onClick={() => setDetailUser(null)} aria-label="Đóng chi tiết" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
                <div><dt className="text-xs text-slate-500">Họ tên</dt><dd className="mt-1 font-semibold">{detailUser.fullName}</dd></div>
                <div><dt className="text-xs text-slate-500">Username</dt><dd className="mt-1">@{detailUser.username}</dd></div>
                <div><dt className="text-xs text-slate-500">Email</dt><dd className="mt-1 break-all">{detailUser.email}</dd></div>
                <div><dt className="text-xs text-slate-500">Số điện thoại</dt><dd className="mt-1">{detailUser.phone || 'Chưa cập nhật'}</dd></div>
                <div><dt className="text-xs text-slate-500">Vai trò</dt><dd className="mt-1">{roleLabels[detailUser.role] || detailUser.role}</dd></div>
                <div><dt className="text-xs text-slate-500">Trạng thái</dt><dd className="mt-1">{detailUser.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'} · {detailUser.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}</dd></div>
                <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Ngày tạo</dt><dd className="mt-1">{detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleString('vi-VN') : '—'}</dd></div>
            </dl>
            {detailUser.role !== 'landlord' && (
              <div className="mt-6 flex flex-wrap justify-end gap-2 border-t pt-4">
                {detailUser.role === 'tenant' && (
                  <button
                    type="button"
                    disabled={!detailUser.isVerified || detailUser.status !== 'active' || busyUserId === detailUser._id}
                    onClick={() => promote(detailUser)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busyUserId === detailUser._id ? 'Đang cập nhật…' : 'Nâng lên Quản lý'}
                  </button>
                )}
              </div>
            )}
            {detailUser.role === 'landlord' && <p className="mt-5 border-t pt-4 text-sm text-slate-500">Đây là tài khoản Chủ trọ duy nhất.</p>}
          </section>
        </div>
      )}
    </main>
  );
}
