import React from 'react';
export default function Footer() {
  return (
    <footer className="page-footer">
      <span>© {new Date().getFullYear()} Haven Property Management</span>
      <span>Made for a place called home.</span>
    </footer>
  );
}
