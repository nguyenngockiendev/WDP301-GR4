import { useEffect, useState } from 'react';
import { ArrowLeft, House, RotateCcw, Search, SearchX, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../../shared/utils/format';
import roomsAPI from '../api/rooms-api';
import RoomCard from '../components/RoomCard';

const emptyFilters = { minPrice: '', maxPrice: '' };
const priceFields = [
  { name: 'minPrice', label: 'Giá tối thiểu', placeholder: '0' },
  { name: 'maxPrice', label: 'Giá tối đa', placeholder: 'Không giới hạn' },
];

function priceSummary({ minPrice, maxPrice }) {
  if (minPrice !== '' && maxPrice !== '') return `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}/tháng`;
  if (minPrice !== '') return `Từ ${formatCurrency(minPrice)}/tháng`;
  if (maxPrice !== '') return `Đến ${formatCurrency(maxPrice)}/tháng`;
  return 'Mọi mức giá';
}

export default function BrowseRooms({ embedded = false }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [filterError, setFilterError] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const params = Object.fromEntries(Object.entries(appliedFilters).filter(([, value]) => value !== ''));
    setLoading(true);
    setLoadError('');
    roomsAPI.searchAvailableRooms(params, controller.signal)
      .then(response => {
        if (!controller.signal.aborted) setRooms(response.data || []);
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setLoadError(error.response?.data?.message || 'Không tải được danh sách phòng.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [appliedFilters]);

  const handleSearch = event => {
    event.preventDefault();
    const { minPrice, maxPrice } = filters;
    if (minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)) {
      setFilterError('Giá tối thiểu không được lớn hơn giá tối đa.');
      return;
    }
    setFilterError('');
    setAppliedFilters({ ...filters });
  };

  const handleReset = () => {
    setFilters(emptyFilters);
    setFilterError('');
    setAppliedFilters({ ...emptyFilters });
  };
  const hasPriceFilter = appliedFilters.minPrice !== '' || appliedFilters.maxPrice !== '';
  const Content = embedded ? 'div' : 'main';

  return (
    <div className={embedded ? undefined : 'min-h-screen bg-surface-bg'}>
      {!embedded && (
        <header className="border-b border-surface-border bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link to="/" className="inline-flex items-center gap-2.5 rounded-lg font-extrabold tracking-tight text-content-main focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-900 text-white">
                <House size={18} aria-hidden="true" />
              </span>
              HavenStay
            </Link>
            <Link to="/" className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-bold text-primary-dark hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <ArrowLeft size={15} aria-hidden="true" /> Trang chủ
            </Link>
          </div>
        </header>
      )}

      <Content className={`mx-auto max-w-6xl space-y-5 py-6 sm:space-y-6 sm:py-8 ${embedded ? '' : 'px-4 sm:px-6'}`}>
        <section className="relative isolate overflow-hidden rounded-3xl bg-emerald-950 px-6 py-8 text-white sm:px-8 sm:py-10 md:pr-[44%]">
          <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 hidden w-[43%] md:block">
            <img src="/images/haven-hero-apartment.jpg" alt="" className="h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/20 to-transparent" />
          </div>
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-200">
            <House size={15} aria-hidden="true" /> Không gian cho thuê
          </p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Tìm phòng trống</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-emerald-100 sm:text-base">Chọn khoảng giá phù hợp rồi xem diện tích, tiện nghi và chi tiết từng phòng.</p>
        </section>

        <form onSubmit={handleSearch} aria-labelledby="price-filter-title" className="rounded-2xl border border-surface-border bg-white p-4 shadow-card sm:p-5">
          <h2 id="price-filter-title" className="flex items-center gap-2 text-sm font-extrabold text-content-main">
            <SlidersHorizontal size={17} className="text-primary-dark" aria-hidden="true" /> Khoảng giá thuê
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
            {priceFields.map(({ name, label, placeholder }) => (
              <label key={name} className="min-w-0 text-xs font-semibold text-content-sub">
                {label}
                <span className="relative mt-1.5 block">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    name={name}
                    value={filters[name]}
                    onChange={event => {
                      setFilters(previous => ({ ...previous, [name]: event.target.value }));
                      setFilterError('');
                    }}
                    placeholder={placeholder}
                    aria-invalid={Boolean(filterError)}
                    aria-describedby={filterError ? 'price-filter-error' : undefined}
                    className="w-full rounded-xl border border-surface-border bg-surface-bg px-3 py-2.5 pr-14 text-sm font-semibold text-content-main placeholder:font-normal focus:outline focus:outline-2 focus:outline-primary"
                  />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] text-content-sub">VNĐ</span>
                </span>
              </label>
            ))}
            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1">
              <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <Search size={16} aria-hidden="true" /> Tìm phòng
              </button>
              <button type="button" onClick={handleReset} className="inline-flex items-center justify-center gap-2 rounded-xl border border-surface-border px-3 py-2.5 text-sm font-bold text-content-sub hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <RotateCcw size={15} aria-hidden="true" /> Đặt lại
              </button>
            </div>
          </div>
          {filterError && <p id="price-filter-error" role="alert" className="mt-3 text-sm font-semibold text-rose-700">{filterError}</p>}
        </form>

        <section aria-labelledby="available-rooms-title" aria-busy={loading} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="available-rooms-title" className="text-lg font-extrabold text-content-main sm:text-xl">Phòng đang trống</h2>
            {!loading && !loadError && (
              <p role="status" className="rounded-full border border-surface-border bg-white px-3 py-1.5 text-xs font-semibold text-content-sub">
                <strong className="text-content-main">{rooms.length} phòng</strong> · {priceSummary(appliedFilters)}
              </p>
            )}
          </div>

          {loading ? (
            <>
              <p role="status" className="sr-only">Đang tải danh sách phòng.</p>
              <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(item => <div key={item} className="h-80 animate-pulse rounded-2xl border border-surface-border bg-white" />)}
              </div>
            </>
          ) : loadError || rooms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-surface-border bg-white px-5 py-10 text-center">
              <SearchX size={26} className="mx-auto mb-3 text-primary-dark" aria-hidden="true" />
              {loadError ? (
                <>
                  <p role="alert" className="font-bold text-content-main">{loadError}</p>
                  <button type="button" onClick={() => setAppliedFilters({ ...appliedFilters })} className="mt-3 text-sm font-bold text-primary-dark underline">Thử lại</button>
                </>
              ) : (
                <>
                  <p className="font-bold text-content-main">{hasPriceFilter ? 'Chưa có phòng trong khoảng giá này' : 'Hiện chưa có phòng trống'}</p>
                  {hasPriceFilter && <button type="button" onClick={handleReset} className="mt-3 text-sm font-bold text-primary-dark underline">Xem mọi mức giá</button>}
                </>
              )}
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map(room => (
                <li key={room._id} className="min-w-0"><RoomCard room={room} /></li>
              ))}
            </ul>
          )}
        </section>
      </Content>
    </div>
  );
}
