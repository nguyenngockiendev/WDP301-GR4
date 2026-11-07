import React, { useState } from 'react';
import { ArrowRight, FileText, Send } from 'lucide-react';

export default function CheckoutRequestForm({
  onSubmit,
  loading = false,
  existingRequest = false,
}) {
  const [contractId, setContractId] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!contractId.trim() || !reason.trim()) return;
    onSubmit({ contractId: contractId.trim(), reason: reason.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-white/90 bg-white/85 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <FileText size={21} />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">Thông tin yêu cầu</h2>
          <p className="mt-1 text-sm text-slate-500">Nhập hợp đồng và lý do bạn muốn trả phòng.</p>
        </div>
      </div>

      {existingRequest && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Hợp đồng này đã có yêu cầu trả phòng. Bạn có thể theo dõi yêu cầu trong mục “Yêu cầu của tôi”.
        </div>
      )}

      <div className="mb-5">
        <label htmlFor="checkout-contract-id" className="mb-2 block text-sm font-bold text-slate-700">
          Mã hợp đồng <span className="text-rose-500">*</span>
        </label>
        <input
          id="checkout-contract-id"
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
          placeholder="Nhập ID hợp đồng đang có hiệu lực"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
          required
        />
        <p className="mt-2 text-xs text-slate-400">Chỉ sử dụng mã hợp đồng đang hoạt động và còn trong thời hạn. Backend sẽ kiểm tra quyền sở hữu trước khi tạo yêu cầu.</p>
      </div>

      <div className="mb-6">
        <label htmlFor="checkout-reason" className="mb-2 block text-sm font-bold text-slate-700">
          Lý do trả phòng <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="checkout-reason"
          rows={5}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Chia sẻ lý do và thông tin dự kiến trả phòng..."
          className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || existingRequest || !contractId.trim() || !reason.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:shadow-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        <Send size={16} />
        {loading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu trả phòng'}
        {!loading && <ArrowRight size={16} />}
      </button>
    </form>
  );
}
