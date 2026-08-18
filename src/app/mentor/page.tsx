'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../contexts/UserContext';

export default function MentorDashboard() {
  const { currentUser } = useUser();
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const reqRes = await fetch(`/api/requests?mentorId=${currentUser.id}`);
      setMyRequests(await reqRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [currentUser]);

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert('Failed to cancel: ' + (data.error || 'Unknown error'));
        return;
      }
      fetchData(); 
    } catch (e) {
      console.error(e);
      alert('Failed to cancel request (Network error)');
    }
  };

  if (!currentUser) return null;

  const remainingDays = currentUser.totalLeaveDays - currentUser.usedLeaveDays;

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Remaining Leave Days */}
      <div className="glass-panel flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Remaining Leave Days</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
            {remainingDays}
          </div>
        </div>
      </div>

      {/* 2. My Leave Requests List */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>My Leave Requests List</h3>
        {loading ? (
          <div className="text-sm">Loading...</div>
        ) : myRequests.length === 0 ? (
          <div className="text-sm text-center" style={{ padding: '24px 0' }}>No leave requests found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Date & Session</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Substitute</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ fontWeight: 600 }}>{new Date(req.requestDate).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{req.sessionText}</div>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {req.substitute.name}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${req.status === 'APPROVED' ? 'badge-approved' :
                          req.status === 'REJECTED' ? 'badge-rejected' :
                            'badge-pending'
                        }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteRequest(req.id)}
                        style={{ color: 'var(--danger)', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
