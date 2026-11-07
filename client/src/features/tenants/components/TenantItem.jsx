import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Mail, Phone, DoorOpen, Crown, Users } from 'lucide-react';
import Modal, { btnGhost } from '../../../shared/components/Modal';
import tenantsAPI from '../api/tenants-api';
import ContractStatusBadge from '../../contracts/components/ContractStatusBadge';
import { formatCurrency, formatDate } from '../../../shared/utils/format';

export const initials = name =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map(w => w.charAt(0).toUpperCase())
    .join('');

/** Popup chi tiết người thuê: thông tin liên hệ + lịch sử hợp đồng. */
export default function TenantItem({ tenant, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tenantsAPI
      .getTenantById(tenant._id)
      .then(res => setDetail(res.data))
      .catch(err => toast.error(err.response?.data?.message || 'Không tải được thông tin người thuê'))
      .finally(() => setLoading(false));
  }, [tenant._id]);

  const info = detail || tenant;
  const contracts = detail?.contracts || [];

  return (
    <Modal
      title="Thông tin người thuê"
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={<button className={btnGhost} onClick={onClose}>Đóng</button>}
    >
      {/* Hồ sơ */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-100 mb-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white text-lg font-black flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
          {initials(info.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-black text-slate-900">{info.fullName}</h4>
            {tenant.isRepresentative && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                <Crown size={11} /> Người đại diện
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5"><Mail size={13} className="text-slate-400" /> {info.email}</span>
            <span className="inline-flex items-center gap-1.5"><Phone size={13} className="text-slate-400" /> {info.phone || 'Chưa có SĐT'}</span>
          </div>
        </div>
      </div>

      {/* Lịch sử hợp đồng */}
      <h5 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 mb-2.5">
        Lịch sử hợp đồng {detail ? `(${contracts.length})` : ''}
      </h5>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : contracts.length === 0 ? (
        <p className="text-xs text-slate-400 p-4 rounded-2xl bg-slate-50 border border-slate-100">Không có hợp đồng.</p>
      ) : (
        <div className="space-y-2.5">
          {contracts.map(c => {
            const isRep = String(c.representative?._id) === String(tenant._id);
            return (
              <div key={c._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-200 transition">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <DoorOpen size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-800">
                      Phòng {c.room?.roomNumber || 'N/A'}
                      <span className="font-semibold text-slate-400"> · {c.room?.property?.name || ''}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatDate(c.startDate)} → {formatDate(c.endDate)} ·{' '}
                      <span className="font-bold text-slate-700">{formatCurrency(c.monthlyRent)}</span>/tháng
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    {isRep ? <><Crown size={11} /> Đại diện</> : <><Users size={11} /> Ở cùng</>}
                  </span>
                  <ContractStatusBadge status={c.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
