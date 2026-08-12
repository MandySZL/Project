'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '../contexts/UserContext';

export default function Navbar() {
  const { currentUser, setCurrentUser, users } = useUser();

  // Return null for ADMIN and MENTOR to hide the top navbar, since they have full sidebars
  if (currentUser?.role === 'ADMIN' || currentUser?.role === 'MENTOR') {
    return null;
  }

  return (
    <nav className="glass-panel" style={{ margin: '24px 24px 0 24px', padding: '16px 24px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', width: '100%' }}>
        <img
          src="/logo.png"
          alt="Chmbaka Logo"
          style={{ height: '80px', width: 'auto', objectFit: 'contain' }}
        />

        {currentUser && (
          <div className="absolute right-0 flex items-center gap-4">
            <div style={{ fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Welcome, </span>
              <span style={{ fontWeight: 600 }}>{currentUser.name} ({currentUser.role})</span>
            </div>
            <button
              className="btn btn-danger"
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              onClick={() => {
                setCurrentUser(null);
                window.location.href = '/';
              }}
            >
              Log Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
