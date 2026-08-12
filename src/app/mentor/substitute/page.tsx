'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../../contexts/UserContext';

export default function SubstituteRequestsPage() {
  const { currentUser } = useUser();
  const [substituteRequests, setSubstituteRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const subRes = await fetch(`/api/requests?substituteId=${currentUser.id}&status=PENDING_SUBSTITUTE`);
      setSubstituteRequests(await subRes.json());
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

  const handleSubstituteAction = async (id: string, action: 'ACCEPT_SUB' | 'DECLINE_SUB') => {
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      fetchData(); 
    } catch (e) {
      console.error(e);
      alert('Action failed');
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="glass-panel w-full" style={{ border: substituteRequests.length > 0 ? '1px solid var(--warning)' : '1px solid var(--glass-border)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px', color: substituteRequests.length > 0 ? 'var(--warning)' : 'inherit' }}>
          Action Needed: Substitute Requests
        </h2>
        
        {loading ? (
          <div className="text-sm">Loading...</div>
        ) : substituteRequests.length > 0 ? (
          <>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Other mentors have requested you to substitute for them.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Requesting Mentor</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Class Date</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {substituteRequests.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div className="font-medium">{req.mentor.name}</div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {new Date(req.classSession.time).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn btn-success" style={{ padding: '6px 16px' }} onClick={() => handleSubstituteAction(req.id, 'ACCEPT_SUB')}>Accept</button>
                          <button className="btn btn-danger" style={{ padding: '6px 16px' }} onClick={() => handleSubstituteAction(req.id, 'DECLINE_SUB')}>Decline</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-sm text-center flex items-center justify-center" style={{ padding: '24px 0', color: 'var(--text-secondary)' }}>
            No pending substitute requests.
          </div>
        )}
      </div>
    </div>
  );
}
