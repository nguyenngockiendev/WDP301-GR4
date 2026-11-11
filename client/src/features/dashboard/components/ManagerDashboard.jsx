import StatCards from './StatCards';
import RevenueChart from './RevenueChart';
import UtilityRateWidget from './UtilityRateWidget';
import PendingRequestsTable from './PendingRequestsTable';
export default function ManagerDashboard({ dashboard }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        {dashboard.properties.find(item => item._id === dashboard.selectedPropertyId)?.name ||
          'Chưa chọn nhà trọ'}{' '}
        · {dashboard.activeContracts} hợp đồng còn hiệu lực · {dashboard.checkoutRequestCount} yêu
        cầu trả phòng chờ xử lý
      </p>
      <StatCards dashboard={dashboard} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart revenue={dashboard.revenue} />
        </div>
        <UtilityRateWidget rate={dashboard.utilityRate} />
      </div>
      <PendingRequestsTable dashboard={dashboard} />
    </div>
  );
}
