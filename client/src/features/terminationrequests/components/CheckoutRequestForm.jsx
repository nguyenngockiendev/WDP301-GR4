import React, { useState } from 'react';
import { ArrowRight, CalendarDays, FileText, Send } from 'lucide-react';

const bankInputClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10';

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CheckoutRequestForm({
  onSubmit,
  loading = false,
  existingRequest = false,
}) {
  const [moveOutDate, setMoveOutDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (loading || existingRequest || !moveOutDate || !reason.trim()) return;

    const fields = new FormData(event.currentTarget);
    onSubmit({
      moveOutDate,
      reason: reason.trim(),
      refundBankAccount: {
        bankName: fields.get('bankName').trim(),
        accountNumber: fields.get('accountNumber').trim(),
        accountHolder: fields.get('accountHolder').trim(),
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/90 bg-white/85 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:p-8"
    >
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <FileText size={21} />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">Thông tin yêu cầu</h2>
          <p className="mt-1 text-sm text-slate-500">
            Điền ngày dự kiến rời phòng, lý do và tài khoản nhận tiền nếu có khoản hoàn cọc.
          </p>
        </div>
      </div>

      {existingRequest && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Hợp đồng này đã có yêu cầu trả phòng. Bạn có thể theo dõi yêu cầu trong mục “Yêu cầu của tôi”.
        </div>
      )}

      <div className="mb-5">
        <label htmlFor="checkout-move-out-date" className="mb-2 block text-sm font-bold text-slate-700">
          Ngày dự kiến rời phòng <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <CalendarDays size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="checkout-move-out-date"
            type="date"
            value={moveOutDate}
            min={getToday()}
            onChange={(event) => setMoveOutDate(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
            required
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Chọn ngày bạn dự kiến bàn giao phòng. Ngày này chưa phải ngày kết thúc hợp đồng chính thức.
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="checkout-reason" className="mb-2 block text-sm font-bold text-slate-700">
          Lý do trả phòng <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="checkout-reason"
          rows={5}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Chia sẻ lý do bạn muốn trả phòng..."
          className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
          required
        />
      </div>

      <fieldset className="mb-6">
        <legend className="mb-3 text-sm font-extrabold text-slate-800">Tài khoản nhận hoàn cọc</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-bold text-slate-700">
            Ngân hàng <span className="text-rose-500">*</span>
            <input name="bankName" className={bankInputClass} pattern={'.*\\S.*'} required />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Số tài khoản <span className="text-rose-500">*</span>
            <input
              name="accountNumber"
              inputMode="numeric"
              pattern="[0-9]{6,25}"
              maxLength={25}
              title="Nhập từ 6 đến 25 chữ số"
              className={bankInputClass}
              required
            />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Tên chủ tài khoản <span className="text-rose-500">*</span>
            <input name="accountHolder" className={bankInputClass} pattern={'.*\\S.*'} required />
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={loading || existingRequest || !moveOutDate || !reason.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:shadow-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        <Send size={16} />
        {loading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu trả phòng'}
        {!loading && <ArrowRight size={16} />}
      </button>
    </form>
  );
}
