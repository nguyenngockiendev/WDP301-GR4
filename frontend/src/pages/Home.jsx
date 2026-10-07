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
  IconCheckCircle,
  IconZap,
  IconStar,
  IconBell,
  IconContract,
} from '../components/Icons';

const features = [
  {
    icon: IconBuilding,
    colorClass: 'feature-color-emerald',
    badge: 'SPACE & ASSETS',
    title: 'Multi-Floor Building & Room Hierarchy',
    desc: 'Configure multi-unit properties, floor allocations, individual room specifications, baseline rent tariffs, and inventory amenities.',
  },
  {
    icon: IconZap,
    colorClass: 'feature-color-indigo',
    badge: 'AUTO UTILITIES',
    title: 'Automated Electricity & Water Calculation',
    desc: 'Simply input new meter readings; the platform calculates delta usage, applies tiered unit rates, and totals fees with 100% precision.',
  },
  {
    icon: IconInvoice,
    colorClass: 'feature-color-purple',
    badge: 'FINANCIAL CLARITY',
    title: 'Digital Invoices & Itemized Receipts',
    desc: 'Automatically issue itemized monthly statements to tenants, track real-time payment states (Paid, Pending, Overdue), and reconcile ledger entries.',
  },
  {
    icon: IconContract,
    colorClass: 'feature-color-amber',
    badge: 'LEGAL & DEPOSITS',
    title: 'Lease Agreements & Security Deposits',
    desc: 'Manage digital lease contracts, billing cycles, start-and-end term schedules, and complete security deposit refund records.',
  },
  {
    icon: IconShieldCheck,
    colorClass: 'feature-color-teal',
    badge: 'ROLE SECURITY',
    title: 'Three-Tier Role Management',
    desc: 'Dedicated role-scoped workspaces for Landlords (Master Admin), Property Managers (Day-to-day Operations), and Tenants (Self-service billing).',
  },
  {
    icon: IconTrendingUp,
    colorClass: 'feature-color-rose',
    badge: 'SMART ANALYTICS',
    title: 'Revenue Flow & Occupancy Analytics',
    desc: 'Interactive dashboards tracking vacant vs. occupied ratios, collected cashflow, and seasonal forecasting across all managed buildings.',
  },
];

const workflows = [
  {
    step: '01',
    title: 'Register Properties & Units',
    desc: 'Set up buildings, rooms, rental prices, and baseline utility meter counters in under 2 minutes.',
  },
  {
    step: '02',
    title: 'Log Readings & Issue Bills',
    desc: 'Record periodic meter readings; comprehensive billing statements are computed and published instantly.',
  },
  {
    step: '03',
    title: 'Collect Rent & Review Reports',
    desc: 'Verify payments via bank transfer or cash; revenues and balances update seamlessly into your financial reports.',
  },
];

