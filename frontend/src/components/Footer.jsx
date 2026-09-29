import React from 'react';
export default function Footer() {
  return (
    <footer className="page-footer">
      <span>© {new Date().getFullYear()} Smart Rental Management System</span>
      <span>Rental operations, made clear.</span>
    </footer>
  );
}
