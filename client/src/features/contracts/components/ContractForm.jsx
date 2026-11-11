import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Modal, { btnPrimary, btnGhost, inputCls, labelCls } from '../../../shared/components/Modal';
import { formatCurrency } from '../../../shared/utils/format';
import contractsAPI from '../api/contracts-api';
import { CONTRACT_STATUS } from './ContractStatusBadge';

const toInputDate = d => (d ? new Date(d).toISOString().split('T')[0] : '');
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return toInputDate(d);
};

export default function ContractForm({ contract, propertyId, initialRequestId, onSubmit, onCancel }) {
  const isEdit = Boolean(contract);
  const datesOnly = !isEdit || (Boolean(contract.rentalRequest) && contract.status === 'draft');
  const today = toInputDate(new Date(Date.now() + VIETNAM_OFFSET_MS));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: isEdit
      ? {
          startDate: toInputDate(contract.startDate),
          endDate: toInputDate(contract.endDate),
          monthlyRent: contract.monthlyRent,
          depositAmount: contract.depositAmount,
          status: contract.status,
          template: String(contract.template?._id || contract.template || ''),
        }
      : {
          startDate: today,
          endDate: addYears(today, 1),
        },
  });

  const [options, setOptions] = useState({ approvedRequests: [], tenants: [] });
  const [loadingOptions, setLoadingOptions] = useState(!(isEdit && datesOnly));
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(initialRequestId || '');

  // Người ở cùng (otherMembers) — cần để đổi người đại diện sau này
  const [members, setMembers] = useState(() =>
    isEdit ? (contract.otherMembers || []).map(m => String(m?._id || m)) : [],
  );
  const [memberKeyword, setMemberKeyword] = useState('');

  const setDatesFromRequest = request => {
    const startDate = toInputDate(request?.expectedDate) || today;
    setValue('startDate', startDate);
    setValue('endDate', addYears(startDate, 1));
  };

  useEffect(() => {
    if (isEdit && datesOnly) return;
    contractsAPI
      .getFormOptions(propertyId)
      .then(res => {
        setOptions(res.data || { approvedRequests: [], tenants: [] });
        setOptionsLoaded(true);
        if (!isEdit && initialRequestId) {
          const request = res.data?.approvedRequests?.find(r => r._id === initialRequestId);
          if (request) setDatesFromRequest(request);
        }
      })
      .catch(err => toast.error(err.response?.data?.message || 'Không tải được danh sách phòng / người thuê'))
      .finally(() => setLoadingOptions(false));
  }, [propertyId]);

  const selectedRequest = options.approvedRequests.find(request => request._id === selectedRequestId);
  const representativeId = String(contract?.representative?._id || contract?.representative || '');
  const selectedRoom = isEdit ? contract.room : selectedRequest?.room;
  const roomCapacity = selectedRoom ? Math.min(4, Math.max(1, Number(selectedRoom.maxTenants) || 1)) : 4;
  const selectedOtherMembers = members.filter(id => id !== String(representativeId));
  const exceedsRoomCapacity = selectedOtherMembers.length + 1 > roomCapacity;

  // Danh sách để chọn người ở cùng: người thuê đang hoạt động + người ở cùng hiện tại (nếu có người không còn trong list)
  const memberChoices = (() => {
    const map = new Map();
    options.tenants.forEach(t => map.set(String(t._id), t));
    if (isEdit) (contract.otherMembers || []).forEach(m => m?._id && !map.has(String(m._id)) && map.set(String(m._id), m));
    const kw = memberKeyword.trim().toLowerCase();
    return Array.from(map.values()).filter(
      t =>
        String(t._id) !== String(representativeId) &&
        (!kw || [t.fullName, t.email, t.phone].filter(Boolean).some(v => String(v).toLowerCase().includes(kw))),
    );
  })();

  const toggleMember = id =>
    setMembers(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const handlePickRequest = requestId => {
    setSelectedRequestId(requestId);
    setDatesFromRequest(options.approvedRequests.find(request => request._id === requestId));
  };

  const templates = options.templates || [];
  const selectedTemplate = isEdit ? templates.find(t => t._id === watch('template')) : templates[0];
  const moneyLocked = datesOnly || contract.status !== 'draft';
  const monthlyRent = isEdit ? contract.monthlyRent : selectedRoom?.price;
  const depositAmount = isEdit
    ? contract.depositAmount
    : Math.round(monthlyRent * (options.contractPolicy?.depositMonths ?? 1));

  // Mẫu hợp đồng: bắt buộc khi tạo; khi sửa chỉ đổi được nếu hợp đồng còn Nháp hoặc chưa có mẫu
  const originalTemplateId = isEdit ? String(contract.template?._id || contract.template || '') : '';
  const canChooseTemplate = !datesOnly && (!originalTemplateId || contract.status === 'draft');
  const noTemplates = !loadingOptions && optionsLoaded && templates.length === 0;
  const canCreate = selectedRequest && selectedTemplate && Number.isFinite(monthlyRent) && monthlyRent > 0
    && Number.isSafeInteger(depositAmount) && depositAmount >= 0;

  const submit = data => {
    if (!isEdit) {
      if (!canCreate) return;
      return onSubmit({ rentalRequest: selectedRequest._id, startDate: data.startDate, endDate: data.endDate });
    }
    if (datesOnly) return onSubmit({ startDate: data.startDate, endDate: data.endDate });

    const payload = { ...data };
    if (!canChooseTemplate || !payload.template || payload.template === originalTemplateId) {
      delete payload.template;
    }
    // Khi sửa mà không tải được danh sách người thuê thì không gửi otherMembers (tránh xóa nhầm)
    if (optionsLoaded) {
      payload.otherMembers = members.filter(id => id !== String(representativeId));
    }
    if (moneyLocked) {
      delete payload.monthlyRent;
      delete payload.depositAmount;
    }
    return onSubmit(payload);
  };

  const err = name =>
    errors[name] && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors[name].message}</p>;

  return (
    <Modal
      title={isEdit ? 'Cập nhật hợp đồng' : 'Tạo hợp đồng mới'}
      subtitle={
        isEdit
          ? `Phòng ${contract.room?.roomNumber || ''} · ${contract.representative?.fullName || ''}`
          : 'Lập hợp đồng từ yêu cầu thuê đã duyệt'
      }
      onClose={onCancel}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onCancel}>Hủy</button>
          <button type="submit" form="contract-form" className={btnPrimary} disabled={isSubmitting || (!isEdit && (loadingOptions || !canCreate))}>
            {isEdit ? 'Cập nhật' : 'Tạo hợp đồng'}
          </button>
        </>
      }
    >
      <form id="contract-form" onSubmit={handleSubmit(submit)} className="space-y-4">
        {!isEdit && optionsLoaded && <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
          Giá thuê và tiền cọc lấy từ cấu hình của chủ trọ. Quản lý chỉ nhập ngày bắt đầu và ngày kết thúc.
        </p>}
        {canChooseTemplate ? (
          <div>
            <label className={labelCls}>Mẫu hợp đồng</label>
            <select
              className={inputCls}
              disabled={loadingOptions}
              {...register('template')}
            >
              <option value="">{loadingOptions ? 'Đang tải...' : '— Chọn mẫu do chủ trọ soạn —'}</option>
              {(options.templates || []).map(t => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>
            {noTemplates && (
              <p className="mt-1 text-[11px] font-semibold text-amber-600">
                Tòa nhà này chưa có mẫu hợp đồng đang dùng. Chủ trọ cần cấu hình mẫu cho tòa nhà ở mục "Mẫu hợp đồng" trước.
              </p>
            )}
            {err('template')}
          </div>
        ) : isEdit && (
          <p className="text-[11px] font-semibold text-slate-500">
            Mẫu hợp đồng: <span className="text-slate-800">{contract.templateTitle || contract.template?.title}</span>
          </p>
        )}

        {!isEdit && noTemplates && (
          <p className="text-sm text-amber-700">Tòa nhà chưa có mẫu hợp đồng đang áp dụng. Chủ trọ cần cấu hình mẫu hợp đồng.</p>
        )}

        {selectedTemplate && <details open className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
          <summary className="text-sm font-bold cursor-pointer">Mẫu của tòa nhà: {selectedTemplate.title}</summary>
          <p className="mt-2 text-xs text-slate-500">Các biến trong mẫu sẽ được điền bằng thông tin phòng, người thuê và hợp đồng khi lưu.</p>
          <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap text-xs font-sans">{selectedTemplate.content}</pre>
        </details>}
        {!isEdit && (
          <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            {loadingOptions && <p className="text-sm text-slate-500">Đang tải yêu cầu thuê...</p>}
            {!loadingOptions && !initialRequestId && options.approvedRequests.length > 0 && (
              <div>
                <label className={labelCls} htmlFor="contract-rental-request">Yêu cầu thuê đã duyệt</label>
                <select
                  id="contract-rental-request"
                  className={inputCls}
                  value={selectedRequestId}
                  onChange={event => handlePickRequest(event.target.value)}
                >
                  <option value="">— Chọn yêu cầu thuê —</option>
                  {options.approvedRequests.map(request => (
                    <option key={request._id} value={request._id}>
                      Phòng {request.room.roomNumber} · {request.tenant.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {!loadingOptions && !selectedRequest && (initialRequestId || options.approvedRequests.length === 0) && (
              <p className="text-sm text-slate-600">
                {initialRequestId ? 'Yêu cầu này không còn khả dụng để lập hợp đồng.' : 'Chưa có yêu cầu thuê đã duyệt để lập hợp đồng.'}
              </p>
            )}
            {selectedRequest && (
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className={labelCls}>Phòng đã đặt</dt>
                  <dd className="font-semibold text-slate-800">{selectedRoom.roomNumber}</dd>
                </div>
                <div>
                  <dt className={labelCls}>Người thuê đứng tên</dt>
                  <dd className="font-semibold text-slate-800">{selectedRequest.tenant.fullName}</dd>
                </div>
              </dl>
            )}
          </div>
        )}
        {!datesOnly && <div>
          <label className={labelCls}>
            Người ở cùng {selectedOtherMembers.length > 0 && `(${selectedOtherMembers.length})`}
          </label>
          {selectedRoom && <p className="mb-2 text-[11px] font-semibold text-slate-500">Sức chứa phòng: tối đa {roomCapacity} người, gồm người đại diện.</p>}
          {exceedsRoomCapacity && <p className="mb-2 text-[11px] font-semibold text-rose-600">Số người vượt sức chứa phòng. Hãy bỏ bớt người ở cùng.</p>}
          <input
            className={`${inputCls} mb-2`}
            placeholder="Tìm theo tên, email, SĐT..."
            value={memberKeyword}
            onChange={e => setMemberKeyword(e.target.value)}
            disabled={loadingOptions}
          />
          <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
            {loadingOptions ? (
              <p className="px-3 py-2.5 text-xs font-semibold text-slate-400">Đang tải...</p>
            ) : memberChoices.length === 0 ? (
              <p className="px-3 py-2.5 text-xs font-semibold text-slate-400">Không có người thuê phù hợp</p>
            ) : (
              memberChoices.map(t => {
                const id = String(t._id);
                const full = selectedOtherMembers.length >= roomCapacity - 1 && !members.includes(id);
                return (
                  <label key={id} className="flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer hover:bg-emerald-50/50">
                    <input
                      type="checkbox"
                      className="accent-emerald-600"
                      checked={members.includes(id)}
                      disabled={full}
                      onChange={() => toggleMember(id)}
                    />
                    <span className="font-bold text-slate-700">{t.fullName}</span>
                    <span className="text-slate-400">{t.phone || t.email}</span>
                  </label>
                );
              })
            )}
          </div>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">
            Người ở cùng có thể được chọn làm người đại diện mới khi đổi đại diện.
          </p>
        </div>}

        {(isEdit || selectedRequest) && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Ngày bắt đầu *</label>
            <input type="date" className={inputCls} {...register('startDate', { required: 'Bắt buộc' })} />
            {err('startDate')}
          </div>
          <div>
            <label className={labelCls}>Ngày kết thúc *</label>
            <input
              type="date"
              className={inputCls}
              {...register('endDate', {
                required: 'Bắt buộc',
                validate: v => !watch('startDate') || v > watch('startDate') || 'Phải sau ngày bắt đầu',
              })}
            />
            {err('endDate')}
          </div>
          {moneyLocked ? <div>
            <p className={labelCls}>Tiền thuê / tháng</p>
            <p className={`${inputCls} bg-slate-50`}>{formatCurrency(monthlyRent)}</p>
          </div> : <div>
            <label className={labelCls}>Tiền thuê / tháng (VNĐ)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="5000000"
              {...register('monthlyRent', {
                required: 'Bắt buộc',
                min: { value: 1, message: 'Phải lớn hơn 0' },
              })}
            />
            {err('monthlyRent')}
          </div>}
          {moneyLocked ? <div>
            <p className={labelCls}>Tiền đặt cọc</p>
            <p className={`${inputCls} bg-slate-50`}>{formatCurrency(depositAmount)}</p>
          </div> : <div>
            <label className={labelCls}>Tiền đặt cọc (VNĐ)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="0"
              {...register('depositAmount', { min: { value: 0, message: 'Không được âm' } })}
            />
            {err('depositAmount')}
          </div>}
        </div>}
        {!isEdit && selectedRequest && !canCreate && !noTemplates && (
          <p className="text-sm text-amber-700">Chủ trọ cần kiểm tra cấu hình giá thuê và tiền cọc của phòng.</p>
        )}

        <div>
          <label className={labelCls}>Trạng thái</label>
          {datesOnly ? (
            <p className="text-sm text-slate-600">Lưu nháp để gửi cho khách thuê ký.</p>
          ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(CONTRACT_STATUS)
              .map(([value, c]) => {
                const active = watch('status') === value;
                return (
                  <label
                    key={value}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      active
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100'
                        : 'border-slate-200 text-slate-600 hover:border-emerald-200'
                    }`}
                  >
                    <input type="radio" value={value} className="hidden" {...register('status')} />
                    <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                    {c.label}
                  </label>
                );
              })}
          </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
