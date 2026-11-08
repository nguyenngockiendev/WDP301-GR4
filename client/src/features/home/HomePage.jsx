import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../shared/api/axiosClient';
import {
  Building,
  Building2,
  Home,
  KeyRound,
  ShieldCheck,
  Zap,
  Droplets,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Calculator,
  MapPin,
  Check,
  Layers,
  LayoutGrid,
} from 'lucide-react';
import './home.css';

const buildingImages = [
  '/images/haven-building-1.jpg',
  '/images/haven-building-2.jpg',
  '/images/haven-building-3.jpg',
];

const emptyBuilding = {
  id: '',
  name: 'Chưa có nhà trọ',
  code: '',
  district: '',
  address: '',
  description: '',
  totalFloors: 0,
  totalRooms: 0,
  availableRooms: 0,
  occupiedRooms: 0,
  reservedRooms: 0,
  occupancyRate: 0,
  electricPrice: 0,
  waterPrice: 0,
  image: buildingImages[0],
  rooms: [],
};

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [activeBuildingId, setActiveBuildingId] = useState('');
  const [activeFloor, setActiveFloor] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [propertyError, setPropertyError] = useState('');

  const [kwh, setKwh] = useState(120);
  const [waterM3, setWaterM3] = useState(6);

  useEffect(() => {
    api.get('/properties/public')
      .then(response => {
        const properties = (response.data || []).map((property, index) => ({
          ...property,
          image: buildingImages[index % buildingImages.length],
          rooms: (property.rooms || []).map((room, roomIndex) => ({
            ...room,
            image: room.image || `/images/haven-room-${(roomIndex % 3) + 1}.jpg`,
          })),
        }));
        setBuildings(properties);
        setActiveBuildingId(properties[0]?.id || '');
      })
      .catch(error => {
        setPropertyError(error.response?.data?.message || 'Không tải được danh sách nhà trọ.');
      })
      .finally(() => setLoadingBuildings(false));
  }, []);

  const currentBuilding =
    buildings.find(building => building.id === activeBuildingId) || buildings[0] || emptyBuilding;

  const totalRooms = buildings.reduce(
    (total, building) => total + building.totalRooms,
    0
  );
  const availableRooms = buildings.reduce(
    (total, building) => total + building.availableRooms,
    0
  );
  const occupiedRooms = buildings.reduce(
    (total, building) => total + building.occupiedRooms,
    0
  );
  const occupancyRate = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const roomBasePrice = currentBuilding.rooms.find(room => room.status === 'available')?.price || 0;
  const electricRate = currentBuilding.electricPrice;
  const waterRate = currentBuilding.waterPrice;
  const totalCost = roomBasePrice + kwh * electricRate + waterM3 * waterRate;

  const filteredRooms =
    activeFloor === 'all'
      ? currentBuilding.rooms
      : currentBuilding.rooms.filter(r => r.floor === Number(activeFloor));

  return (
    <div className="min-h-screen bg-[#eaf4f4] text-slate-800 font-sans selection:bg-[#098b6c] selection:text-white">
      <header className="sticky top-0 z-50 haven-glass border-b border-slate-200/80 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-[#098b6c] flex items-center justify-center text-white shadow-md shadow-emerald-800/20 group-hover:scale-105 transition-transform">
              <Home size={24} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight block leading-tight">
                Haven Stay
              </span>
              <span className="text-[11px] font-semibold text-[#098b6c] block -mt-0.5 tracking-wide">
                Hệ thống Quản lý Nhiều Tòa Nhà & Phòng Trọ
              </span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#tong-quan" className="hover:text-[#098b6c] transition-colors">
              Tổng quan
            </a>
            <a href="#he-thong-toa-nha" className="hover:text-[#098b6c] transition-colors">
              Hệ thống tòa nhà
            </a>
            <a href="#tinh-nang" className="hover:text-[#098b6c] transition-colors">
              Tính năng
            </a>
            <a href="#dien-nuoc" className="hover:text-[#098b6c] transition-colors">
              Tính điện nước
            </a>
            <Link
              to="/browse-rooms"
              className="text-[#098b6c] font-bold flex items-center gap-1 hover:underline"
            >
              <span>Tìm phòng</span>
              <ChevronRight size={15} />
            </Link>
          </nav>
          <div className="hidden sm:flex items-center gap-3.5">
            <Link
              to="/login"
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#098b6c] transition-colors"
            >
              Đăng Nhập
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-2xl bg-[#098b6c] hover:bg-[#077a5e] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/15 hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Bắt Đầu Ngay</span>
              <ArrowRight size={16} />
            </Link>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-6 space-y-3 bg-white border-b border-slate-200 shadow-xl animate-fade-in-up">
            <a
              href="#tong-quan"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Tổng quan
            </a>
            <a
              href="#he-thong-toa-nha"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Hệ thống tòa nhà
            </a>
            <a
              href="#tinh-nang"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Tính năng
            </a>
            <a
              href="#dien-nuoc"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Tính điện nước
            </a>
            <Link
              to="/browse-rooms"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold text-[#098b6c] hover:bg-emerald-50 rounded-xl"
            >
              Tìm phòng ngay
            </Link>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl"
              >
                Đăng Nhập
              </Link>
              <Link
                to="/register"
                className="w-full text-center py-2.5 text-sm font-bold bg-[#098b6c] text-white rounded-xl shadow-sm"
              >
                Bắt Đầu Ngay
              </Link>
            </div>
          </div>
        )}
      </header>
      <section
        id="tong-quan"
        className="relative pt-8 pb-16 sm:pt-14 sm:pb-24 overflow-hidden"
      >
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-teal-200/50 filter blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-10 w-96 h-96 rounded-full bg-emerald-200/50 filter blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-emerald-200 text-xs font-bold text-[#098b6c] shadow-sm backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-[#098b6c] animate-ping" />
                <span>Smart Multi-Property Management 2026</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[45px] font-black text-slate-900 tracking-tight leading-[1.15]">
                Quản lý nhiều tòa nhà & căn hộ thông minh,{' '}
                <span className="text-[#098b6c] relative inline-block">
                  chính xác từng số điện nước.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-xl">
                Quản lý tập trung toàn bộ danh mục bất động sản: từ việc phân bổ tòa nhà, sơ đồ phòng từng tầng, đến tự động hóa chốt chỉ số điện nước và hóa đơn hàng tháng theo thời gian thực.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#he-thong-toa-nha"
                  className="px-7 py-3.5 rounded-2xl bg-[#098b6c] hover:bg-[#077a5e] text-white text-sm font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center gap-2 group"
                >
                  <Building2 size={18} />
                  <span>Khám phá các tòa nhà</span>
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </a>
                <Link
                  to="/login"
                  className="px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-800 hover:border-[#098b6c] hover:text-[#098b6c] text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                >
                  <Home size={18} className="text-[#098b6c]" />
                  <span>Vào Bảng Điều Khiển</span>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200/60 max-w-lg">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <CheckCircle2 size={16} className="text-[#098b6c] flex-shrink-0" />
                  <span>Quản lý đa tòa nhà</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <CheckCircle2 size={16} className="text-[#098b6c] flex-shrink-0" />
                  <span>Sơ đồ phòng từng tầng</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <CheckCircle2 size={16} className="text-[#098b6c] flex-shrink-0" />
                  <span>Chốt điện nước 1 chạm</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-6 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-400/20 to-emerald-400/30 rounded-[36px] filter blur-xl transform rotate-1 scale-95" />

              <div className="relative bg-white border border-slate-200/90 rounded-[32px] p-4 sm:p-6 shadow-2xl shadow-emerald-950/15 backdrop-blur-md animate-float-slow">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#098b6c] flex items-center justify-center text-white font-bold shadow-sm">
                      <Building size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          HavenStay
                        </span>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-[#098b6c]">
                          MULTI-BUILDING PRO
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block -mt-0.5">
                        Tổng hợp: {buildings.length} tòa nhà · {totalRooms} phòng
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 rounded-xl bg-[#098b6c] text-white text-xs font-bold shadow-sm hover:bg-[#077a5e] transition-colors flex items-center gap-1.5"
                  >
                    <span>+ Quản Lý Tòa Nhà</span>
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
                  <div className="p-3 rounded-2xl bg-[#f8fbfa] border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
                      SỐ TÒA NHÀ
                    </span>
                    <span className="text-sm sm:text-base font-black text-slate-900 block mt-0.5">
                      {buildings.length}
                    </span>
                    <span className="inline-block mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md">
                      đang hoạt động
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#eefaf5] border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-tight block">
                      TỔNG SỐ PHÒNG
                    </span>
                    <span className="text-sm sm:text-base font-black text-emerald-900 block mt-0.5">
                      {totalRooms}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-700 block mt-1">
                      tại {buildings.length} tòa nhà
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#fffbf0] border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-tight block">
                      PHÒNG CÒN TRỐNG
                    </span>
                    <span className="text-sm sm:text-base font-black text-amber-900 block mt-0.5">
                      {availableRooms}
                    </span>
                    <span className="text-[9px] font-semibold text-amber-700 block mt-1">
                      sẵn sàng cho thuê
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#f8fbfa] border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
                      TỶ LỆ ĐANG THUÊ
                    </span>
                    <span className="text-sm sm:text-base font-black text-slate-900 block mt-0.5">
                      {occupancyRate}%
                    </span>
                    <span className="text-[9px] font-semibold text-slate-500 block mt-1">
                      {occupiedRooms}/{totalRooms} phòng
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                  <div className="sm:col-span-7 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-black text-slate-800 block">
                          Phòng trống theo tòa
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Số phòng hiện sẵn sàng cho thuê
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#098b6c]">
                        <span className="w-2 h-2 rounded-full bg-[#098b6c]" />
                        <span>{availableRooms} phòng trống</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      {buildings.map(building => {
                        const percent = building.totalRooms
                          ? (building.availableRooms / building.totalRooms) * 100
                          : 0;

                        return (
                          <div key={building.id}>
                            <div className="mb-1 flex justify-between text-[10px] text-slate-600">
                              <span>{building.name}</span>
                              <span>{building.availableRooms}/{building.totalRooms}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[#098b6c]"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {!buildings.length && (
                        <p className="text-xs text-slate-400">Chưa có dữ liệu nhà trọ.</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-5 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-black text-slate-800 block mb-2">
                      Đơn giá điện nước
                    </span>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-[#eefaf5] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#098b6c] text-white flex items-center justify-center">
                            <Zap size={14} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">Điện</span>
                        </div>
                        <span className="text-xs font-black text-slate-900">
                          {currentBuilding.electricPrice.toLocaleString('vi-VN')} <small className="text-[9px] font-normal">đ/kWh</small>
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#e8f6f8] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                            <Droplets size={14} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">Nước</span>
                        </div>
                        <span className="text-xs font-black text-slate-900">
                          {currentBuilding.waterPrice.toLocaleString('vi-VN')} <small className="text-[9px] font-normal">đ/m³</small>
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 block text-center mt-2">
                      Đơn giá của {currentBuilding.name}
                    </span>
                  </div>
                </div>

                <div className="absolute -bottom-5 -left-3 sm:-left-6 p-2.5 px-3.5 rounded-2xl bg-slate-900/90 text-white text-xs font-semibold shadow-xl flex items-center gap-2.5 backdrop-blur-md animate-float-reverse">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{currentBuilding.name}: {currentBuilding.availableRooms} phòng trống</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      <section id="he-thong-toa-nha" className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#098b6c] mb-3">
              <Building2 size={15} />
              <span>HỆ THỐNG ĐA TÒA NHÀ HAVEN STAY</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Quản Lý Nhiều Tòa Nhà — Một Tòa Nhiều Phòng
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Chọn tòa nhà để xem danh sách phòng, sơ đồ tầng và trạng thái phòng hiện tại.
            </p>
          </div>
          {loadingBuildings && <p className="mb-6 text-center text-sm text-slate-500">Đang tải danh sách nhà trọ...</p>}
          {propertyError && <p className="mb-6 text-center text-sm text-red-600">{propertyError}</p>}
          {!loadingBuildings && !propertyError && !buildings.length && (
            <p className="mb-6 text-center text-sm text-slate-500">Chưa có nhà trọ đang hoạt động.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {buildings.map(bld => {
              const isActive = bld.id === activeBuildingId;
              return (
                <button
                  key={bld.id}
                  onClick={() => {
                    setActiveBuildingId(bld.id);
                    setActiveFloor('all');
                  }}
                  className={`p-5 rounded-3xl text-left border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between group ${
                    isActive
                      ? 'bg-gradient-to-br from-[#063f31] to-[#042f2e] text-white border-[#098b6c] shadow-xl shadow-emerald-950/20 scale-[1.02]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                          isActive
                            ? 'bg-white/20 text-teal-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {bld.code}{bld.district && ` · ${bld.district}`}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-[#098b6c] text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        Còn {bld.availableRooms} phòng trống
                      </span>
                    </div>

                    <h3
                      className={`text-base sm:text-lg font-black tracking-tight ${
                        isActive ? 'text-white' : 'text-slate-900 group-hover:text-[#098b6c]'
                      }`}
                    >
                      {bld.name}
                    </h3>
                    <p
                      className={`text-xs mt-1 flex items-center gap-1.5 ${
                        isActive ? 'text-emerald-200/80' : 'text-slate-500'
                      }`}
                    >
                      <MapPin size={13} className="flex-shrink-0" />
                      <span className="truncate">{bld.address}</span>
                    </p>
                  </div>

                  <div
                    className={`pt-4 mt-4 border-t flex items-center justify-between text-xs font-medium ${
                      isActive ? 'border-white/10 text-emerald-100/80' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>Quy mô: <strong>{bld.totalFloors} Tầng</strong> ({bld.totalRooms} phòng)</span>
                    <span className="flex items-center gap-1 font-bold">
                      Tỷ lệ lấp đầy: {bld.occupancyRate}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="bg-[#f8fbfa] border border-slate-200 rounded-[32px] p-6 sm:p-8 mb-10 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden shadow-md h-64 sm:h-72">
                <img
                  src={currentBuilding.image}
                  alt={currentBuilding.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-xl">
                  {currentBuilding.code}{currentBuilding.district && ` — ${currentBuilding.district}`}
                </div>
                <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                  <span className="text-lg font-black block leading-tight">
                    {currentBuilding.name}
                  </span>
                  <span className="text-xs text-white/80 block mt-0.5">
                    {currentBuilding.address}
                  </span>
                </div>
              </div>
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#098b6c] uppercase tracking-wider block">
                      TỔNG QUAN TÒA NHÀ ĐANG XEM
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                      {currentBuilding.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-emerald-100 text-[#098b6c] text-xs font-bold">
                      Đang hoạt động
                    </span>
                  </div>
                </div>

                {currentBuilding.description && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {currentBuilding.description}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      TỔNG SỐ PHÒNG
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {currentBuilding.totalRooms} phòng
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Thiết kế {currentBuilding.totalFloors} tầng
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200">
                    <span className="text-[10px] text-emerald-700 font-bold block uppercase">
                      PHÒNG TRỐNG
                    </span>
                    <span className="text-base sm:text-lg font-black text-[#098b6c]">
                      {currentBuilding.availableRooms} phòng
                    </span>
                    <span className="text-[10px] text-emerald-600 block">
                      Sẵn sàng dọn vào
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      GIÁ ĐIỆN TÒA
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {currentBuilding.electricPrice.toLocaleString('vi-VN')} đ
                    </span>
                    <span className="text-[10px] text-slate-500 block">mỗi kWh</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      GIÁ NƯỚC TÒA
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {currentBuilding.waterPrice.toLocaleString('vi-VN')} đ
                    </span>
                    <span className="text-[10px] text-slate-500 block">mỗi m³</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Danh Sách Phòng Thuộc {currentBuilding.name}
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {filteredRooms.length} phòng hiển thị
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Lọc theo tầng để duyệt các phòng đang trống hoặc đang có người thuê.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200">
                <button
                  onClick={() => setActiveFloor('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFloor === 'all'
                      ? 'bg-[#098b6c] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả tầng
                </button>
                {Array.from({ length: currentBuilding.totalFloors }).map((_, idx) => {
                  const floorNum = idx + 1;
                  return (
                    <button
                      key={floorNum}
                      onClick={() => setActiveFloor(String(floorNum))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeFloor === String(floorNum)
                          ? 'bg-[#098b6c] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tầng {floorNum}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200">
                <button
                  onClick={() => setViewMode('cards')}
                  title="Xem danh sách thẻ phòng"
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white text-[#098b6c] shadow-sm'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('matrix')}
                  title="Xem ma trận sơ đồ phòng"
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'matrix'
                      ? 'bg-white text-[#098b6c] shadow-sm'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <Layers size={16} />
                </button>
              </div>
            </div>
          </div>
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
              {filteredRooms.map(room => (
                <div
                  key={room.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col group"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={room.image}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                    <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md text-white text-xs font-black">
                        {room.roomNumber}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-white/85 backdrop-blur-md text-slate-800 text-[11px] font-bold">
                        Tầng {room.floor}
                      </span>
                    </div>
                    <div className="absolute top-3.5 right-3.5">
                      {room.status === 'available' && (
                        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500 text-white shadow-md">
                          Phòng trống
                        </span>
                      )}
                      {room.status === 'occupied' && (
                        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-600/90 text-white backdrop-blur-md">
                          Đang thuê
                        </span>
                      )}
                      {room.status === 'reserved' && (
                        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-md">
                          Đang giữ cọc
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3.5 left-3.5 text-white">
                      <span className="text-xl font-black drop-shadow-md">
                        {room.price.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-xs text-white/90 font-medium"> / tháng</span>
                    </div>

                    <div className="absolute bottom-3.5 right-3.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-bold">
                      {room.area}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-[#098b6c] uppercase tracking-wider mb-1">
                        {room.tier}
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900 group-hover:text-[#098b6c] transition-colors leading-snug">
                        {room.name}
                      </h4>
                      <div className="flex flex-wrap gap-1.5 my-3.5">
                        {room.amenities.map(amenity => (
                          <span
                            key={amenity}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        to="/browse-rooms"
                        className="text-xs font-bold text-[#098b6c] hover:underline flex items-center gap-1"
                      >
                        <span>Chi tiết phòng</span>
                        <ArrowRight size={14} />
                      </Link>

                      {room.status === 'available' ? (
                        <Link
                          to="/login"
                          className="px-4 py-2 rounded-xl bg-[#098b6c] hover:bg-[#077a5e] text-white text-xs font-bold shadow-md shadow-emerald-900/15 transition-all"
                        >
                          Đăng ký thuê
                        </Link>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium">
                          {room.status === 'occupied' ? 'Đã có khách' : 'Đang giữ cọc'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {viewMode === 'matrix' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md animate-fade-in-up">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800">
                  Sơ Đồ Tầng & Phòng — {currentBuilding.name}
                </span>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Trống ({currentBuilding.availableRooms})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-400" />
                    <span>Đang thuê ({currentBuilding.occupiedRooms})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>Giữ cọc ({currentBuilding.reservedRooms})</span>
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {Array.from({ length: currentBuilding.totalFloors }).map((_, fIdx) => {
                  const floorNum = currentBuilding.totalFloors - fIdx; // Tầng cao xếp trên
                  const roomsOnThisFloor = currentBuilding.rooms.filter(
                    r => r.floor === floorNum
                  );

                  return (
                    <div
                      key={floorNum}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="w-24 flex-shrink-0">
                        <span className="text-xs font-black text-slate-800 block">
                          TẦNG {floorNum}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {roomsOnThisFloor.length} phòng
                        </span>
                      </div>

                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {roomsOnThisFloor.map(r => (
                          <div
                            key={r.id}
                            className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                              r.status === 'available'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:shadow-md'
                                : r.status === 'reserved'
                                ? 'bg-amber-50 border-amber-200 text-amber-950'
                                : 'bg-slate-100 border-slate-200 text-slate-500 opacity-80'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-xs">{r.roomNumber}</span>
                              <span className="text-[9px] font-bold uppercase">
                                {r.status === 'available'
                                  ? 'Trống'
                                  : r.status === 'reserved'
                                  ? 'Cọc'
                                  : 'Đã thuê'}
                              </span>
                            </div>
                            <div className="text-[10px] font-medium mt-1">
                              {r.area} · {(r.price / 1000000).toFixed(1)} tr
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/browse-rooms"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-[#098b6c] text-white text-sm font-bold shadow-md transition-all group"
            >
              <span>Xem toàn bộ danh sách phòng của {buildings.length} tòa nhà</span>
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </div>
      </section>
      <section id="tinh-nang" className="py-20 bg-[#063f31] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 filter blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-[#2dd4bf] mb-4 backdrop-blur-md">
              <Sparkles size={14} />
              <span>Smart Property Management 2026</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
              Bộ tính năng chuyên biệt giúp vận hành chuỗi tòa nhà tối giản
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-3 leading-relaxed">
              Thiết kế dành riêng cho chủ trọ quản lý đồng thời nhiều tòa nhà, phân quyền quản lý viên từng tòa và người thuê phòng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white/[0.07] border border-white/10 backdrop-blur-md hover:bg-white/[0.12] transition-all duration-300 group haven-interactive-card">
              <div className="w-12 h-12 rounded-2xl bg-[#095240] text-[#2dd4bf] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Home size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Quản Lý Phòng Trống & Đang Thuê
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/75 leading-relaxed mb-4">
                Theo dõi trạng thái phòng tức thì trên sơ đồ trực quan. Phân loại phòng trống, phòng đang thuê và lịch bảo trì thiết bị trong toàn bộ các tòa nhà.
              </p>
              <ul className="space-y-2 text-xs text-emerald-200/90 border-t border-white/10 pt-4">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#2dd4bf]" />
                  <span>Sơ đồ phòng theo tầng & tòa</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#2dd4bf]" />
                  <span>Tự động tính tỷ lệ lấp đầy</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-white/[0.07] border border-white/10 backdrop-blur-md hover:bg-white/[0.12] transition-all duration-300 group haven-interactive-card">
              <div className="w-12 h-12 rounded-2xl bg-[#095240] text-[#2dd4bf] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <KeyRound size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Hợp Đồng & Tiền Cọc Minh Bạch
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/75 leading-relaxed mb-4">
                Lưu trữ hồ sơ khách thuê an toàn, tự động cảnh báo khi sắp hết hạn hợp đồng thuê phòng trước 15-30 ngày để chủ nhà chủ động xử lý gia hạn.
              </p>
              <ul className="space-y-2 text-xs text-emerald-200/90 border-t border-white/10 pt-4">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#2dd4bf]" />
                  <span>Ký hợp đồng thuê phòng online</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#2dd4bf]" />
                  <span>Quản lý cọc & hoàn cọc minh bạch</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-white/[0.07] border border-white/10 backdrop-blur-md hover:bg-white/[0.12] transition-all duration-300 group haven-interactive-card">
              <div className="w-12 h-12 rounded-2xl bg-[#095240] text-[#2dd4bf] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Chốt Điện Nước & Xuất Hoá Đơn
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/75 leading-relaxed mb-4">
                Ghi nhận chỉ số điện nước theo công tơ hàng tháng, tự động tính tổng tiền theo đơn giá từng tòa và gửi hóa đơn kèm mã QR thanh toán trực tiếp.
              </p>
              <ul className="space-y-2 text-xs text-emerald-200/90 border-t border-white/10 pt-4">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#2dd4bf]" />
                  <span>Nhập số điện, số nước bằng mobile</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#2dd4bf]" />
                  <span>Xuất hóa đơn PDF & mã VietQR</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section id="dien-nuoc" className="py-20 bg-[#eaf4f4] relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-slate-200/90 shadow-2xl shadow-emerald-900/10">
            <div className="text-center max-w-xl mx-auto mb-8">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#098b6c] uppercase tracking-wider mb-2">
                <Calculator size={14} />
                <span>Minh bạch chi phí hàng tháng</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Ước Tính Tiền Thuê & Điện Nước Tự Động
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Kéo thanh trượt để trải nghiệm công thức tính toán hóa đơn tự động chuẩn Haven Stay.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2 p-4 rounded-2xl bg-[#edf3fc]">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="flex items-center gap-2 text-slate-800">
                      <Zap size={16} className="text-[#098b6c]" />
                      <span>Số điện tiêu thụ hàng tháng</span>
                    </span>
                    <span className="text-[#098b6c] font-black text-sm">
                      {kwh} kWh <small className="text-slate-500 font-normal">(@{electricRate.toLocaleString('vi-VN')}đ)</small>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="500"
                    step="5"
                    value={kwh}
                    onChange={e => setKwh(Number(e.target.value))}
                    className="w-full accent-[#098b6c] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>20 kWh</span>
                    <span>250 kWh</span>
                    <span>500 kWh</span>
                  </div>
                </div>

                <div className="space-y-2 p-4 rounded-2xl bg-[#edf3fc]">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="flex items-center gap-2 text-slate-800">
                      <Droplets size={16} className="text-teal-600" />
                      <span>Số nước tiêu thụ hàng tháng</span>
                    </span>
                    <span className="text-teal-700 font-black text-sm">
                      {waterM3} m³ <small className="text-slate-500 font-normal">(@{waterRate.toLocaleString('vi-VN')}đ)</small>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={waterM3}
                    onChange={e => setWaterM3(Number(e.target.value))}
                    className="w-full accent-[#098b6c] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 m³</span>
                    <span>10 m³</span>
                    <span>20 m³</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 rounded-3xl bg-[#063f31] text-white flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                    TỔNG TIỀN DỰ KIẾN / THÁNG
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white mt-2">
                    {totalCost.toLocaleString('vi-VN')} đ
                  </div>
                  <p className="text-[11px] text-emerald-200/80 mt-1">
                    Tiền phòng mẫu tại {currentBuilding.name}: {roomBasePrice.toLocaleString('vi-VN')} đ
                  </p>
                </div>

                <div className="space-y-2 my-5 text-xs text-emerald-100/90 border-t border-white/10 pt-4">
                  <div className="flex justify-between">
                    <span>Tiền điện ({kwh} kWh):</span>
                    <span className="font-bold">
                      {(kwh * electricRate).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiền nước ({waterM3} m³):</span>
                    <span className="font-bold">
                      {(waterM3 * waterRate).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí dịch vụ khác:</span>
                    <span className="font-bold text-[#2dd4bf]">Chưa tính</span>
                  </div>
                </div>

                <Link
                  to="/register"
                  className="w-full py-3 rounded-2xl bg-[#098b6c] hover:bg-[#077a5e] text-white text-xs font-bold text-center shadow-lg transition-colors"
                >
                  Đăng Ký Thuê Ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[36px] bg-gradient-to-r from-[#022c22] via-[#063f31] to-[#042f2e] text-white p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl mx-auto space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 text-[#2dd4bf] flex items-center justify-center mx-auto border border-white/15">
                <Home size={30} />
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
                Sẵn sàng nâng tầm không gian sống và quản lý cùng Haven Stay?
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed font-normal">
                Tham gia nền tảng ngay hôm nay để trải nghiệm quy trình quản lý chuỗi tòa nhà & cho thuê phòng trọ hiện đại, nhanh chóng và chính xác.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
                <Link
                  to="/register"
                  className="px-8 py-3.5 rounded-2xl bg-[#098b6c] hover:bg-[#077a5e] text-white text-sm font-bold shadow-lg shadow-black/20 transition-all"
                >
                  Tạo Tài Khoản Ngay
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/15 transition-all"
                >
                  Vào Bảng Điều Khiển
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="bg-white border-t border-slate-200 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#098b6c] text-white flex items-center justify-center">
              <Home size={18} />
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900 block leading-none">
                Haven Stay
              </span>
              <span className="text-[10px] text-slate-400">
                Hệ thống Quản lý Đa Tòa Nhà & Phòng Trọ 2026
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold">
            <a href="#tong-quan" className="hover:text-[#098b6c]">
              Trang chủ
            </a>
            <a href="#he-thong-toa-nha" className="hover:text-[#098b6c]">
              Hệ thống tòa nhà
            </a>
            <a href="#tinh-nang" className="hover:text-[#098b6c]">
              Tính năng
            </a>
            <Link to="/login" className="hover:text-[#098b6c]">
              Bảng điều khiển
            </Link>
            <Link to="/register" className="hover:text-[#098b6c]">
              Đăng ký
            </Link>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-400">
            © 2026 WDP301-GR4 — Nhánh HungTP
          </div>
        </div>
      </footer>
    </div>
  );
}
