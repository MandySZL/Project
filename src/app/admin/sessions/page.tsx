'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { useRouter } from 'next/navigation';
import { Plus, Clock, Users, Edit2, Check, X, ShieldAlert, Trash2, Calendar } from 'lucide-react';

export default function AdminSessionsPage() {
  const { currentUser } = useUser();
  const router = useRouter();

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(1);

  // New session state
  const [newDayOfWeek, setNewDayOfWeek] = useState(1);
  const [newTime, setNewTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [newLimit, setNewLimit] = useState(2);
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
  }, [currentUser?.id]);

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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;

    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete session');
      }

      fetchClasses();
      showStatus('Session deleted successfully', 'success');
    } catch (e) {
      console.error(e);
      showStatus('Failed to delete session', 'error');
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime) return;

    try {
      setIsCreating(true);

      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: newDayOfWeek,
          timeString: newTime,
          endTimeString: newEndTime,
          venue: newVenue,
          leaveLimit: newLimit
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create session');
      } else {
        setNewDayOfWeek(1);
        setNewTime('');
        setNewEndTime('');
        setNewVenue('');
        setNewLimit(2);
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
          <Plus size={20} className="text-accent" style={{ color: 'var(--accent-primary)' }} />
          Add New Session
        </h2>

        <form onSubmit={handleCreateSession} className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-2 flex-1" style={{ minWidth: '130px' }}>
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
              Day of Week
            </label>
            <select
              className="input-field"
              value={newDayOfWeek}
              onChange={(e) => setNewDayOfWeek(Number(e.target.value))}
              required
            >
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
              <option value={0}>Sunday</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 flex-1" style={{ minWidth: '120px' }}>
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
              Start Time
            </label>
            <input
              type="time"
              className="input-field"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2 flex-1" style={{ minWidth: '120px' }}>
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
              End Time
            </label>
            <input
              type="time"
              className="input-field"
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2 flex-1" style={{ minWidth: '150px' }}>
            <label className="text-sm font-medium flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              Venue
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Room A"
              value={newVenue}
              onChange={(e) => setNewVenue(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2 flex-1" style={{ minWidth: '100px' }}>
            <label className="text-sm font-medium flex items-center gap-2">
              <Users size={16} style={{ color: 'var(--text-secondary)' }} />
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
          <div className="flex flex-col gap-2 flex-none">
            <label className="text-sm font-medium invisible hidden md:block">Submit</label>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreating || !newTime || !newEndTime}
              style={{ padding: '0 24px', height: '42px', fontSize: '1rem', whiteSpace: 'nowrap' }}
            >
              {isCreating ? 'Adding...' : 'Create Session'}
            </button>
          </div>
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
                  <th>Day</th>
                  <th>Venue</th>
                  <th>Time</th>
                  <th>Leave Limit</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(c => {
                  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  const dayName = days[c.dayOfWeek];
                  const startTimeStr = c.timeString;
                  const endTimeStr = c.endTimeString || '00:00';
                  const singleLineText = `${dayName} ${c.venue || 'TBD'} ${startTimeStr}-${endTimeStr}`;

                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>
                        <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{dayName}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{c.venue || 'TBD'}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{startTimeStr}-{endTimeStr}</span>
                      </td>
                      <td>
                        {editingId === c.id ? (
                          <input
                            type="number"
                            className="input-field"
                            style={{ padding: '8px 12px', width: '100px' }}
                            value={editValue}
                            onChange={(e) => setEditValue(Number(e.target.value) || 0)}
                            min={0}
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
                            <button
                              className="btn-icon"
                              onClick={() => handleDelete(c.id)}
                              title="Delete Session"
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={18} />
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
