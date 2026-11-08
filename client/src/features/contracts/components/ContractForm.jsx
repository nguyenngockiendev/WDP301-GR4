import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Modal, { btnPrimary, btnGhost, inputCls, labelCls } from '../../../shared/components/Modal';
import contractsAPI from '../api/contracts-api';
import { CONTRACT_STATUS } from './ContractStatusBadge';

const toInputDate = d => (d ? new Date(d).toISOString().split('T')[0] : '');

const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return toInputDate(d);
};

export default function ContractForm({ contract, propertyId, initialRequestId, onSubmit, onCancel }) {
  const isEdit = Boolean(contract);
  const today = toInputDate(new Date());

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
          rentalRequest: '',
          room: '',
          representative: '',
          startDate: today,
          endDate: addYears(today, 1),
          monthlyRent: '',
          depositAmount: '',
          status: 'active',
          template: '',
        },
  });

  const [options, setOptions] = useState({ rooms: [], approvedRequests: [], tenants: [] });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  // Người ở cùng (otherMembers) — cần để đổi người đại diện sau này
  const [members, setMembers] = useState(() =>
    isEdit ? (contract.otherMembers || []).map(m => String(m?._id || m)) : [],
  );
  const [memberKeyword, setMemberKeyword] = useState('');

  useEffect(() => {
    // Sửa hợp đồng cũng cần danh sách người thuê để chọn người ở cùng
    contractsAPI
      .getFormOptions(propertyId)
      .then(res => {
        setOptions(res.data || { rooms: [], approvedRequests: [], tenants: [] });
        setOptionsLoaded(true);
        if (!isEdit && res.data?.templates?.length) setValue('template', res.data.templates[0]._id);
        if (!isEdit && initialRequestId) {
          const req = res.data?.approvedRequests?.find(r => r._id === initialRequestId);
          if (req) {
            setValue('rentalRequest', req._id);
            setValue('room', req.room._id);
            setValue('representative', req.tenant._id);
            setValue('monthlyRent', req.room.price);
            if (req.expectedDate) {
              setValue('startDate', toInputDate(req.expectedDate));
              setValue('endDate', addYears(req.expectedDate, 1));
            }
          } else toast.error('Yêu cầu không còn khả dụng để lập hợp đồng. Vui lòng kiểm tra lại.');
        }
      })
      .catch(err => toast.error(err.response?.data?.message || 'Không tải được danh sách phòng / người thuê'))
      .finally(() => setLoadingOptions(false));
  }, [propertyId]);

  const representativeId = isEdit ? String(contract.representative?._id || contract.representative || '') : watch('representative');

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

  // Chọn yêu cầu thuê đã duyệt -> tự điền phòng, người đại diện, giá thuê
  const handlePickRequest = requestId => {
    setValue('rentalRequest', requestId);
    const req = options.approvedRequests.find(r => r._id === requestId);
    if (!req) return;
    setValue('room', req.room._id, { shouldValidate: true });
    setValue('representative', req.tenant._id, { shouldValidate: true });
    if (req.room.price) setValue('monthlyRent', req.room.price, { shouldValidate: true });
    if (req.expectedDate) setValue('startDate', toInputDate(req.expectedDate));
  };

  // Chọn phòng -> gợi ý giá thuê theo giá phòng
  const handlePickRoom = roomId => {
    setValue('room', roomId, { shouldValidate: true });
    const room = options.rooms.find(r => r._id === roomId);
    if (room?.price) setValue('monthlyRent', room.price, { shouldValidate: true });
  };

  const monthlyRent = watch('monthlyRent');
  useEffect(() => {
    if (!isEdit && optionsLoaded && monthlyRent !== '') {
      setValue('depositAmount', Number(monthlyRent) * Number(options.contractPolicy?.depositMonths ?? 1));
    }
  }, [monthlyRent, optionsLoaded, options.contractPolicy?.depositMonths, isEdit, setValue]);

  const selectedTemplate = (options.templates || []).find(t => t._id === watch('template'));
  const moneyLocked = isEdit && contract.status !== 'draft';

  // Mẫu hợp đồng: bắt buộc khi tạo; khi sửa chỉ đổi được nếu hợp đồng còn Nháp hoặc chưa có mẫu
  const originalTemplateId = isEdit ? String(contract.template?._id || contract.template || '') : '';
  const canChooseTemplate = !isEdit || !originalTemplateId || contract.status === 'draft';
  const noTemplates = !loadingOptions && optionsLoaded && options.templates?.length === 0;

  const submit = data => {
    const payload = { ...data };
    if (!payload.rentalRequest) delete payload.rentalRequest;
    if (isEdit && (!canChooseTemplate || !payload.template || payload.template === originalTemplateId)) {
      delete payload.template;
    }
    // Khi sửa mà không tải được danh sách người thuê thì không gửi otherMembers (tránh xóa nhầm)
    if (!isEdit || optionsLoaded) {
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
          : 'Chọn từ yêu cầu thuê đã duyệt hoặc nhập thủ công'
      }
      onClose={onCancel}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onCancel}>Hủy</button>
          <button type="submit" form="contract-form" className={btnPrimary} disabled={isSubmitting || (!isEdit && (loadingOptions || !optionsLoaded || noTemplates))}>
            {isEdit ? 'Cập nhật' : 'Tạo hợp đồng'}
          </button>
        </>
      }
    >
      <form id="contract-form" onSubmit={handleSubmit(submit)} className="space-y-4">
        {!isEdit && optionsLoaded && <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
          Dùng mẫu do chủ tòa nhà cấu hình. Ngày đóng tiền: {options.contractPolicy?.paymentDueDay ?? 5}; tiền cọc gợi ý: {options.contractPolicy?.depositMonths ?? 1} tháng tiền thuê. Điền phòng, người thuê và thời hạn bên dưới.
        </p>}
        {canChooseTemplate ? (
          <div>
            <label className={labelCls}>Mẫu hợp đồng {!isEdit && '*'}</label>
            <select
              className={inputCls}
              disabled={loadingOptions}
              {...register('template', { required: isEdit ? false : 'Vui lòng chọn mẫu hợp đồng' })}
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
        ) : (
          <p className="text-[11px] font-semibold text-slate-500">
            Mẫu hợp đồng: <span className="text-slate-800">{contract.templateTitle || contract.template?.title}</span>
            <span className="text-slate-400"> (chỉ đổi được khi hợp đồng ở trạng thái Nháp)</span>
          </p>
        )}

        {selectedTemplate && <details open className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
          <summary className="text-sm font-bold cursor-pointer">Mẫu của tòa nhà: {selectedTemplate.title}</summary>
          <p className="mt-2 text-xs text-slate-500">Các biến trong mẫu sẽ được điền bằng thông tin phòng, người thuê và hợp đồng khi lưu.</p>
          <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap text-xs font-sans">{selectedTemplate.content}</pre>
        </details>}
        {!isEdit && (
          <>
            {options.approvedRequests.length > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <label className={labelCls}>Từ yêu cầu thuê đã duyệt</label>
                <select
                  className={inputCls}
                  value={watch('rentalRequest')}
                  onChange={e => handlePickRequest(e.target.value)}
                >
                  <option value="">— Không chọn (nhập thủ công) —</option>
                  {options.approvedRequests.map(r => (
                    <option key={r._id} value={r._id}>
                      Phòng {r.room.roomNumber} · {r.tenant.fullName} ({r.tenant.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Phòng *</label>
                <select
                  className={inputCls}
                  disabled={loadingOptions}
                  {...register('room', { required: 'Vui lòng chọn phòng' })}
                  onChange={e => handlePickRoom(e.target.value)}
                >
                  <option value="">{loadingOptions ? 'Đang tải...' : '— Chọn phòng —'}</option>
                  {options.rooms.map(r => (
                    <option key={r._id} value={r._id}>
                      Phòng {r.roomNumber} · {Number(r.price || 0).toLocaleString('vi-VN')} đ
                    </option>
                  ))}
                </select>
                {!loadingOptions && options.rooms.length === 0 && (
                  <p className="mt-1 text-[11px] font-semibold text-amber-600">Tất cả phòng đều đã có hợp đồng.</p>
                )}
                {err('room')}
              </div>

              <div>
                <label className={labelCls}>Người đại diện *</label>
                <select
                  className={inputCls}
                  disabled={loadingOptions}
                  {...register('representative', { required: 'Vui lòng chọn người đại diện' })}
                >
                  <option value="">{loadingOptions ? 'Đang tải...' : '— Chọn người thuê —'}</option>
                  {options.tenants.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.fullName} · {t.phone || t.email}
                    </option>
                  ))}
                </select>
                {err('representative')}
              </div>
            </div>
          </>
        )}

        <div>
          <label className={labelCls}>
            Người ở cùng {members.filter(id => id !== String(representativeId)).length > 0 && `(${members.filter(id => id !== String(representativeId)).length})`}
          </label>
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
                return (
                  <label key={id} className="flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer hover:bg-emerald-50/50">
                    <input
                      type="checkbox"
                      className="accent-emerald-600"
                      checked={members.includes(id)}
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div>
            <label className={labelCls}>Tiền thuê / tháng (VNĐ) *</label>
            <input
              type="number"
              className={inputCls}
              disabled={moneyLocked}
              placeholder="5000000"
              {...register('monthlyRent', {
                required: moneyLocked ? false : 'Bắt buộc',
                min: { value: 1, message: 'Phải lớn hơn 0' },
              })}
            />
            {err('monthlyRent')}
          </div>
          <div>
            <label className={labelCls}>Tiền đặt cọc (VNĐ)</label>
            <input
              type="number"
              className={inputCls}
              disabled={moneyLocked}
              placeholder="0"
              {...register('depositAmount', { min: { value: 0, message: 'Không được âm' } })}
            />
            {err('depositAmount')}
          </div>
        </div>
        {moneyLocked && (
          <p className="text-[11px] font-semibold text-slate-400">
            Tiền thuê và tiền cọc chỉ sửa được khi hợp đồng ở trạng thái Nháp.
          </p>
        )}

        <div>
          <label className={labelCls}>Trạng thái</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CONTRACT_STATUS)
              .filter(([value]) => isEdit || value === 'active' || value === 'draft')
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
        </div>
      </form>
    </Modal>
  );
}
