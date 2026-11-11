import React from 'react';
import { FileSignature } from 'lucide-react';
import ContractItem from './ContractItem';

export default function ContractList({ contracts, onEdit, onRefresh, readOnly = false }) {
  if (contracts.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center text-center rounded-3xl bg-white/85 border border-white/90">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
          <FileSignature size={26} />
        </div>
        <p className="text-sm font-extrabold text-slate-800">Không có hợp đồng nào</p>
        <p className="text-xs text-slate-400 mt-1">Tạo hợp đồng mới hoặc thay đổi bộ lọc.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {contracts.map(contract => (
        <ContractItem key={contract._id} contract={contract} onEdit={onEdit} onRefresh={onRefresh} readOnly={readOnly} />
      ))}
    </div>
  );
}
