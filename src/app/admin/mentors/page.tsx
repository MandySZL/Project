'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { useRouter } from 'next/navigation';

export default function AdminMentorsPage() {
  const { currentUser, users, refreshUsers } = useUser();
  const router = useRouter();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  useEffect(() => {
    // Auto-refresh data every 5 seconds
    const intervalId = setInterval(() => {
      refreshUsers();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [refreshUsers]);

  if (!currentUser) return null;

  const handleEdit = (id: string, currentDays: number) => {
    setEditingId(id);
    setEditValue(currentDays);
  };

  const handleSave = async (id: string) => {
    try {
      await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalLeaveDays: editValue })
      });
      setEditingId(null);
      await refreshUsers();
    } catch (e) {
      console.error(e);
      alert('Failed to update leave days');
    }
  };

  // Auth check is handled by layout

  const mentors = users.filter(u => u.role === 'MENTOR');

  return (
    <div className="glass-panel">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>Manage Mentors</h2>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Name</th>
              <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Used Leave Days</th>
              <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Total Leave Days</th>
              <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mentors.map(mentor => (
              <tr key={mentor.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 8px', fontWeight: 500 }}>
                  {mentor.name}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  {mentor.usedLeaveDays}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  {editingId === mentor.id ? (
                    <input 
                      type="number" 
                      className="input-field"
                      style={{ padding: '4px 8px', width: '80px' }}
                      value={editValue}
                      onChange={(e) => setEditValue(parseInt(e.target.value))}
                      min={mentor.usedLeaveDays}
                    />
                  ) : (
                    mentor.totalLeaveDays
                  )}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  {editingId === mentor.id ? (
                    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={() => handleSave(mentor.id)}
                      >
                        Save
                      </button>
                      <button 
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--border-color)' }}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn"
                      style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                      onClick={() => handleEdit(mentor.id, mentor.totalLeaveDays)}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
