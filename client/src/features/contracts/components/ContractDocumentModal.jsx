import React, { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import Modal, { btnPrimary, btnGhost } from '../../../shared/components/Modal';
import contractsAPI from '../api/contracts-api';
import ContractDocumentView from './ContractDocumentView';
import { buildContractPrintPage } from '../utils/contractDocumentHtml';

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
    win.document.write(buildContractPrintPage(doc.title, doc.content));
    win.document.close();
    win.focus();
    // Đợi font tải xong rồi mới in để chữ không bị nhảy font
    const print = () => win.print();
    if (win.document.fonts?.ready) win.document.fonts.ready.then(print);
    else setTimeout(print, 300);
  };

  return (
    <Modal
      title={doc?.title || 'Văn bản hợp đồng'}
      subtitle={`Phòng ${contract.room?.roomNumber || ''} · ${contract.representative?.fullName || contract.guestSnapshot?.fullName || ''}`}
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
        <ContractDocumentView content={doc.content} />
      )}
    </Modal>
  );
}
