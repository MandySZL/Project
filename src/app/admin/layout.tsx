'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, setCurrentUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [pendingAdminCount, setPendingAdminCount] = useState(0);
  const [pendingSubCount, setPendingSubCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      if (!currentUser?.id || currentUser.role !== 'ADMIN') return;
      try {
        const res = await fetch(`/api/requests?status=PENDING_ADMIN&_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setPendingAdminCount(data.length);
        }
        
        const subRes = await fetch(`/api/requests?substituteId=${currentUser.id}&status=PENDING_SUBSTITUTE&_t=${Date.now()}`);
        if (subRes.ok) {
          const subData = await subRes.json();
          setPendingSubCount(subData.length);
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    if (currentUser?.role === 'ADMIN') {
      fetchPending();
      const intervalId = setInterval(fetchPending, 5000);
      return () => clearInterval(intervalId);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.role !== 'ADMIN') {
      router.push('/login'); // Or show an access denied
    } else {
      setChecked(true);
    }
  }, [currentUser, router]);

  if (!checked) return null;

  return (
    <>
      <style>{`
        /* Override the root layout container specifically for admin */
        main.container {
          max-width: none !important;
          margin: 0 !important;
          padding: 0 32px !important;
          margin-left: 256px !important;
          width: calc(100% - 256px) !important;
        }
      `}</style>

      {/* Fixed Left Sidebar */}
      <aside
        className="flex flex-col gap-4 border-r"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '256px',
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          padding: '32px 16px',
          zIndex: 50
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
          <img
            src="/logo.png"
            alt="Chmbaka Logo"
            style={{ height: '64px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        <Link
          href="/admin"
          className="btn"
          style={{
            justifyContent: 'space-between',
            background: pathname === '/admin' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
            color: pathname === '/admin' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: 'none',
            boxShadow: 'none',
            padding: '12px 16px',
            fontWeight: pathname === '/admin' ? 600 : 500,
            borderRadius: '8px',
            textDecoration: 'none'
          }}
        >
          <span>Leave Approvals</span>
          {pendingAdminCount > 0 && (
            <span style={{
              background: 'var(--danger)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '10px',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {pendingAdminCount}
            </span>
          )}
        </Link>

        <Link
          href="/admin/substitute"
          className="btn"
          style={{
            justifyContent: 'space-between',
            background: pathname === '/admin/substitute' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
            color: pathname === '/admin/substitute' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: 'none',
            boxShadow: 'none',
            padding: '12px 16px',
            fontWeight: pathname === '/admin/substitute' ? 600 : 500,
            borderRadius: '8px',
            textDecoration: 'none'
          }}
        >
          <span>Substitute Requests</span>
          {pendingSubCount > 0 && (
            <span style={{
              background: 'var(--danger)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '10px',
              minWidth: '20px',
              textAlign: 'center'
            }}>
              {pendingSubCount}
            </span>
          )}
        </Link>

        <Link
          href="/admin/mentors"
          className="btn"
          style={{
            justifyContent: 'flex-start',
            background: pathname === '/admin/mentors' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
            color: pathname === '/admin/mentors' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: 'none',
            boxShadow: 'none',
            padding: '12px 16px',
            fontWeight: pathname === '/admin/mentors' ? 600 : 500,
            borderRadius: '8px',
            textDecoration: 'none'
          }}
        >
          Manage Mentors
        </Link>

        <Link
          href="/admin/sessions"
          className="btn"
          style={{
            justifyContent: 'flex-start',
            background: pathname === '/admin/sessions' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
            color: pathname === '/admin/sessions' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: 'none',
            boxShadow: 'none',
            padding: '12px 16px',
            fontWeight: pathname === '/admin/sessions' ? 600 : 500,
            borderRadius: '8px',
            textDecoration: 'none'
          }}
        >
          Manage Sessions
        </Link>

        <Link
          href="/admin/calendar"
          className="btn"
          style={{
            justifyContent: 'flex-start',
            background: pathname === '/admin/calendar' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
            color: pathname === '/admin/calendar' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: 'none',
            boxShadow: 'none',
            padding: '12px 16px',
            fontWeight: pathname === '/admin/calendar' ? 600 : 500,
            borderRadius: '8px',
            textDecoration: 'none'
          }}
        >
          Calendar
        </Link>

        <div style={{ flex: 1 }}></div>

        {/* Logout */}
        <div className="border-t pt-4 px-4 flex flex-col gap-3" style={{ borderColor: 'var(--border-color)' }}>
          <button
            className="btn btn-danger w-full"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            onClick={() => {
              setCurrentUser(null);
              window.location.href = '/';
            }}
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="w-full h-full pt-8 pb-12 flex flex-col">
        {/* Top Header inside Main Content */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Welcome, {currentUser?.name}
          </h1>
        </div>
        
        {children}
      </div>
    </>
  );
}
