import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const benefits = [
  ['One workspace', 'Manage buildings, rooms and people in one clear place.'],
  ['Role-based access', 'Landlords, property managers and tenants see the right information.'],
  ['Ready for growth', 'Contracts, billing and payments have a prepared data foundation.'],
];

export default function Home() {
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="home-page">
      <section className="home-hero">
        <span className="home-kicker">PROPERTY MANAGEMENT, MADE SIMPLE</span>
        <h1>A calmer way to manage rental homes.</h1>
        <p>
          Haven brings people, rooms and essential property information together in one focused
          workspace.
        </p>
        <div className="home-actions">
          <Link className="btn btn-primary" to="/login">
            Sign in
          </Link>
          <Link className="btn btn-light" to="/register">
            Create tenant account
          </Link>
        </div>
      </section>

      <section className="home-benefits" aria-label="Haven benefits">
        {benefits.map(([title, description], index) => (
          <article className="home-benefit" key={title}>
            <span className="home-benefit-number">0{index + 1}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="home-callout">
        <div>
          <span className="home-kicker">A PLACE FOR EVERYONE</span>
          <h2>Already have an account?</h2>
          <p>Sign in to access your personal property workspace.</p>
        </div>
        <Link className="btn btn-primary" to="/login">
          Go to sign in →
        </Link>
      </section>
    </div>
  );
}
