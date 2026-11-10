import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { CalendarDays, Pencil, RefreshCw, UserRoundCog, Users, Wallet, DoorOpen, FileText } from 'lucide-react';
import ContractDocumentModal from './ContractDocumentModal';
import contractsAPI from '../api/contracts-api';
import RenewContractModal from './RenewContractModal';
import ChangeRepresentativeModal from './ChangeRepresentativeModal';
import ContractStatusBadge from './ContractStatusBadge';
import { formatCurrency, formatDate } from '../../../shared/utils/format';

const DAY = 24 * 60 * 60 * 1000;

export default function ContractItem({ contract, onEdit, onRefresh, readOnly = false }) {
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showChangeRepModal, setShowChangeRepModal] = useState(false);
  const [showDocument, setShowDocument] = useState(false);

  const daysLeft = Math.ceil((new Date(contract.endDate) - Date.now()) / DAY);
  const expiringSoon = contract.status === 'active' && daysLeft >= 0 && daysLeft <= 30;
  const memberCount = 1 + (contract.otherMembers?.length || 0);

  const handleRenew = async newEndDate => {
    try {
      await contractsAPI.renewContract(contract._id, newEndDate);
      toast.success('Gia hạn hợp đồng thành công');
      setShowRenewModal(false);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi gia hạn hợp đồng');
    }
  };

  const handleChangeRepresentative = async newRepresentativeId => {
    try {
      await contractsAPI.changeRepresentative(contract._id, newRepresentativeId);
      toast.success('Thay đổi người đại diện thành công');
      setShowChangeRepModal(false);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi thay đổi người đại diện');
    }
  };

  const actionBtn =
    'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition cursor-pointer';

  return (
    <>
      <div className="h-full flex flex-col p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.10)] hover:-translate-y-0.5 transition-all">
        {/* Đầu thẻ */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <DoorOpen size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-black text-slate-900 truncate">Phòng {contract.room?.roomNumber || 'N/A'}</h4>
              <p className="text-[11px] font-semibold text-slate-400 truncate">{contract.room?.property?.name || 'Nhà trọ'}</p>
            </div>
          </div>
          <ContractStatusBadge status={contract.status} />
        </div>

        {/* Người đại diện */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0">
            {(contract.representative?.fullName || '?').trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-slate-800 truncate">{contract.representative?.fullName || 'N/A'}</p>
            <p className="text-[11px] text-slate-400 truncate">
              {contract.representative?.phone || contract.representative?.email || 'Người đại diện'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500" title="Số người ở">
            <Users size={13} /> {memberCount}
          </span>
        </div>

        {/* Thông tin */}
        <div className="grid grid-cols-2 gap-2.5 text-xs mb-4">
          <div className="p-3 rounded-2xl border border-slate-100">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400 mb-1">
              <CalendarDays size={12} /> Thời hạn
            </p>
            <p className="font-bold text-slate-700">
              {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
            </p>
            {expiringSoon && <p className="mt-1 text-[10px] font-bold text-amber-600">Còn {daysLeft} ngày</p>}
          </div>
          <div className="p-3 rounded-2xl border border-slate-100">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400 mb-1">
              <Wallet size={12} /> Tiền thuê
            </p>
            <p className="font-black text-slate-900">{formatCurrency(contract.monthlyRent)}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">Cọc: {formatCurrency(contract.depositAmount)}</p>
          </div>
        </div>

        {/* Văn bản hợp đồng theo mẫu */}
        {contract.template || contract.templateTitle ? (
          <button
            className="mb-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border border-emerald-100 text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
            onClick={() => setShowDocument(true)}
            title={contract.templateTitle || contract.template?.title}
          >
            <FileText size={13} /> Xem hợp đồng
          </button>
        ) : (
          <p className="mb-2 text-center text-[10px] font-semibold text-amber-600">{readOnly ? 'Chưa gắn mẫu hợp đồng' : 'Chưa gắn mẫu hợp đồng — bấm Sửa để chọn mẫu'}</p>
        )}

        {/* Thao tác */}
        {!readOnly && <div className="mt-auto flex gap-2">
          <button
            className={`${actionBtn} bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700`}
            onClick={() => onEdit(contract)}
          >
            <Pencil size={13} /> Sửa
          </button>
          {contract.status === 'active' && (
            <>
              <button
                className={`${actionBtn} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                onClick={() => setShowRenewModal(true)}
              >
                <RefreshCw size={13} /> Gia hạn
              </button>
              <button
                className={`${actionBtn} bg-sky-50 text-sky-700 hover:bg-sky-100`}
                onClick={() => setShowChangeRepModal(true)}
              >
                <UserRoundCog size={13} /> Đổi đại diện
              </button>
            </>
          )}
        </div>}
      </div>

      {showDocument && <ContractDocumentModal contract={contract} onClose={() => setShowDocument(false)} />}

      {showRenewModal && (
        <RenewContractModal contract={contract} onClose={() => setShowRenewModal(false)} onRenew={handleRenew} />
      )}

      {showChangeRepModal && (
        <ChangeRepresentativeModal
          contract={contract}
          onClose={() => setShowChangeRepModal(false)}
          onChange={handleChangeRepresentative}
        />
      )}
    </>
  );
}
