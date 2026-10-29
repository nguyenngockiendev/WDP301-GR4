import React from 'react';
import StatCards from '../components/StatCards';
import RevenueChart from '../components/RevenueChart';
import UtilityRateWidget from '../components/UtilityRateWidget';
import PendingRequestsTable from '../components/PendingRequestsTable';

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hàng 1: 4 Thẻ chỉ số */}
      <StatCards />

      {/* Hàng 2: Biểu đồ doanh thu (2/3) + Widget Điện nước (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <UtilityRateWidget />
        </div>
      </div>

      {/* Hàng 3: Bảng danh sách yêu cầu thuê chờ duyệt */}
      <PendingRequestsTable />
    </div>
  );
}
