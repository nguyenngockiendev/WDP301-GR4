import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconBuilding,
  IconRoom,
  IconInvoice,
  IconShieldCheck,
  IconTrendingUp,
  IconArrowRight,
  IconSparkles,
  IconCheck,
  IconCheckCircle,
  IconZap,
  IconStar,
  IconWallet,
  IconBell,
  IconContract,
} from '../components/Icons';

const features = [
  {
    icon: IconBuilding,
    colorClass: 'feature-color-emerald',
    badge: 'TỔ CHỨC KHÔNG GIAN',
    title: 'Quản lý Tòa nhà & Phòng đa tầng',
    desc: 'Thiết lập danh mục bất động sản, phân chia phòng ốc, diện tích, giá thuê gốc và trang thiết bị nội thất chi tiết.',
  },
  {
    icon: IconZap,
    colorClass: 'feature-color-indigo',
    badge: 'TỰ ĐỘNG HÓA CƯỚC',
    title: 'Tính toán Điện Nước & Dịch vụ tức thì',
    desc: 'Chỉ cần nhập chỉ số mới, hệ thống tự động trừ chỉ số cũ, áp đơn giá bậc thang và kết xuất chi phí chuẩn xác 100%.',
  },
  {
    icon: IconInvoice,
    colorClass: 'feature-color-purple',
    badge: 'MINH BẠCH TÀI CHÍNH',
    title: 'Hóa đơn & Biên lai số hóa',
    desc: 'Tự động tạo bảng kê chi tiết gửi đến khách thuê, theo dõi trạng thái đã thanh toán, chưa thu và nợ đọng theo kỳ.',
  },
  {
    icon: IconContract,
    colorClass: 'feature-color-amber',
    badge: 'PHÁP LÝ & AN TOÀN',
    title: 'Hợp đồng & Tiền cọc minh bạch',
    desc: 'Lưu trữ hồ sơ hợp đồng điện tử, chu kỳ thanh toán, ngày bắt đầu - kết thúc và lịch sử hoàn trả tiền cọc an tâm.',
  },
  {
    icon: IconShieldCheck,
    colorClass: 'feature-color-teal',
    badge: 'BẢO MẬT & PHÂN QUYỀN',
    title: 'Phân quyền 3 Cấp độ chuyên nghiệp',
    desc: 'Không gian làm việc chuyên biệt dành cho Chủ nhà (Toàn quyền), Quản lý cơ sở (Vận hành) và Khách thuê (Tra cứu hóa đơn).',
  },
  {
    icon: IconTrendingUp,
    colorClass: 'feature-color-rose',
    badge: 'PHÂN TÍCH THÔNG MINH',
    title: 'Báo cáo Doanh thu & Tỷ lệ lấp đầy',
    desc: 'Biểu đồ trực quan theo dõi tỷ lệ phòng trống, dòng tiền thu thực tế và dự báo tài chính theo tháng và quý.',
  },
];

const workflows = [
  {
    step: '01',
    title: 'Khởi tạo Tòa nhà & Phòng',
    desc: 'Tạo danh mục phòng, giá thuê và cấu hình chỉ số điện nước ban đầu chỉ trong 2 phút.',
  },
  {
    step: '02',
    title: 'Ghi chỉ số & Xuất Hóa đơn',
    desc: 'Nhập số công tơ định kỳ hàng tháng, hệ thống tự động kết xuất hóa đơn chi tiết cho từng người thuê.',
  },
  {
    step: '03',
    title: 'Thu phí & Xem Báo cáo',
    desc: 'Xác nhận thanh toán qua chuyển khoản hoặc tiền mặt, dòng tiền tự động cập nhật vào báo cáo kinh doanh.',
  },
];

const testimonials = [
  {
    name: 'Chị Mai Phương',
    role: 'Chủ chuỗi 4 nhà trọ (48 phòng) • Hà Nội',
    quote:
      'Từ ngày dùng Smart Rental, tôi không còn phải ghi sổ tay hay sợ tính nhầm tiền điện nước. Khách thuê rất thích vì hóa đơn rõ ràng, minh bạch.',
    rating: 5,
  },
  {
    name: 'Anh Hoàng Nam',
    role: 'Quản lý Căn hộ dịch vụ • TP. Hồ Chí Minh',
    quote:
      'Giao diện hiện đại, tốc độ cực nhanh và quản lý tập trung từ xa rất tiện lợi. Tỷ lệ thất thoát công nợ phòng của chúng tôi về mức 0%.',
    rating: 5,
  },
];

