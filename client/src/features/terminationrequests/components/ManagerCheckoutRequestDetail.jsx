import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Building2, CalendarDays, FileText, MapPin,
  RefreshCw, UserRound, Wallet,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import terminationRequestsAPI from '../api/terminationrequests-api';
import CheckoutStatusBadge from './CheckoutStatusBadge';

const formatDate = (value, withTime = false) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', withTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'long' });
};

const formatMoney = value => Number(value || 0).toLocaleString('vi-VN') + ' ₫';

function InfoItem({ icon: Icon, label, value, subValue }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        <Icon size={16} />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="break-words text-sm font-bold text-slate-800">{value || '—'}</p>
      {subValue ? <p className="mt-1 break-words text-xs text-slate-500">{subValue}</p> : null}
    </div>
  );
}

export default function ManagerCheckoutRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      setLoading(true);

      const response = await terminationRequestsAPI.getManagerRequestDetail(id);

      setRequest(response?.data || response?.result || null);

    } catch (error) {
      const message = error.response?.data?.message || 'Không thể tải chi tiết yêu cầu checkout';

      toast.error(message);

      if (error.response?.status === 404 || error.response?.status === 403) {
        navigate('/manager/checkout-requests', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // id là định danh của trang chi tiết; tải lại khi URL đổi ID.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-16 text-center">
        <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-emerald-700" />
        <p className="text-sm font-medium text-slate-500">Đang tải thông tin checkout...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <p className="font-semibold text-slate-700">Không tìm thấy yêu cầu checkout.</p>
        <button onClick={() => navigate('/manager/checkout-requests')} className="mt-4 text-sm font-bold text-emerald-700 hover:underline">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const contract = request.contract || {};
  const room = contract.room || {};
  const representative = contract.representative || {};

  return (
    <main className="mx-auto max-w-6xl space-y-6 py-6">
      <div>
        <button
          type="button"
          onClick={() => navigate('/manager/checkout-requests')}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-700"
        >
          <ArrowLeft size={17} /> Quay lại danh sách checkout
        </button>

        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
              <Building2 size={15} /> Checkout management
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Quản lý yêu cầu trả phòng
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Phòng {room.roomNumber || '—'} · Mã yêu cầu {String(request._id).slice(-8).toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-3 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 sm:self-auto">
            <span className="text-xs font-semibold text-slate-500">Trạng thái</span>
            <CheckoutStatusBadge status={request.status} />
          </div>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText size={18} className="text-emerald-700" />
            <h2 className="font-bold text-slate-900">Thông tin yêu cầu</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem icon={CalendarDays} label="Ngày gửi yêu cầu" value={formatDate(request.requestedDate || request.createdAt, true)} />
            <InfoItem icon={CalendarDays} label="Ngày dự kiến trả phòng" value={formatDate(request.moveOutDate)} />
            <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
              <p className="mb-2 text-xs font-semibold text-slate-500">Lý do trả phòng</p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{request.reason || 'Người thuê không cung cấp lý do.'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserRound size={18} className="text-emerald-700" />
            <h2 className="font-bold text-slate-900">Người thuê và hợp đồng</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem icon={UserRound} label="Người đại diện hợp đồng" value={representative.fullName} subValue={representative.email} />
            <InfoItem icon={MapPin} label="Phòng" value={room.roomNumber} subValue={room.area ? `${room.area} m²` : ''} />
            <InfoItem icon={CalendarDays} label="Thời hạn hợp đồng" value={`${formatDate(contract.startDate)} – ${formatDate(contract.endDate)}`} />
            <InfoItem icon={Wallet} label="Giá thuê hàng tháng" value={formatMoney(contract.monthlyRent)} />
            <InfoItem icon={Wallet} label="Tiền đặt cọc" value={formatMoney(contract.depositAmount)} />
            <InfoItem icon={FileText} label="Mã hợp đồng" value={contract._id} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Building2 size={18} className="text-emerald-700" />
          <h2 className="font-bold text-slate-900">Các bước quản lý checkout</h2>
        </div>
        <p className="text-sm leading-6 text-slate-500">
          Đây là trang làm việc chính cho quy trình trả phòng. Các nghiệp vụ kiểm tra tài sản,
          ghi nhận hư hỏng, đối soát công nợ và tiền cọc sẽ được tích hợp tại đây ở các bước tiếp theo.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ['01', 'Kiểm tra phòng và tài sản', 'Ghi nhận tài sản còn nguyên vẹn hoặc bị hư hỏng.'],
            ['02', 'Đối soát công nợ', 'Kiểm tra hóa đơn, khoản còn nợ và tiền đặt cọc.'],
            ['03', 'Hoàn tất checkout', 'Xử lý kết quả và cập nhật trạng thái hợp đồng, phòng.'],
          ].map(([number, title, description]) => (
            <div key={number} className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
              <span className="text-xs font-bold tracking-wider text-emerald-700">BƯỚC {number}</span>
              <h3 className="mt-2 text-sm font-bold text-slate-800">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
