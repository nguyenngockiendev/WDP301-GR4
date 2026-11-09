import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { UserPlus, UserMinus, UserCog, Building2 } from 'lucide-react';
import managersAPI from '../api/managers-api';
import propertiesAPI from '../../properties/api/properties-api';
import Modal, { btnPrimary, btnGhost, inputCls, labelCls } from '../../../shared/components/Modal';
import { formatDate } from '../../../shared/utils/format';
import ManagersPage from '../../landlord/ManagersPage';

const card = 'rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)]';

/** Trang chủ trọ (landlord) giao / gỡ quản lý (manager) cho từng nhà trọ. */
export default function ManageManagers() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [activeView, setActiveView] = useState('assignments');

  useEffect(() => {
    propertiesAPI
      .getMyProperties()
      .then(res => {
        const list = res.data || [];
        setProperties(list);
        const saved = localStorage.getItem('currentPropertyId');
        setPropertyId((list.find(p => p._id === saved) || list[0])?._id || '');
      })
      .catch(err => toast.error(err.response?.data?.message || 'Không tải được danh sách nhà trọ'));
  }, []);

  const fetchAssignments = async () => {
    if (!propertyId) return;
    try {
      setLoading(true);
      const res = await managersAPI.getAssignments({ property: propertyId });
      setAssignments(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi tải danh sách quản lý');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const handleRemove = async assignment => {
    if (!window.confirm(`Gỡ ${assignment.manager?.fullName || 'quản lý này'} khỏi nhà trọ?`)) return;
    try {
      await managersAPI.removeAssignment(assignment._id);
      toast.success('Đã gỡ quản lý khỏi nhà trọ');
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi gỡ quản lý');
    }
  };

  const currentProperty = properties.find(p => p._id === propertyId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pt-2">
      <div className="flex gap-2 border-b border-slate-200">
        <button type="button" onClick={() => setActiveView('assignments')} className={`border-b-2 px-4 py-3 text-sm font-bold ${activeView === 'assignments' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'}`}>
          Phân công theo tòa
        </button>
        <button type="button" onClick={() => setActiveView('accounts')} className={`border-b-2 px-4 py-3 text-sm font-bold ${activeView === 'accounts' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'}`}>
          Tài khoản quản lý
        </button>
      </div>
      {activeView === 'accounts' ? <ManagersPage accountsOnly /> : <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Quản lý viên</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Giao nhà trọ cho quản lý để họ lập hợp đồng, xử lý yêu cầu thuê và quản lý phòng
          </p>
        </div>
        <button
          onClick={() => setShowAssign(true)}
          disabled={!propertyId}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer self-start disabled:opacity-60"
        >
          <UserPlus size={16} /> Giao quản lý
        </button>
      </div>

      <div className={`${card} p-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
        <Building2 size={16} className="text-emerald-600 shrink-0" />
        <label className="text-xs font-bold text-slate-500 shrink-0">Nhà trọ</label>
        <select className={`${inputCls} sm:max-w-sm`} value={propertyId} onChange={e => setPropertyId(e.target.value)}>
          {properties.length === 0 && <option value="">Chưa có nhà trọ</option>}
          {properties.map(p => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        {currentProperty?.address && <p className="text-[11px] font-semibold text-slate-400 truncate">{currentProperty.address}</p>}
      </div>

      <div className={`${card} p-6`}>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-14 rounded-xl bg-slate-100/70 animate-pulse" />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-8 text-center">
            <UserCog size={28} className="mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-500 mt-2">Nhà trọ này chưa có quản lý nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignments.map(a => (
              <div key={a._id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">
                    {(a.manager?.fullName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{a.manager?.fullName || '—'}</p>
                    <p className="text-[11px] font-semibold text-slate-400 truncate">
                      {a.manager?.email} {a.manager?.phone ? `· ${a.manager.phone}` : ''} · Giao ngày {formatDate(a.assignedAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(a)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-bold transition cursor-pointer shrink-0"
                >
                  <UserMinus size={13} /> Gỡ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAssign && (
        <AssignManagerModal
          propertyId={propertyId}
          propertyName={currentProperty?.name}
          assignedIds={assignments.map(a => String(a.manager?._id))}
          onClose={() => setShowAssign(false)}
          onAssigned={() => {
            setShowAssign(false);
            fetchAssignments();
          }}
        />
      )}
      </>}
    </div>
  );
}

function AssignManagerModal({ propertyId, propertyName, assignedIds, onClose, onAssigned }) {
  const [managers, setManagers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      managersAPI
        .getAvailableManagers(keyword)
        .then(res => setManagers(res.data || []))
        .catch(err => toast.error(err.response?.data?.message || 'Không tải được danh sách quản lý'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const choices = useMemo(() => managers.filter(m => !assignedIds.includes(String(m._id))), [managers, assignedIds]);

  const handleAssign = async () => {
    if (!selected) {
      toast.error('Vui lòng chọn quản lý');
      return;
    }
    try {
      setSubmitting(true);
      await managersAPI.assignManager({ property: propertyId, manager: selected });
      toast.success('Giao quản lý nhà trọ thành công');
      onAssigned();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi giao quản lý');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Giao quản lý"
      subtitle={propertyName}
      onClose={onClose}
      disabled={submitting}
      footer={
        <>
          <button className={btnGhost} onClick={onClose} disabled={submitting}>Hủy</button>
          <button className={btnPrimary} onClick={handleAssign} disabled={submitting || !selected}>
            {submitting ? 'Đang giao...' : 'Giao quản lý'}
          </button>
        </>
      }
    >
      <label className={labelCls}>Tìm tài khoản quản lý</label>
      <input
        className={`${inputCls} mb-3`}
        placeholder="Tên, email hoặc SĐT..."
        value={keyword}
        onChange={e => setKeyword(e.target.value)}
      />
      <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
        {loading ? (
          <p className="px-3 py-3 text-xs font-semibold text-slate-400">Đang tải...</p>
        ) : choices.length === 0 ? (
          <p className="px-3 py-3 text-xs font-semibold text-slate-400">Không có tài khoản quản lý phù hợp</p>
        ) : (
          choices.map(m => (
            <label key={m._id} className="flex items-center gap-2.5 px-3 py-2.5 text-xs cursor-pointer hover:bg-emerald-50/50">
              <input
                type="radio"
                name="manager"
                className="accent-emerald-600"
                checked={selected === m._id}
                onChange={() => setSelected(m._id)}
              />
              <span className="font-bold text-slate-700">{m.fullName}</span>
              <span className="text-slate-400 truncate">{m.email}</span>
            </label>
          ))
        )}
      </div>
    </Modal>
  );
}
