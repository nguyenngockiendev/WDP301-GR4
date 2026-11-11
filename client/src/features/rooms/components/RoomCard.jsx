import { ArrowRight, MapPin, Ruler, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../../shared/utils/format';
import RoomImage from './RoomImage';

export default function RoomCard({ room }) {
  const roomNumber = String(room.roomNumber || '').trim();
  const title = /^phòng(?:\s|$)/iu.test(roomNumber) ? roomNumber : `Phòng ${roomNumber || 'cho thuê'}`;
  const facilities = room.facilities || [];
  const hasArea = Number(room.area) > 0;
  const pricePerArea = hasArea ? Math.round(Number(room.price) / Number(room.area)) : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-surface-border bg-white shadow-card transition hover:border-primary-200 hover:shadow-soft">
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-bg">
        <RoomImage src={room.images?.[0]} alt={title} className="h-full w-full object-cover" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-primary-dark shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" /> Còn trống
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="break-words text-lg font-extrabold leading-tight text-content-main">{title}</h3>
        <div className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-content-sub">
          <MapPin size={14} className="mt-0.5 shrink-0 text-primary-dark" aria-hidden="true" />
          <p className="min-w-0 break-words">
            <span className="font-semibold">{room.property?.name || 'Nhà trọ'}</span>
            {room.property?.address && <span className="block">{room.property.address}</span>}
          </p>
        </div>

        <p className="mt-4 text-xl font-extrabold tabular-nums text-primary-dark">
          {formatCurrency(room.price)} <span className="text-xs font-medium text-content-sub">/ tháng</span>
        </p>
        <ul className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-content-sub">
          {hasArea && <li className="inline-flex items-center gap-1.5 rounded-lg bg-surface-bg px-2.5 py-1.5"><Ruler size={14} aria-hidden="true" /> {room.area} m²</li>}
          <li className="inline-flex items-center gap-1.5 rounded-lg bg-surface-bg px-2.5 py-1.5"><Users size={14} aria-hidden="true" /> Tối đa {room.maxTenants || 1} người</li>
        </ul>
        {facilities.length > 0 && (
          <ul aria-label="Tiện nghi" className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-content-sub">
            {facilities.slice(0, 3).map((facility, index) => (
              <li key={index} className="max-w-full break-words rounded-full border border-surface-border px-2.5 py-1">{facility}</li>
            ))}
            {facilities.length > 3 && <li className="rounded-full border border-surface-border px-2.5 py-1">+{facilities.length - 3}</li>}
          </ul>
        )}

        <div className="mt-auto pt-4">
          <p className="text-xs leading-relaxed text-content-sub">
            {Number.isFinite(pricePerArea) && `${formatCurrency(pricePerArea)}/m²/tháng · `}Điện, nước tính theo mức sử dụng.
          </p>
          <Link
            to={`/rooms/${room._id}`}
            aria-label={`Xem chi tiết ${title}`}
            className="mt-3 flex items-center justify-between gap-2 rounded-lg border-t border-surface-border pt-3 text-sm font-extrabold text-primary-dark hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Xem chi tiết <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
