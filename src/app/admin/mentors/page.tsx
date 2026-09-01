'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { useRouter } from 'next/navigation';
import { Check, X, Edit2, ShieldAlert } from 'lucide-react';

export default function AdminMentorsPage() {
  const { currentUser, users, refreshUsers } = useUser();
  const router = useRouter();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Auto-refresh data every 5 seconds
    const intervalId = setInterval(() => {
      refreshUsers();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [refreshUsers]);

  if (!currentUser) return null;

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleEdit = (id: string, currentDays: number) => {
    setEditingId(id);
    setEditValue(currentDays);
  };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalLeaveDays: editValue })
      });
      
      if (!res.ok) throw new Error('Failed to update');
      
      setEditingId(null);
      await refreshUsers();
      showStatus('Leave days updated successfully', 'success');
    } catch (e) {
      console.error(e);
      showStatus('Failed to update leave days', 'error');
    }
  };

  const mentors = users.filter(u => u.role === 'MENTOR');

  return (
    <div className="glass-panel">
      <div className="flex justify-between items-center mb-6">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Manage Mentors</h2>
        {statusMessage && (
          <div className={`status-message status-${statusMessage.type}`}>
            {statusMessage.type === 'success' ? <Check size={18} /> : <ShieldAlert size={18} />}
            {statusMessage.text}
          </div>
        )}
      </div>
      
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Leave Utilization</th>
              <th>Total Limit</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mentors.map(mentor => {
              const usagePercent = mentor.totalLeaveDays > 0 
                ? Math.min((mentor.usedLeaveDays / mentor.totalLeaveDays) * 100, 100) 
                : 0;
              
              let progressColor = 'var(--success)';
              if (usagePercent > 60) progressColor = 'var(--warning)';
              if (usagePercent > 85) progressColor = 'var(--danger)';

              return (
                <tr key={mentor.id}>
                  <td style={{ fontWeight: 500 }}>
                    {mentor.name}
                  </td>
                  <td>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span>{mentor.usedLeaveDays} used</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{mentor.totalLeaveDays} total</span>
                    </div>
                    <div className="progress-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${usagePercent}%`, backgroundColor: progressColor }}
                      />
                    </div>
                  </td>
                  <td>
                    {editingId === mentor.id ? (
                      <input 
                        type="number" 
                        className="input-field"
                        style={{ padding: '8px 12px', width: '100px' }}
                        value={editValue}
                        onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                        min={mentor.usedLeaveDays}
                      />
                    ) : (
                      <span className="font-medium">{mentor.totalLeaveDays} Days</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {editingId === mentor.id ? (
                      <div className="flex gap-2 justify-end">
                        <button 
                          className="btn-icon" 
                          style={{ color: 'var(--success)' }}
                          onClick={() => handleSave(mentor.id)}
                          title="Save"
                        >
                          <Check size={20} />
                        </button>
                        <button 
                          className="btn-icon"
                          style={{ color: 'var(--text-secondary)' }}
                          onClick={() => setEditingId(null)}
                          title="Cancel"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button 
                          className="btn-icon"
                          onClick={() => handleEdit(mentor.id, mentor.totalLeaveDays)}
                          title="Edit Limit"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {mentors.length === 0 && (
          <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
            No mentors found in the system.
          </div>
        )}
      </div>
    </div>
  );
}
