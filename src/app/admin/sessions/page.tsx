'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { useRouter } from 'next/navigation';
import { Check, X, Edit2, ShieldAlert, Plus, Calendar, Clock, Users } from 'lucide-react';

export default function AdminSessionsPage() {
  const { currentUser } = useUser();
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
  
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

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

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

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
        throw new Error('Failed to update leave limit');
      }
      
      setEditingId(null);
      fetchClasses();
      showStatus('Session updated successfully', 'success');
    } catch (e) {
      console.error(e);
      showStatus('Failed to update session', 'error');
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
        throw new Error('Failed to create session');
      } else {
        setNewDate('');
        setNewTime('');
        setNewLimit(0);
        fetchClasses();
        showStatus('New session created', 'success');
      }
    } catch (error) {
      console.error(error);
      showStatus('An error occurred while creating', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex flex-col gap-8">
      {statusMessage && (
        <div className={`status-message status-${statusMessage.type} mb-2`}>
          {statusMessage.type === 'success' ? <Check size={18} /> : <ShieldAlert size={18} />}
          {statusMessage.text}
        </div>
      )}
      
      <div className="glass-panel" style={{ padding: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={20} className="text-accent" style={{ color: 'var(--accent-primary)' }}/>
          Add New Session
        </h2>
        
        <form onSubmit={handleCreateSession} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar size={16} style={{ color: 'var(--text-secondary)' }}/>
              Date
            </label>
            <input 
              type="date" 
              className="input-field" 
              value={newDate} 
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock size={16} style={{ color: 'var(--text-secondary)' }}/>
              Time
            </label>
            <input 
              type="time" 
              className="input-field" 
              value={newTime} 
              onChange={(e) => setNewTime(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users size={16} style={{ color: 'var(--text-secondary)' }}/>
              Leave Limit
            </label>
            <input 
              type="number" 
              className="input-field" 
              value={newLimit} 
              onChange={(e) => setNewLimit(Number(e.target.value) || 0)}
              min="0"
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary h-full"
            disabled={isCreating || !newDate || !newTime}
            style={{ padding: '12px 24px', height: '48px', fontSize: '1rem' }}
          >
            {isCreating ? 'Adding...' : 'Create Session'}
          </button>
        </form>
      </div>

      <div className="glass-panel">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>Manage Sessions</h2>
        
        {loading ? (
          <div className="text-sm" style={{ padding: '24px 0' }}>Loading sessions...</div>
        ) : !Array.isArray(classes) || classes.length === 0 ? (
          <div className="text-sm text-center" style={{ padding: '48px 0', color: 'var(--text-secondary)' }}>
            <Calendar size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
            {!Array.isArray(classes) ? `Error loading sessions` : 'No upcoming sessions found.'}
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Class Date & Time</th>
                  <th>Current Leaves Approved</th>
                  <th>Leave Limit</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(c => {
                  const dateObj = new Date(c.time);
                  const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.95rem' }}>{formattedDate}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formattedTime}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-pending" style={{ background: c.currentLeaves > 0 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)', color: c.currentLeaves > 0 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                          {c.currentLeaves} Approved
                        </span>
                      </td>
                      <td>
                        {editingId === c.id ? (
                          <input 
                            type="number" 
                            className="input-field"
                            style={{ padding: '8px 12px', width: '100px' }}
                            value={editValue}
                            onChange={(e) => setEditValue(Number(e.target.value) || 0)}
                            min={c.currentLeaves}
                          />
                        ) : (
                          <span className="font-medium">{c.leaveLimit} {c.leaveLimit === 1 ? 'Slot' : 'Slots'}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {editingId === c.id ? (
                          <div className="flex gap-2 justify-end">
                            <button 
                              className="btn-icon" 
                              style={{ color: 'var(--success)' }}
                              onClick={() => handleSave(c.id)}
                              title="Save Limit"
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
                              onClick={() => handleEdit(c.id, c.leaveLimit)}
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
          </div>
        )}
      </div>
    </div>
  );
}
