'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useRouter } from 'next/navigation';

export default function AdminLeaveApprovalsPage() {
  const { currentUser } = useUser();
  const router = useRouter();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  if (!currentUser) return null;

  const fetchRequests = () => {
    fetch(`/api/requests?status=PENDING_ADMIN`)
      .then(res => res.json())
      .then(data => {
        setRequests(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchRequests();
      
      // Auto-refresh data every 5 seconds
      const intervalId = setInterval(() => {
        fetchRequests();
      }, 5000);
      
      return () => clearInterval(intervalId);
    }
  }, [currentUser]);

  const handleAction = async (id: string, action: 'APPROVE_ADMIN' | 'REJECT_ADMIN') => {
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      fetchRequests();
    } catch (e) {
      console.error(e);
      alert('Action failed');
    }
  };

  // Auth check is handled by layout

  return (
    <div className="glass-panel">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>Admin - Leave Approvals</h2>
      
      {loading ? (
        <div className="text-sm">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-sm text-center" style={{ padding: '24px 0' }}>No pending leave requests for admin approval.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Mentor</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Class Date</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Substitute</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 500 }}>
                    {req.mentor.name}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {new Date(req.classSession.time).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {req.substitute.name}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-success" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={() => handleAction(req.id, 'APPROVE_ADMIN')}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={() => handleAction(req.id, 'REJECT_ADMIN')}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
