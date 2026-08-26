'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { useRouter } from 'next/navigation';

export default function AdminSessionsPage() {
  const { currentUser, users } = useUser();
  const router = useRouter();
  
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(1);

  // New session state
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLimit, setNewLimit] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const fetchClasses = () => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        setClasses(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchClasses();
      
      // Auto-refresh data every 5 seconds, but pause if editing to prevent UI jumps
      const intervalId = setInterval(() => {
        setEditingId(currentEditingId => {
          if (!currentEditingId) {
            fetchClasses();
          }
          return currentEditingId;
        });
      }, 5000);
      
      return () => clearInterval(intervalId);
    }
  }, [currentUser]);

  const handleEdit = (id: string, currentLimit: number) => {
    setEditingId(id);
    setEditValue(currentLimit);
  };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveLimit: editValue })
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update leave limit');
        return;
      }
      
      setEditingId(null);
      fetchClasses();
    } catch (e) {
      console.error(e);
      alert('Failed to update leave limit');
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTime) return;

    try {
      setIsCreating(true);
      const dateTimeString = `${newDate}T${newTime}:00`;
      
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time: dateTimeString,
          leaveLimit: newLimit
        })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to create session');
      } else {
        setNewDate('');
        setNewTime('');
        setNewLimit(0);
        fetchClasses();
      }
    } catch (error) {
      console.error(error);
      alert('An unexpected error occurred.');
    } finally {
      setIsCreating(false);
    }
  };

  // Removed handleEditRoster and handleSaveRoster

  if (!currentUser) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="glass-panel">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>Add New Session</h2>
        <form onSubmit={handleCreateSession} className="flex gap-4 items-end flex-wrap">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Date</label>
            <input 
              type="date" 
              className="input-field" 
              value={newDate} 
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Time</label>
            <input 
              type="time" 
              className="input-field" 
              value={newTime} 
              onChange={(e) => setNewTime(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Leave Limit</label>
            <input 
              type="number" 
              className="input-field" 
              value={newLimit} 
              onChange={(e) => setNewLimit(Number(e.target.value) || 0)}
              min="0"
              required
              style={{ width: '100px' }}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary h-full"
            disabled={isCreating || !newDate || !newTime}
            style={{ padding: '10px 20px', height: '42px' }}
          >
            {isCreating ? 'Adding...' : 'Add Session'}
          </button>
        </form>
      </div>

      <div className="glass-panel">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>Manage Sessions</h2>
        
        {loading ? (
          <div className="text-sm">Loading...</div>
        ) : !Array.isArray(classes) || classes.length === 0 ? (
          <div className="text-sm text-center" style={{ padding: '24px 0' }}>
            {!Array.isArray(classes) ? `Error loading sessions: ${JSON.stringify(classes)}` : 'No upcoming sessions found.'}
          </div>
        ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Class Date & Time</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Current Leaves Approved</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Leave Limit</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 500 }}>
                    {new Date(c.time).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {c.currentLeaves}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {editingId === c.id ? (
                      <input 
                        type="number" 
                        className="input-field"
                        style={{ padding: '4px 8px', width: '80px' }}
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value) || 0)}
                        min={c.currentLeaves}
                      />
                    ) : (
                      c.leaveLimit
                    )}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    {editingId === c.id ? (
                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          type="button"
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer' }}
                          onClick={() => handleSave(c.id)}
                        >
                          Save Limit
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
                      <div className="flex gap-2 justify-end">
                        <button 
                          className="btn"
                          style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                          onClick={() => handleEdit(c.id, c.leaveLimit)}
                        >
                          Edit Limit
                        </button>
                      </div>
                    )}
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
