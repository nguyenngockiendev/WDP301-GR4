import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal, { btnGhost, btnPrimary, inputCls, labelCls } from '../../../shared/components/Modal';
import rentalsAPI from '../../rentals/api/rentals-api';

const defaultPassword = fullName => {
  const lastName = String(fullName || 'Khach')
    .trim()
    .split(/\s+/)
    .pop()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9]/g, '') || 'Khach';
  return `${lastName}123456@`;
};

export default function CreateTenantAccountModal({ contract, onClose, onCreated }) {
  const guest = contract.guestSnapshot || {};
  const email = guest.email || '';
  const [password, setPassword] = useState(defaultPassword(guest.fullName));
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const handleSubmit = async event => {
    event.preventDefault();
    try {
      setSaving(true);
      const response = await rentalsAPI.createTenantAccountForRequest(contract.rentalRequest?._id || contract.rentalRequest, { password });
      const result = response?.data;
      setCreated(result?.credentials || { username: result?.username || email, email, existingAccount: true });
      onCreated();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không tạo được tài khoản người thuê');
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = async () => {
    try {
      await navigator.clipboard.writeText(`Tên đăng nhập: ${created.username}\nEmail: ${created.email}${created.password ? `\nMật khẩu: ${created.password}` : ''}`);
      toast.success('Đã sao chép thông tin tài khoản');
    } catch {
      toast.error('Không thể sao chép trên trình duyệt này');
    }
  };

  return (
    <Modal
      title={created ? 'Tài khoản khách thuê' : 'Cấp tài khoản khách thuê'}
      subtitle={created ? 'Gửi thông tin đăng nhập này cho khách.' : 'Chỉ tạo tài khoản sau khi hợp đồng đã được lưu.'}
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={created ? (
        <>
          <button type="button" className={btnGhost} onClick={copyCredentials}><Copy size={14} className="inline mr-1" />Sao chép</button>
          <button type="button" className={btnPrimary} onClick={onClose}>Hoàn tất</button>
        </>
      ) : (
        <>
          <button type="button" className={btnGhost} onClick={onClose} disabled={saving}>Hủy</button>
          <button type="submit" form="tenant-account-form" className={btnPrimary} disabled={saving || !email || password.length < 8}>
            {saving ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </>
      )}
    >
      {created ? (
        <div className="space-y-3 rounded-2xl bg-emerald-50 p-4 text-sm">
          <p><span className="text-slate-500">Tên đăng nhập:</span> <b className="select-all">{created.username}</b></p>
          <p><span className="text-slate-500">Email:</span> <b className="select-all">{created.email}</b></p>
          {created.password ? (
            <p><span className="text-slate-500">Mật khẩu mặc định:</span> <b className="select-all font-mono">{created.password}</b></p>
          ) : (
            <p className="text-amber-800">Email này đã có tài khoản tenant, hệ thống đã liên kết tài khoản hiện có.</p>
          )}
        </div>
      ) : (
        <form id="tenant-account-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Khách thuê</label>
            <p className="text-sm font-bold text-slate-800">{guest.fullName}</p>
          </div>
          <div>
            <label className={labelCls}>Email / tên đăng nhập</label>
            <input className={inputCls} value={email} readOnly />
          </div>
          <div>
            <label className={labelCls} htmlFor="tenant-default-password">Mật khẩu mặc định</label>
            <input
              id="tenant-default-password"
              className={inputCls}
              value={password}
              onChange={event => setPassword(event.target.value)}
              minLength={8}
              maxLength={100}
              required
            />
            <p className="mt-1 text-[11px] text-slate-500">Mặc định lấy tên cuối của khách + 123456@. Có thể sửa trước khi tạo.</p>
          </div>
        </form>
      )}
    </Modal>
  );
}
