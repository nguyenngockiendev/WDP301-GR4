import { Link } from 'react-router-dom';
export default function PendingRequestsTable({ dashboard }) {
  const path = dashboard.selectedPropertyId
    ? `/properties/${dashboard.selectedPropertyId}/rental-requests`
    : '/rental-requests';
  return (
    <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
      <div className="flex flex-wrap justify-between gap-3 mb-5">
        <h3 className="text-sm font-extrabold text-slate-900">Yêu Cầu Thuê Chờ Duyệt</h3>
        <Link to={path} className="text-xs font-bold text-emerald-700">
          Xem tất cả {dashboard.pendingCount} yêu cầu →
        </Link>
      </div>
      {!dashboard.pendingRequests.length ? (
        <p className="text-sm text-slate-500">Không có yêu cầu thuê chờ duyệt.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-slate-400">
                {['Khách thuê', 'Phòng', 'Ngày dọn vào', 'Thao tác'].map(label => (
                  <th key={label} className="p-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dashboard.pendingRequests.map(item => (
                <tr key={item._id} className="border-b border-slate-100">
                  <td className="p-3 font-bold">{item.tenant?.fullName || '—'}</td>
                  <td className="p-3">{item.room?.roomNumber || '—'}</td>
                  <td className="p-3">{new Date(item.expectedDate).toLocaleDateString('vi-VN')}</td>
                  <td className="p-3">
                    <Link
                      className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white"
                      to={path}
                    >
                      Xem yêu cầu
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-400">
            Tối đa 10 yêu cầu mới nhất. Duyệt hoặc từ chối tại màn quản lý yêu cầu.
          </p>
        </div>
      )}
    </div>
  );
}
