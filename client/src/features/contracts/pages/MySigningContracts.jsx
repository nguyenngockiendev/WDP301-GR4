import { useEffect, useState } from 'react';
import { ArrowRight, Building2, CalendarDays, FileText, FolderOpen, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../../shared/utils/format';
import contractsAPI from '../api/contracts-api';
import ContractStatusBadge from '../components/ContractStatusBadge';
import { signingLabels } from '../signingLabels';

const filters = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang hiệu lực' },
  { value: 'pending', label: 'Đang xử lý' },
  { value: 'history', label: 'Lịch sử' },
];

function contractGroup(contract) {
  if (['expired', 'terminated'].includes(contract.status)
      || ['rejected', 'withdrawn'].includes(contract.signing?.status)) return 'history';
  return contract.status === 'active' ? 'active' : 'pending';
}

function contractPriority(contract) {
  const group = contractGroup(contract);
  if (group === 'history') return 3;
  if (contract.signing?.status === 'awaiting_tenant') return 0;
  return group === 'active' ? 1 : 2;
}

function ContractCard({ contract }) {
  const signingStatus = contract.signing?.status;
  const group = contractGroup(contract);
  const needsSignature = group === 'pending' && signingStatus === 'awaiting_tenant';
  const room = contract.room;
  const title = contract.signing?.title || 'Hợp đồng thuê phòng';
  const roomLabel = room?.roomNumber ? `Phòng ${room.roomNumber}` : 'Phòng thuê';

  return (
    <li className="min-w-0">
      <Link
        to={`/contracts/${contract._id}/signing`}
        className="group flex h-full flex-col rounded-2xl border border-surface-border bg-white p-5 shadow-card transition hover:border-primary-200 hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${group === 'history' ? 'bg-slate-100 text-slate-500' : 'bg-primary-50 text-primary-dark'}`}>
              <Building2 size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="break-words text-lg font-extrabold leading-tight text-content-main">{roomLabel}</p>
              {room?.property?.name && <p className="mt-0.5 break-words text-xs text-content-sub">{room.property.name}</p>}
            </div>
          </div>
          {signingStatus === 'signed' || ['expired', 'terminated'].includes(contract.status) ? (
            <ContractStatusBadge status={contract.status} signingStatus={signingStatus} />
          ) : (
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${group === 'history' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-800'}`}>
              {signingLabels[signingStatus] || 'Đang xử lý'}
            </span>
          )}
        </div>

        <h3 className="mb-4 mt-4 flex-1 break-words text-sm font-semibold leading-relaxed text-content-sub">{title}</h3>

        <dl className="grid grid-cols-[auto_1fr_1fr] items-start gap-3 rounded-xl bg-surface-bg px-3 py-3">
          <CalendarDays size={16} className="mt-0.5 text-slate-500" aria-hidden="true" />
          <div>
            <dt className="text-xs text-content-sub">Bắt đầu</dt>
            <dd className="mt-1 text-sm font-bold tabular-nums text-content-main">{formatDate(contract.startDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-content-sub">Kết thúc</dt>
            <dd className="mt-1 text-sm font-bold tabular-nums text-content-main">{formatDate(contract.endDate)}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-surface-border pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-content-sub">
            <FileText size={14} aria-hidden="true" />
            {signingStatus === 'signed' ? signingLabels.signed : 'Hợp đồng điện tử'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-dark">
            {needsSignature ? 'Xem và ký' : 'Xem chi tiết'}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </li>
  );
}

export default function MySigningContracts() {
  const [contracts, setContracts] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    contractsAPI.getMySigningContracts()
      .then(response => { if (current) setContracts(response.data || []); })
      .catch(error => {
        if (current) setError(error.response?.data?.message || 'Không tải được hợp đồng.');
      });
    return () => { current = false; };
  }, [loadAttempt]);

  const allContracts = contracts || [];
  const counts = { all: allContracts.length, active: 0, pending: 0, history: 0 };
  for (const contract of allContracts) counts[contractGroup(contract)] += 1;
  const visibleContracts = allContracts
    .filter(contract => filter === 'all' || contractGroup(contract) === filter)
    .sort((a, b) => contractPriority(a) - contractPriority(b));

  return (
    <section className="mx-auto max-w-6xl space-y-5 py-6 sm:py-8">
      <header className="relative isolate overflow-hidden rounded-3xl bg-emerald-950 p-6 text-white sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-28 -z-10 h-96 w-96 rounded-full border-[36px] border-emerald-400/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-36 -z-10 h-[28rem] w-[28rem] rounded-full border border-emerald-400/25" />
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-200">
              <FileText size={16} aria-hidden="true" /> Hồ sơ thuê phòng
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Hợp đồng của tôi</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-emerald-100">Theo dõi thời hạn thuê, tiến độ ký và xem lại các hợp đồng trước đây.</p>
          </div>
          <dl className="grid grid-cols-3 gap-2 sm:gap-3">
            {filters.slice(1).map(({ value, label }) => (
              <div key={value} className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 sm:min-w-[7.75rem] sm:px-4">
                <dt className="text-xs text-emerald-100">{label}</dt>
                <dd className="mt-1 text-2xl font-extrabold leading-tight tabular-nums">{contracts ? counts[value] : '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800">
          <p role="alert">{error}</p>
          <button type="button" className="inline-flex items-center gap-2 font-bold hover:underline"
            onClick={() => { setError(''); setLoadAttempt(attempt => attempt + 1); }}>
            <RotateCw size={15} aria-hidden="true" /> Thử lại
          </button>
        </div>
      )}

      {!contracts && !error && (
        <div role="status" className="rounded-2xl border border-surface-border bg-white p-6 text-sm text-content-sub">
          Đang tải hợp đồng…
        </div>
      )}

      {contracts && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-content-main">Danh sách hợp đồng</h2>
            <div role="group" aria-label="Lọc hợp đồng" className="flex flex-wrap gap-1 rounded-xl border border-surface-border bg-white p-1">
              {filters.map(({ value, label }) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${filter === value ? 'bg-primary-900 text-white' : 'text-content-sub hover:bg-surface-bg'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {visibleContracts.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {visibleContracts.map(contract => <ContractCard key={contract._id} contract={contract} />)}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-surface-border bg-white/85 px-5 py-10 text-center">
              <FolderOpen size={26} className="mx-auto mb-3 text-primary" aria-hidden="true" />
              <p className="font-bold text-content-main">
                {contracts.length ? 'Chưa có hợp đồng trong mục này' : 'Chưa có hợp đồng được gửi ký'}
              </p>
              <p className="mt-1 text-sm text-content-sub">
                {contracts.length ? 'Chọn bộ lọc khác để xem hợp đồng.' : 'Hợp đồng sẽ xuất hiện tại đây khi quản lý gửi cho bạn.'}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
