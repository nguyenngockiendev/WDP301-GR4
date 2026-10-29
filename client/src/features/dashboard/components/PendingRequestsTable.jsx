import React from 'react';

export default function PendingRequestsTable() {
  const requests = [
    {
      id: 1,
      name: 'Nguyễn Văn Nam',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
      room: 'Phòng 101 (Lầu 1)',
      price: '3.500.000 đ',
      date: '01/11/2026',
    },
    {
      id: 2,
      name: 'Trần Thị Thảo',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
      room: 'Phòng 204 (Lầu 2)',
      price: '4.200.000 đ',
      date: '05/11/2026',
    },
  ];

  return (
    <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-extrabold text-slate-900">
          Yêu Cầu Thuê Chờ Duyệt
        </h3>
        <span className="text-xs font-bold text-emerald-700 cursor-pointer hover:underline">
          Xem tất cả 2 yêu cầu →
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px]">
              <th className="pb-3 px-2">Khách thuê</th>
              <th className="pb-3 px-2">Phòng</th>
              <th className="pb-3 px-2">Giá thuê</th>
              <th className="pb-3 px-2">Ngày dọn vào</th>
              <th className="pb-3 px-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60 font-medium">
            {requests.map((item) => (
              <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                <td className="py-3.5 px-2 flex items-center gap-3">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-8 h-8 rounded-full object-cover border border-emerald-100 shadow-2xs"
                  />
                  <span className="font-bold text-slate-900">{item.name}</span>
                </td>
                <td className="py-3.5 px-2 font-bold text-slate-700">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-800">
                    {item.room}
                  </span>
                </td>
                <td className="py-3.5 px-2 font-black text-slate-900">
                  {item.price}
                </td>
                <td className="py-3.5 px-2 text-slate-500 font-medium">
                  {item.date}
                </td>
                <td className="py-3.5 px-2 text-right space-x-2">
                  <button className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition cursor-pointer">
                    Phê Duyệt
                  </button>
                  <button className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs transition cursor-pointer">
                    Từ Chối
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
