import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-top text-center py-3 small text-muted">
      © {new Date().getFullYear()} WDP301-GR4 — Modular Architecture
    </footer>
  );
}
