'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useRouter } from 'next/navigation';

export default function AdminLeaveApprovalsPage() {
  const { currentUser } = useUser();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  if (!currentUser) return null;

  const fetchRequests = () => {
    const statusQuery = activeTab === 'PENDING' ? 'PENDING_ADMIN,PENDING_CANCEL_ADMIN' : 'APPROVED,REJECTED,CANCELLED';
    fetch(`/api/requests?status=${statusQuery}`)
      .then(res => res.json())
      .then(data => {
        setRequests(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      setLoading(true);
      fetchRequests();
      
      // Auto-refresh data every 5 seconds
      const intervalId = setInterval(() => {
        fetchRequests();
      }, 5000);
      
      return () => clearInterval(intervalId);
    }
  }, [currentUser, activeTab]);

  const handleAction = async (id: string, action: 'APPROVE_ADMIN' | 'REJECT_ADMIN' | 'APPROVE_CANCEL_ADMIN' | 'REJECT_CANCEL_ADMIN') => {
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

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this leave request?')) return;
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert('Failed to remove: ' + (data.error || 'Unknown error'));
        return;
      }
      fetchRequests(); 
    } catch (e) {
      console.error(e);
      alert('Failed to remove request');
    }
  };

  // Auth check is handled by layout

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Admin - Leave Approvals</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'PENDING' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('PENDING')}
            style={{ padding: '6px 12px', fontSize: '0.9rem' }}
          >
            Pending
          </button>
          <button
            className={`btn ${activeTab === 'HISTORY' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('HISTORY')}
            style={{ padding: '6px 12px', fontSize: '0.9rem' }}
          >
            History
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-sm">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-sm text-center" style={{ padding: '24px 0' }}>
          {activeTab === 'PENDING' ? 'No pending leave requests for admin approval.' : 'No leave approval history.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Type</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Mentor</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Date & Session</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Substitute</th>
                {activeTab === 'HISTORY' && (
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Status</th>
                )}
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => {
                const isCancel = req.status === 'PENDING_CANCEL_ADMIN';
                return (
                <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)', background: isCancel ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}>
                  <td style={{ padding: '12px 8px' }}>
                    {isCancel || req.status === 'CANCELLED' ? <span className="badge badge-pending">CANCELLATION</span> : <span className="badge badge-approved">NEW LEAVE</span>}
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: 500 }}>
                    {req.mentor.name}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontWeight: 600 }}>{new Date(req.requestDate).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{req.sessionText}</div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {req.substitute.name}
                  </td>
                  {activeTab === 'HISTORY' && (
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${req.status === 'APPROVED' ? 'badge-success' : 'badge-danger'}`} style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: req.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: req.status === 'APPROVED' ? '#10b981' : '#ef4444'
                      }}>
                        {req.status}
                      </span>
                    </td>
                  )}
                  {activeTab === 'PENDING' ? (
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => handleAction(req.id, isCancel ? 'APPROVE_CANCEL_ADMIN' : 'APPROVE_ADMIN')}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => handleAction(req.id, isCancel ? 'REJECT_CANCEL_ADMIN' : 'REJECT_ADMIN')}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  ) : (
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteRequest(req.id)}
                        style={{ color: 'var(--danger)', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
