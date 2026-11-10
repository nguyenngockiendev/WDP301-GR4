import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import contractsAPI from '../api/contracts-api';
import { signingLabels } from '../signingLabels';

export default function MySigningContracts() {
  const [contracts, setContracts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    contractsAPI.getMySigningContracts()
      .then(response => { if (current) setContracts(response.data); })
      .catch(error => {
        if (current) setError(error.response?.data?.message || 'Không tải được hợp đồng.');
      });
    return () => { current = false; };
  }, []);

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-black text-slate-900">Hợp đồng của tôi</h1>
      {error && <p role="alert" className="text-rose-700">{error}</p>}
      {!error && !contracts && <p role="status">Đang tải hợp đồng…</p>}
      {contracts?.length === 0 && <p className="text-slate-600">Chưa có hợp đồng được gửi ký.</p>}
      {contracts?.map(contract => (
        <Link key={contract._id} to={`/contracts/${contract._id}/signing`} className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-emerald-400">
          <strong>{contract.signing.title || 'Hợp đồng thuê phòng'}</strong>
          <p className="mt-1 text-sm text-slate-600">Phòng {contract.room?.roomNumber} · {signingLabels[contract.signing.status]}</p>
        </Link>
      ))}
    </section>
  );
}
