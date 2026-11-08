import React, { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import Modal, { btnPrimary, btnGhost } from '../../../shared/components/Modal';
import contractsAPI from '../api/contracts-api';

const escapeHtml = s =>
  String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Xem / in văn bản hợp đồng (mẫu của chủ trọ đã điền dữ liệu hợp đồng). */
export default function ContractDocumentModal({ contract, onClose }) {
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    contractsAPI
      .getContractDocument(contract._id)
      .then(res => !cancelled && setDoc(res.data))
      .catch(err => !cancelled && setError(err.response?.data?.message || 'Không tải được văn bản hợp đồng'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [contract._id]);

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=900,height=1000');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(doc.title)}</title>
      <style>body{font-family:'Times New Roman',serif;font-size:15px;line-height:1.7;margin:40px;white-space:pre-wrap;color:#111}</style>
      </head><body>${escapeHtml(doc.content)}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <Modal
      title={doc?.title || 'Văn bản hợp đồng'}
      subtitle={`Phòng ${contract.room?.roomNumber || ''} · ${contract.representative?.fullName || ''}`}
      onClose={onClose}
      maxWidth="max-w-3xl"
      footer={
        <>
          <button className={btnGhost} onClick={onClose}>Đóng</button>
          <button className={`${btnPrimary} inline-flex items-center gap-1.5`} onClick={handlePrint} disabled={!doc}>
            <Printer size={14} /> In hợp đồng
          </button>
        </>
      }
    >
      {loading ? (
        <div className="h-64 rounded-xl bg-slate-100/70 animate-pulse" />
      ) : error ? (
        <p className="text-sm font-semibold text-amber-600">{error}</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-serif">
          {doc.content}
        </div>
      )}
    </Modal>
  );
}
