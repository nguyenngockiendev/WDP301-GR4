import React from 'react';

export default function Footer() {
  return (
    <footer className="page-footer">
      <div className="footer-left">
        <span className="system-status-indicator">
          <span className="status-ping" />
          <span className="status-dot" />
          All systems operational
        </span>
        <span className="footer-divider">•</span>
        <span>© {new Date().getFullYear()} Smart Rental Management System</span>
      </div>
      <div className="footer-right">
        <span className="footer-badge">v2.4 Enterprise</span>
        <span className="footer-tagline">Streamlined property operations</span>
      </div>
    </footer>
  );
}