export default function Home() {
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="home-page-vibrant">
      {/* Ambient background glows */}
      <div className="ambient-glow ambient-glow-1" aria-hidden="true" />
      <div className="ambient-glow ambient-glow-2" aria-hidden="true" />

      {/* Hero Section */}
      <section className="vibrant-hero">
        <div className="vibrant-hero-content">
          <div className="vibrant-pill-badge">
            <span className="vibrant-badge-sparkle">
              <IconSparkles size={14} />
            </span>
            <span className="vibrant-badge-text">
              GIẢI PHÁP QUẢN LÝ NHÀ TRỌ & BẤT ĐỘNG SẢN THẾ HỆ MỚI
            </span>
          </div>

          <h1 className="vibrant-hero-title">
            Quản lý nhà trọ thông minh,{' '}
            <span className="gradient-text-vibrant">đột phá doanh thu</span> và vận hành tinh gọn.
          </h1>

          <p className="vibrant-hero-subtitle">
            Hệ điều hành toàn diện dành cho <strong>Chủ nhà trọ, Quản lý tòa nhà</strong> và{' '}
            <strong>Khách thuê</strong>. Loại bỏ hoàn toàn sổ sách thủ công, tự động hóa tính tiền
            điện nước, phát hành hóa đơn và kiểm soát dòng tiền chính xác 100%.
          </p>

          <div className="vibrant-hero-actions">
            <Link className="btn btn-vibrant-primary btn-lg" to="/login">
              <span>Đăng nhập hệ thống ngay</span>
              <IconArrowRight size={18} />
            </Link>
            <Link className="btn btn-vibrant-glass btn-lg" to="/register">
              <span>Tạo tài khoản khách thuê</span>
            </Link>
          </div>

          <div className="vibrant-hero-usps">
            <div className="usp-item">
              <span className="usp-icon">
                <IconCheckCircle size={16} />
              </span>
              <span>100% Số hóa hóa đơn & hợp đồng</span>
            </div>
            <div className="usp-item">
              <span className="usp-icon">
                <IconCheckCircle size={16} />
              </span>
              <span>Tự động tính điện nước theo số</span>
            </div>
            <div className="usp-item">
              <span className="usp-icon">
                <IconCheckCircle size={16} />
              </span>
              <span>Bảo mật phân quyền dữ liệu cao cấp</span>
            </div>
            <div className="usp-item">
              <span className="usp-icon">
                <IconCheckCircle size={16} />
              </span>
              <span>Báo cáo doanh thu & tỷ lệ lấp đầy</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Mockup (Interactive-style Showcase) */}
        <div className="vibrant-hero-showcase">
          <div className="showcase-window">
            {/* Window header */}
            <div className="showcase-header">
              <div className="window-dots">
                <span className="dot-red" />
                <span className="dot-yellow" />
                <span className="dot-green" />
              </div>
              <div className="showcase-window-title">Smart Rental Suite • Trực quan hóa danh mục</div>
              <div className="showcase-live-tag">
                <span className="live-pulse" />
                <span>Realtime</span>
              </div>
            </div>

            {/* KPI Cards Row */}
            <div className="showcase-kpi-grid">
              <div className="showcase-kpi-card kpi-card-emerald">
                <div className="kpi-card-header">
                  <span>DOANH THU THÁNG</span>
                  <div className="kpi-icon-bubble">
                    <IconTrendingUp size={15} />
                  </div>
                </div>
                <div className="kpi-card-value">148.500.000 ₫</div>
                <div className="kpi-card-trend text-emerald">↑ +18.4% so với tháng trước</div>
              </div>

              <div className="showcase-kpi-card kpi-card-sapphire">
                <div className="kpi-card-header">
                  <span>TỶ LỆ LẤP ĐẦY</span>
                  <div className="kpi-icon-bubble">
                    <IconRoom size={15} />
                  </div>
                </div>
                <div className="kpi-card-value">96.8%</div>
                <div className="kpi-card-trend text-info">31/32 phòng đang thuê</div>
              </div>

              <div className="showcase-kpi-card kpi-card-amber">
                <div className="kpi-card-header">
                  <span>ĐIỆN NƯỚC KỲ NÀY</span>
                  <div className="kpi-icon-bubble">
                    <IconZap size={15} />
                  </div>
                </div>
                <div className="kpi-card-value">32/32 Đã chốt</div>
                <div className="kpi-card-trend text-warning">Tự động hóa hoàn tất</div>
              </div>
            </div>

            {/* Simulated Live Unit Matrix */}
            <div className="showcase-unit-section">
              <div className="showcase-section-title">
                <span>Tình trạng phòng nổi bật</span>
                <span className="badge-counter">4 Tòa nhà đang quản lý</span>
              </div>

              <div className="showcase-units-list">
                <div className="showcase-unit-item">
                  <div className="unit-avatar avatar-emerald">101</div>
                  <div className="unit-meta">
                    <strong>Phòng 101 • Sunshine Landmark</strong>
                    <small>Nguyễn Văn Nam • Hợp đồng 1 năm</small>
                  </div>
                  <div className="unit-pricing">
                    <span className="unit-price">5.500.000 ₫</span>
                    <span className="status-badge status-badge-success">
                      <span className="status-badge-dot" /> Đã thanh toán
                    </span>
                  </div>
                </div>

                <div className="showcase-unit-item">
                  <div className="unit-avatar avatar-sapphire">204</div>
                  <div className="unit-meta">
                    <strong>Phòng 204 • Sunshine Landmark</strong>
                    <small>Ban công rộng, full nội thất cao cấp</small>
                  </div>
                  <div className="unit-pricing">
                    <span className="unit-price">4.200.000 ₫</span>
                    <span className="status-badge status-badge-info">
                      <span className="status-badge-dot" /> Sẵn sàng cho thuê
                    </span>
                  </div>
                </div>

                <div className="showcase-unit-item">
                  <div className="unit-avatar avatar-amber">302</div>
                  <div className="unit-meta">
                    <strong>Phòng 302 • Sunrise Apartment</strong>
                    <small>Trần Thị Hạnh • Hóa đơn kỳ 09/2026</small>
                  </div>
                  <div className="unit-pricing">
                    <span className="unit-price">6.800.000 ₫</span>
                    <span className="status-badge status-badge-warning">
                      <span className="status-badge-dot" /> Chờ thanh toán
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Notification */}
            <div className="showcase-floating-toast">
              <div className="toast-icon">
                <IconBell size={16} />
              </div>
              <div className="toast-text">
                <strong>Vừa nhận thanh toán: 5.500.000 ₫</strong>
                <small>Khách thuê P.101 chuyển khoản thành công</small>
              </div>
              <span className="toast-time">Vừa xong</span>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="vibrant-metrics-strip">
        <div className="metric-strip-card">
          <div className="metric-strip-number">5.000+</div>
          <div className="metric-strip-label">Phòng đang quản lý</div>
          <div className="metric-strip-sub">Trên toàn quốc</div>
        </div>
        <div className="metric-strip-divider" />
        <div className="metric-strip-card">
          <div className="metric-strip-number">99.98%</div>
          <div className="metric-strip-label">Thời gian hoạt động</div>
          <div className="metric-strip-sub">Hạ tầng mượt mà 24/7</div>
        </div>
        <div className="metric-strip-divider" />
        <div className="metric-strip-card">
          <div className="metric-strip-number">100%</div>
          <div className="metric-strip-label">Số hóa minh bạch</div>
          <div className="metric-strip-sub">Không còn sai lệch sổ sách</div>
        </div>
        <div className="metric-strip-divider" />
        <div className="metric-strip-card">
          <div className="metric-strip-number">0 ₫</div>
          <div className="metric-strip-label">Chi phí thất thoát</div>
          <div className="metric-strip-sub">Kiểm soát công nợ chặt chẽ</div>
        </div>
      </section>

      {/* Features Grid (6 Vivid Features) */}
      <section className="vibrant-features-section" aria-label="Tính năng nổi bật">
        <div className="vibrant-section-header text-center">
          <span className="vibrant-section-eyebrow">TÍNH NĂNG TOÀN DIỆN</span>
          <h2 className="vibrant-section-title">
            Bộ công cụ vận hành bất động sản cho thuê chuyên nghiệp
          </h2>
          <p className="vibrant-section-description">
            Tất cả những gì bạn cần để quản lý từ một dãy phòng trọ cho đến hàng chục tòa nhà chung cư
            mini đa tầng.
          </p>
        </div>

        <div className="vibrant-features-grid">
          {features.map(({ icon: Icon, colorClass, badge, title, desc }, idx) => (
            <article className={`vibrant-feature-card ${colorClass}`} key={title}>
              <div className="feature-top-row">
                <div className="feature-vibrant-icon">
                  <Icon size={24} />
                </div>
                <span className="feature-category-badge">{badge}</span>
              </div>
              <h3 className="feature-card-title">{title}</h3>
              <p className="feature-card-desc">{desc}</p>
              <div className="feature-card-step">
                <span>0{idx + 1}</span>
                <IconArrowRight size={16} className="feature-step-arrow" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3-Step Workflow Section */}
      <section className="vibrant-workflow-section">
        <div className="vibrant-section-header text-center">
          <span className="vibrant-section-eyebrow">QUY TRÌNH ĐƠN GIẢN</span>
          <h2 className="vibrant-section-title">Khởi động quản lý chỉ trong 3 bước</h2>
        </div>

        <div className="workflow-steps-grid">
          {workflows.map(({ step, title, desc }) => (
            <div className="workflow-step-card" key={step}>
              <div className="workflow-step-badge">{step}</div>
              <h4>{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Trust Section */}
      <section className="vibrant-testimonials-section">
        <div className="vibrant-section-header text-center">
          <span className="vibrant-section-eyebrow">ĐƯỢC CHỦ NHÀ TIN CẬY</span>
          <h2 className="vibrant-section-title">Khách hàng nói gì về Smart Rental?</h2>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, idx) => (
            <div className="testimonial-card" key={idx}>
              <div className="testimonial-stars">
                {[...Array(t.rating)].map((_, i) => (
                  <IconStar key={i} size={16} className="star-gold" />
                ))}
              </div>
              <p className="testimonial-quote">“{t.quote}”</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.name.charAt(0)}</div>
                <div>
                  <strong className="d-block">{t.name}</strong>
                  <small className="text-muted">{t.role}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grand Radiant Call To Action Banner */}
      <section className="vibrant-grand-cta">
        <div className="cta-glow-circle cta-glow-left" />
        <div className="cta-glow-circle cta-glow-right" />

        <div className="cta-inner-content text-center">
          <div className="cta-badge">
            <IconSparkles size={14} />
            <span>NÂNG TẦM QUẢN LÝ NGAY HÔM NAY</span>
          </div>

          <h2 className="cta-heading">
            Sẵn sàng chuyển đổi số cho khu nhà trọ & căn hộ của bạn?
          </h2>

          <p className="cta-sub">
            Trải nghiệm nền tảng quản trị thông minh, không cần cài đặt, truy cập tức thì trên cả máy
            tính và điện thoại.
          </p>

          <div className="cta-buttons-wrapper">
            <Link className="btn btn-cta-main btn-lg" to="/login">
              <span>Đăng nhập hệ thống ngay</span>
              <IconArrowRight size={18} />
            </Link>
            <Link className="btn btn-cta-secondary btn-lg" to="/register">
              <span>Đăng ký tài khoản</span>
            </Link>
          </div>

          <div className="cta-guarantees">
            <span>✓ Thiết lập siêu tốc</span>
            <span>✓ Bảo mật tuyệt đối</span>
            <span>✓ Hỗ trợ chu đáo</span>
          </div>
        </div>
      </section>
    </div>
  );
}
