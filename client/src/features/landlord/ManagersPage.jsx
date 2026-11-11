import { useCallback, useEffect, useState } from 'react';
import { Eye, UserPlus, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../shared/api/axiosClient';
import Modal, { btnGhost, btnPrimary, inputCls, labelCls } from '../../shared/components/Modal';

const cardClass =
  'rounded-3xl border border-white/90 bg-white/85 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-md';
const roleLabels = { landlord: 'Chủ trọ', manager: 'Quản lý viên', tenant: 'Người thuê' };

function getError(error, fallback) {
  return error.response?.data?.message || fallback;
}

export default function ManagersPage({ accountsOnly = false }) {
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [managerId, setManagerId] = useState('');
  const [detailUser, setDetailUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [busyUserId, setBusyUserId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [userResponse, managerResponse, propertyResponse, assignmentResponse] = await Promise.all([
        api.get('/landlord/users'),
        api.get('/landlord/managers'),
        api.get('/landlord/properties'),
        api.get('/landlord/assignments'),
      ]);
      setUsers(userResponse.data || []);
      setManagers(managerResponse.data || []);
      setProperties(propertyResponse.data || []);
      setAssignments(assignmentResponse.data || []);
    } catch (error) {
      toast.error(getError(error, 'Không tải được dữ liệu quản lý.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createManager(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setBusy(true);
    try {
      await api.post('/landlord/managers', values);
      form.reset();
      toast.success('Đã tạo tài khoản quản lý.');
      await load();
    } catch (error) {
      toast.error(getError(error, 'Tạo tài khoản thất bại.'));
    } finally {
      setBusy(false);
    }
  }

  async function promoteUser(user) {
    setBusyUserId(user._id);
    try {
      await api.patch(`/landlord/users/${user._id}/role`, { role: 'manager' });
      toast.success(`Đã nâng ${user.fullName} thành Quản lý viên.`);
      setDetailUser(current => current?._id === user._id ? { ...current, role: 'manager' } : current);
      await load();
    } catch (error) {
      toast.error(getError(error, 'Không thể đổi vai trò tài khoản.'));
    } finally {
      setBusyUserId('');
    }
  }

  async function assignManager(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post('/landlord/assignments', { managerId, propertyIds: selectedProperties });
      toast.success('Đã lưu phân công.');
      setSelectedProperties([]);
      await load();
    } catch (error) {
      toast.error(getError(error, 'Phân công thất bại.'));
    } finally {
      setBusy(false);
    }
  }

  async function removeAssignment(assignmentId) {
    try {
      await api.delete(`/landlord/assignments/${assignmentId}`);
      toast.success('Đã gỡ phân công.');
      await load();
    } catch (error) {
      toast.error(getError(error, 'Không gỡ được phân công.'));
    }
  }

  async function toggleManager(manager) {
    const status = manager.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/landlord/managers/${manager._id}/status`, { status });
      toast.success('Đã cập nhật trạng thái tài khoản.');
      await load();
    } catch (error) {
      toast.error(getError(error, 'Không cập nhật được tài khoản.'));
    }
  }

  function toggleProperty(propertyId) {
    setSelectedProperties(current => current[0] === propertyId ? [] : [propertyId]);
  }

  const assignedManagerIds = new Set(assignments.map(item => String(item.manager?._id || item.manager)));
  const activeManagers = managers.filter(manager => manager.status === 'active' && manager.isVerified && !assignedManagerIds.has(String(manager._id)));

  return (
    <main className="mx-auto max-w-7xl space-y-6 pt-2">
      <header>
        <h1 className="text-xl font-black tracking-tight text-slate-900">Quản lý viên</h1>
        <p className="mt-1 text-xs font-semibold text-slate-400">
          Tạo tài khoản quản lý, bổ nhiệm người thuê đã xác thực và phân công nhà trọ.
        </p>
      </header>

      <section className={`${cardClass} p-5`}>
        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Users size={20} /></span>
          <div>
            <h2 className="font-extrabold text-slate-800">Tài khoản ({users.length})</h2>
            <p className="mt-0.5 text-xs text-slate-500">Thông tin hồ sơ chỉ chủ tài khoản mới được chỉnh sửa.</p>
          </div>
        </div>
        {loading ? (
          <div role="status" className="space-y-2">
            {[1, 2, 3].map(item => <div key={item} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="p-3">Họ tên</th><th className="p-3">Username</th><th className="p-3">Email</th>
                  <th className="p-3">Vai trò</th><th className="p-3">Trạng thái</th><th className="p-3">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="border-b border-slate-100 last:border-0">
                    <td className="p-3 font-bold text-slate-700">{user.fullName}</td>
                    <td className="p-3 text-slate-600">@{user.username}</td>
                    <td className="p-3 text-slate-600">{user.email}</td>
                    <td className="p-3 text-slate-600">{roleLabels[user.role] || user.role}</td>
                    <td className="p-3">
                      <span className={user.status === 'active' ? 'text-emerald-700' : 'text-slate-500'}>
                        {user.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                      {!user.isVerified && <span className="ml-2 text-amber-700">· Chưa xác thực</span>}
                    </td>
                    <td className="p-3">
                      <button type="button" onClick={() => setDetailUser(user)} title="Xem chi tiết"
                        aria-label={`Xem chi tiết ${user.fullName}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!users.length && <tr><td colSpan="6" className="p-6 text-center text-sm text-slate-400">Chưa có tài khoản nào.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <form onSubmit={createManager} className={`${cardClass} grid gap-4 p-5 md:grid-cols-3`}>
        <div className="flex items-center gap-3 md:col-span-3">
          <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><UserPlus size={20} /></span>
          <div>
            <h2 className="font-extrabold text-slate-800">Tạo tài khoản quản lý</h2>
            <p className="mt-0.5 text-xs text-slate-500">Tài khoản sẽ được tạo với vai trò Quản lý viên.</p>
          </div>
        </div>
        <label><span className={labelCls}>Họ tên</span><input name="fullName" required minLength="2" className={inputCls} /></label>
        <label><span className={labelCls}>Username</span><input name="username" required minLength="2" className={inputCls} /></label>
        <label><span className={labelCls}>Email</span><input name="email" required type="email" className={inputCls} /></label>
        <label><span className={labelCls}>Số điện thoại</span><input name="phone" type="tel" className={inputCls} /></label>
        <label className="md:col-span-2"><span className={labelCls}>Mật khẩu tạm thời</span><input name="password" required type="password" minLength="8" className={inputCls} /></label>
        <button disabled={busy} className={`${btnPrimary} md:col-span-3`}>
          {busy ? 'Đang lưu…' : 'Tạo tài khoản'}
        </button>
      </form>

      <section className={`${cardClass} p-5`}>
        <h2 className="font-extrabold text-slate-800">Manager nghiệp vụ ({managers.length})</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {managers.map(manager => {
            const assignedProperties = assignments
              .filter(item => String(item.manager?._id || item.manager) === String(manager._id))
              .map(item => item.property?.name)
              .filter(Boolean);
            return (
              <article key={manager._id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <h3 className="font-bold text-slate-700">{manager.fullName} <span className="text-xs font-medium text-slate-400">@{manager.username}</span></h3>
                  <p className="mt-1 text-xs text-slate-500">{manager.email} · {manager.phone || 'Chưa có số điện thoại'}</p>
                  <p className="mt-1 text-xs text-emerald-700">{assignedProperties.join(' · ') || 'Chưa được phân công nhà trọ'}</p>
                  {!manager.isVerified && <p className="mt-1 text-xs text-amber-700">Chưa xác thực nên chưa thể phân công.</p>}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setDetailUser(users.find(user => user._id === manager._id) || manager)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                    aria-label={`Xem chi tiết ${manager.fullName}`} title="Xem chi tiết"><Eye size={16} /></button>
                  <button type="button" onClick={() => toggleManager(manager)} className={btnGhost}>
                    {manager.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  </button>
                </div>
              </article>
            );
          })}
          {!managers.length && <p className="py-5 text-sm text-slate-400">Chưa có tài khoản quản lý.</p>}
        </div>
      </section>

      {!accountsOnly && <form onSubmit={assignManager} className={`${cardClass} space-y-4 p-5`}>
        <div>
          <h2 className="font-extrabold text-slate-800">Phân công nhà trọ</h2>
          <p className="mt-1 text-xs text-slate-500">Mỗi quản lý viên chỉ phụ trách một nhà trọ. Gỡ phân công cũ trước khi chuyển sang nhà trọ khác.</p>
        </div>
        <select required value={managerId} onChange={event => setManagerId(event.target.value)} className={inputCls}>
          <option value="">Chọn quản lý viên</option>
          {activeManagers.map(manager => <option key={manager._id} value={manager._id}>{manager.fullName} · {manager.email}</option>)}
        </select>
        <div className="grid gap-2 sm:grid-cols-2">
          {properties.filter(property => property.status === 'active').map(property => (
            <label key={property._id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-3 text-sm transition hover:border-emerald-300">
              <input type="radio" name="assignedProperty" checked={selectedProperties.includes(property._id)} onChange={() => toggleProperty(property._id)} className="mt-0.5 accent-emerald-600" />
              <span><strong className="block text-slate-700">{property.name}</strong><span className="text-xs text-slate-500">{property.address}</span></span>
            </label>
          ))}
          {!properties.length && <p className="text-sm text-slate-400">Bạn cần tạo nhà trọ trước khi phân công.</p>}
        </div>
        <button disabled={busy || !managerId || selectedProperties.length === 0} className={btnPrimary}>
          {busy ? 'Đang lưu…' : 'Lưu phân công'}
        </button>
      </form>}

      {!accountsOnly && <section className={`${cardClass} p-5`}>
        <h2 className="font-extrabold text-slate-800">Phân công đang hoạt động</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {assignments.map(assignment => (
            <div key={assignment._id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="text-slate-600"><strong>{assignment.manager?.fullName || 'Quản lý'}</strong> → {assignment.property?.name || 'Nhà trọ'}</span>
              <button type="button" onClick={() => removeAssignment(assignment._id)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50">Gỡ</button>
            </div>
          ))}
          {!assignments.length && <p className="py-5 text-sm text-slate-400">Chưa có phân công.</p>}
        </div>
      </section>}

      {detailUser && (
        <Modal title="Chi tiết tài khoản" subtitle="Chủ trọ không thể sửa hồ sơ của người dùng khác."
          onClose={() => setDetailUser(null)} maxWidth="max-w-xl">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className={labelCls}>Họ tên</dt><dd className="font-semibold text-slate-700">{detailUser.fullName}</dd></div>
            <div><dt className={labelCls}>Username</dt><dd className="text-slate-700">@{detailUser.username}</dd></div>
            <div><dt className={labelCls}>Email</dt><dd className="break-all text-slate-700">{detailUser.email}</dd></div>
            <div><dt className={labelCls}>Số điện thoại</dt><dd className="text-slate-700">{detailUser.phone || 'Chưa cập nhật'}</dd></div>
            <div><dt className={labelCls}>Vai trò</dt><dd className="text-slate-700">{roleLabels[detailUser.role] || detailUser.role}</dd></div>
            <div><dt className={labelCls}>Trạng thái</dt><dd className="text-slate-700">{detailUser.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'} · {detailUser.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}</dd></div>
            <div className="sm:col-span-2"><dt className={labelCls}>Ngày tạo</dt><dd className="text-slate-700">{detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleString('vi-VN') : '—'}</dd></div>
          </dl>
          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
            {detailUser.role === 'tenant' && (
              <button type="button" disabled={!detailUser.isVerified || detailUser.status !== 'active' || busyUserId === detailUser._id}
                onClick={() => promoteUser(detailUser)} className={btnPrimary}>
                {busyUserId === detailUser._id ? 'Đang cập nhật…' : 'Nâng lên Quản lý'}
              </button>
            )}
            {detailUser.role === 'landlord' && <p className="text-xs text-slate-500">Đây là tài khoản Chủ trọ duy nhất.</p>}
          </div>
        </Modal>
      )}
    </main>
  );
}