const testimonials = [
  {
    name: 'Mai Phuong',
    role: 'Portfolio Owner (48 Units) • Hanoi',
    quote:
      'Since adopting Smart Rental, I never have to write down meter numbers in paper notebooks or calculate invoices manually. Tenants appreciate the clear itemized bills.',
    rating: 5,
  },
  {
    name: 'Hoang Nam',
    role: 'Apartment Complex Director • Ho Chi Minh City',
    quote:
      'Modern interface, lightning speed, and effortless remote oversight. Our receivable loss rate and reconciliation delays dropped to exactly zero.',
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
              NEXT-GENERATION RENTAL PROPERTY OPERATING SYSTEM
            </span>
          </div>

          <h1 className="vibrant-hero-title">
            Intelligent rental management,{' '}
            <span className="gradient-text-vibrant">accelerated growth</span> and effortless
            operations.
          </h1>

          <p className="vibrant-hero-subtitle">
            The all-in-one platform built for <strong>Landlords, Property Managers</strong>, and{' '}
            <strong>Tenants</strong>. Eliminate spreadsheet chaos, automate utility calculations,
            issue itemized invoices, and track revenue flow with precision.
          </p>

          <div className="vibrant-hero-actions">
            <Link className="btn btn-vibrant-primary btn-lg" to="/login">
              <span>Sign in to Workspace</span>
              <IconArrowRight size={18} />
            </Link>
            <Link className="btn btn-vibrant-glass btn-lg" to="/register">
              <span>Create Tenant Account</span>
            </Link>
          </div>

          <div className="vibrant-hero-usps">
            <div className="usp-item">
              <span className="usp-icon">
                <IconCheckCircle size={16} />
              </span>
              <span>100% Digital invoices & lease records</span>
            </div>
            <div className="usp-item">
              <span className="usp-icon">
                <IconCheckCircle size={16} />
              </span>
              <span>Automated electricity & water metering</span>
            </div>
            <div className="usp-item">
              <span className="usp-icon">
                <IconCheckCircle size={16} />
              </span>
              <span>Bank-grade multi-role data security</span>
            </div>
            <div className="usp-item">
              <span className="usp-icon">
                <IconCheckCircle size={16} />
              </span>
              <span>Real-time occupancy & financial ledger</span>
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
              <div className="showcase-window-title">
                Smart Rental Suite • Real-time Portfolio Control
              </div>
              <div className="showcase-live-tag">
                <span className="live-pulse" />
                <span>Live System</span>
              </div>
            </div>

            {/* KPI Cards Row */}
            <div className="showcase-kpi-grid">
              <div className="showcase-kpi-card kpi-card-emerald">
                <div className="kpi-card-header">
                  <span>MONTHLY REVENUE</span>
                  <div className="kpi-icon-bubble">
                    <IconTrendingUp size={15} />
                  </div>
                </div>
                <div className="kpi-card-value">148,500,000 VND</div>
                <div className="kpi-card-trend text-emerald">↑ +18.4% vs last month</div>
              </div>

              <div className="showcase-kpi-card kpi-card-sapphire">
                <div className="kpi-card-header">
                  <span>OCCUPANCY RATE</span>
                  <div className="kpi-icon-bubble">
                    <IconRoom size={15} />
                  </div>
                </div>
                <div className="kpi-card-value">96.8%</div>
                <div className="kpi-card-trend text-info">31 of 32 units leased</div>
              </div>

              <div className="showcase-kpi-card kpi-card-amber">
                <div className="kpi-card-header">
                  <span>UTILITIES CYCLE</span>
                  <div className="kpi-icon-bubble">
                    <IconZap size={15} />
                  </div>
                </div>
                <div className="kpi-card-value">32/32 Audited</div>
                <div className="kpi-card-trend text-warning">Auto-calculation done</div>
              </div>
            </div>

            {/* Simulated Live Unit Matrix */}
            <div className="showcase-unit-section">
              <div className="showcase-section-title">
                <span>Featured Unit Inventory</span>
                <span className="badge-counter">4 Properties Active</span>
              </div>

              <div className="showcase-units-list">
                <div className="showcase-unit-item">
                  <div className="unit-avatar avatar-emerald">101</div>
                  <div className="unit-meta">
                    <strong>Room 101 • Sunshine Landmark</strong>
                    <small>Tenant: Nguyen Van Nam • 1-Year Contract</small>
                  </div>
                  <div className="unit-pricing">
                    <span className="unit-price">5,500,000 VND</span>
                    <span className="status-badge status-badge-success">
                      <span className="status-badge-dot" /> Paid
                    </span>
                  </div>
                </div>

                <div className="showcase-unit-item">
                  <div className="unit-avatar avatar-sapphire">204</div>
                  <div className="unit-meta">
                    <strong>Room 204 • Sunshine Landmark</strong>
                    <small>Spacious balcony, fully furnished studio</small>
                  </div>
                  <div className="unit-pricing">
                    <span className="unit-price">4,200,000 VND</span>
                    <span className="status-badge status-badge-info">
                      <span className="status-badge-dot" /> Ready to Lease
                    </span>
                  </div>
                </div>

                <div className="showcase-unit-item">
                  <div className="unit-avatar avatar-amber">302</div>
                  <div className="unit-meta">
                    <strong>Room 302 • Sunrise Apartment</strong>
                    <small>Tenant: Tran Thi Hanh • Billing cycle 09/2026</small>
                  </div>
                  <div className="unit-pricing">
                    <span className="unit-price">6,800,000 VND</span>
                    <span className="status-badge status-badge-warning">
                      <span className="status-badge-dot" /> Payment Due
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
                <strong>Payment Received: 5,500,000 VND</strong>
                <small>Tenant Room 101 settled via Bank Transfer</small>
              </div>
              <span className="toast-time">Just now</span>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="vibrant-metrics-strip">
        <div className="metric-strip-card">
          <div className="metric-strip-number">5,000+</div>
          <div className="metric-strip-label">Units Managed</div>
          <div className="metric-strip-sub">Nationwide footprint</div>
        </div>
        <div className="metric-strip-divider" />
        <div className="metric-strip-card">
          <div className="metric-strip-number">99.98%</div>
          <div className="metric-strip-label">System Uptime</div>
          <div className="metric-strip-sub">Cloud infrastructure 24/7</div>
        </div>
        <div className="metric-strip-divider" />
        <div className="metric-strip-card">
          <div className="metric-strip-number">100%</div>
          <div className="metric-strip-label">Paperless Records</div>
          <div className="metric-strip-sub">Zero reconciliation errors</div>
        </div>
        <div className="metric-strip-divider" />
        <div className="metric-strip-card">
          <div className="metric-strip-number">0 VND</div>
          <div className="metric-strip-label">Uncollected Loss</div>
          <div className="metric-strip-sub">Strict receivable tracking</div>
        </div>
      </section>

      {/* Features Grid (6 Vivid Features) */}
      <section className="vibrant-features-section" aria-label="Key features">
        <div className="vibrant-section-header text-center">
          <span className="vibrant-section-eyebrow">COMPREHENSIVE CAPABILITIES</span>
          <h2 className="vibrant-section-title">
            The complete operating suite for rental property professionals
          </h2>
          <p className="vibrant-section-description">
            Everything you need to orchestrate a single boarding house or dozens of multi-story
            apartment complexes from one elegant control panel.
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
          <span className="vibrant-section-eyebrow">STREAMLINED WORKFLOW</span>
          <h2 className="vibrant-section-title">Get up and running in 3 simple steps</h2>
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
          <span className="vibrant-section-eyebrow">TRUSTED BY PROPERTY OWNERS</span>
          <h2 className="vibrant-section-title">What landlords say about Smart Rental</h2>
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
            <span>ELEVATE YOUR RENTAL OPERATIONS TODAY</span>
          </div>

          <h2 className="cta-heading">Ready to revolutionize your rental property portfolio?</h2>

          <p className="cta-sub">
            Experience smart property management with zero installation required, accessible
            anywhere across desktop, tablet, and mobile.
          </p>

          <div className="cta-buttons-wrapper">
            <Link className="btn btn-cta-main btn-lg" to="/login">
              <span>Access Workspace Now</span>
              <IconArrowRight size={18} />
            </Link>
            <Link className="btn btn-cta-secondary btn-lg" to="/register">
              <span>Create Tenant Account</span>
            </Link>
          </div>

          <div className="cta-guarantees">
            <span>✓ Instant Onboarding</span>
            <span>✓ Bank-Grade Security</span>
            <span>✓ 24/7 Cloud Availability</span>
          </div>
        </div>
      </section>
    </div>
  );
}
