import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';
import {
  IconArrowRight,
  IconBuilding,
  IconContract,
  IconInvoice,
  IconRoom,
  IconShieldCheck,
  IconTrendingUp,
  IconZap,
} from '../../../shared/components/Icons';
import './home.css';

const highlights = [
  {
    icon: IconBuilding,
    number: '01',
    title: 'Quản lý dãy trọ',
    text: 'Theo dõi nhà trọ, phòng, người phụ trách và tình trạng hoạt động tại một nơi.',
  },
  {
    icon: IconContract,
    number: '02',
    title: 'Hợp đồng rõ ràng',
    text: 'Lưu giá thuê, tiền cọc và phí áp dụng tại thời điểm ký hợp đồng.',
  },
  {
    icon: IconZap,
    number: '03',
    title: 'Điện nước minh bạch',
    text: 'Ghi chỉ số theo kỳ và tính tiền theo mức sử dụng cùng đơn giá đã cấu hình.',
  },
  {
    icon: IconInvoice,
    number: '04',
    title: 'Hóa đơn dễ kiểm tra',
    text: 'Tách tiền phòng, điện, nước và dịch vụ thành từng dòng chi tiết.',
  },
];

const flow = [
  ['01', 'Tạo dãy và phòng', 'Khai báo diện tích, sức chứa, giá thuê và tiện nghi.'],
  ['02', 'Lập hợp đồng', 'Chọn phòng, người thuê và điều khoản áp dụng.'],
  ['03', 'Ghi chỉ số, tạo hóa đơn', 'Theo dõi các khoản thu theo từng kỳ.'],
];

export default function Home() {
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <main className="landing">
      <header className="landing-nav">
        <Link to="/" className="landing-brand" aria-label="Smart Rental trang chủ">
          <span className="landing-brand-mark">S</span>
          <span>Smart Rental</span>
        </Link>
        <nav className="landing-nav-actions" aria-label="Tài khoản">
          <Link className="landing-login" to="/login">Đăng nhập</Link>
          <Link className="landing-register" to="/register">Tạo tài khoản <IconArrowRight size={16} /></Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <div className="landing-eyebrow"><span /> QUẢN LÝ NHÀ TRỌ GỌN GÀNG</div>
          <h1>Vận hành nhà trọ <span>rõ ràng hơn.</span></h1>
          <p className="landing-lead">
            Quản lý dãy trọ, phòng, hợp đồng và hóa đơn trên cùng một hệ thống. Mỗi khoản thu có
            căn cứ, mỗi thông tin nằm đúng nơi cần tìm.
          </p>
          <div className="landing-cta-row">
            <Link className="landing-primary" to="/register">Bắt đầu sử dụng <IconArrowRight size={17} /></Link>
            <Link className="landing-secondary" to="/login">Đã có tài khoản?</Link>
          </div>
          <div className="landing-trust"><IconShieldCheck size={17} /> Phân quyền riêng cho chủ trọ, quản lý và người thuê</div>
        </div>

        <div className="landing-preview" aria-label="Minh họa bảng quản lý">
          <div className="preview-topline"><div><i /><i /><i /></div><span>WORKSPACE / TỔNG QUAN</span><span className="preview-secure"><IconShieldCheck size={14} /> Riêng tư</span></div>
          <div className="preview-title"><div><small>THỨ HAI, 02 THÁNG 11</small><h2>Chào mừng trở lại</h2></div><span className="preview-avatar">A</span></div>
          <div className="preview-stats">
            <div><span className="preview-stat-icon green"><IconBuilding size={17} /></span><small>Dãy trọ</small><strong>Quản lý tập trung</strong></div>
            <div><span className="preview-stat-icon blue"><IconRoom size={17} /></span><small>Phòng</small><strong>Theo dõi trạng thái</strong></div>
            <div><span className="preview-stat-icon violet"><IconTrendingUp size={17} /></span><small>Thu chi</small><strong>Đối soát từng kỳ</strong></div>
          </div>
          <div className="preview-section-head"><div><small>QUY TRÌNH HÀNG THÁNG</small><strong>Hóa đơn và chỉ số</strong></div><span>Chi tiết <IconArrowRight size={14} /></span></div>
          <div className="preview-row"><span className="preview-row-icon"><IconZap size={16} /></span><div><strong>Điện và nước</strong><small>Ghi chỉ số sử dụng</small></div><span className="preview-state">Theo kỳ</span></div>
          <div className="preview-row"><span className="preview-row-icon invoice"><IconInvoice size={16} /></span><div><strong>Hóa đơn phòng</strong><small>Tiền thuê + dịch vụ</small></div><span className="preview-state">Từng dòng</span></div>
          <div className="preview-note">Thông tin minh họa giao diện · Không phải số liệu thực tế</div>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-section-intro"><span className="landing-kicker">MỌI NGHIỆP VỤ TRONG MỘT LUỒNG</span><h2>Từ phòng trống đến hóa đơn tháng</h2><p>Các bước quản lý liên kết với nhau để giảm nhập liệu lặp và hạn chế nhầm lẫn.</p></div>
        <div className="landing-feature-grid">
          {highlights.map(({ icon: Icon, number, title, text }) => (
            <article className="landing-feature" key={number}>
              <div className="feature-card-top"><span className="feature-icon"><Icon size={20} /></span><span>{number}</span></div>
              <h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-flow">
        <div><span className="landing-kicker">BẮT ĐẦU ĐƠN GIẢN</span><h2>Ba bước cho một kỳ thuê minh bạch</h2></div>
        <div className="landing-flow-list">
          {flow.map(([number, title, text]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}
        </div>
      </section>

      <footer className="landing-footer"><Link to="/" className="landing-brand"><span className="landing-brand-mark">S</span><span>Smart Rental</span></Link><span>Quản lý nhà trọ, rõ ràng từ đầu đến cuối.</span><Link to="/login">Đăng nhập <IconArrowRight size={14} /></Link></footer>
    </main>
  );
}
