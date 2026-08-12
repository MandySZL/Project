'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '../contexts/UserContext';

export default function Navbar() {
  const { currentUser, setCurrentUser, users } = useUser();

  // Remove early return to show the navbar even when logged out

  return (
    <nav className="glass-panel" style={{ margin: '24px 24px 0 24px', padding: '16px 24px', borderRadius: '16px' }}>
      <div className="flex justify-between items-center">
        <div className="flex gap-6 items-center">
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Chmbaka Logo" 
              style={{ height: '48px', width: 'auto', objectFit: 'contain' }} 
            />
          </div>
          <div className="flex gap-4">
            {currentUser?.role === 'ADMIN' && (
              <>
                <Link href="/admin" className="text-sm font-medium hover:text-accent-primary transition-colors">
                  Leave Approvals
                </Link>
                <Link href="/admin/mentors" className="text-sm font-medium hover:text-accent-primary transition-colors">
                  Manage Mentors
                </Link>
                <Link href="/admin/sessions" className="text-sm font-medium hover:text-accent-primary transition-colors">
                  Manage Sessions
                </Link>
              </>
            )}
          </div>
        </div>

      {currentUser && (
        <div className="flex items-center gap-4">
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
