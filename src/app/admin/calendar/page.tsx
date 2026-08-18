'use client';

import React from 'react';
import DashboardCalendar from '../../../components/DashboardCalendar';

export default function AdminCalendarPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Calendar Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Overview of daily classes, available leave slots, and substitute assignments.
        </p>
      </div>
      <DashboardCalendar />
    </div>
  );
}
