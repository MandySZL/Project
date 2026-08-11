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
  const [editingRosterId, setEditingRosterId] = useState<string | null>(null);
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);
  
  const allMentors = users.filter(u => u.role === 'MENTOR');

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
      
      // Auto-refresh data every 5 seconds
      const intervalId = setInterval(() => {
        fetchClasses();
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

  const handleEditRoster = (id: string, currentMentors: any[]) => {
    setEditingRosterId(id);
    setSelectedMentors(currentMentors.map(m => m.id));
  };

  const toggleMentor = (mentorId: string) => {
    setSelectedMentors(prev => 
      prev.includes(mentorId) ? prev.filter(id => id !== mentorId) : [...prev, mentorId]
    );
  };

  const handleSaveRoster = async (id: string) => {
    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedMentorIds: selectedMentors })
      });
      
      if (!res.ok) {
        alert('Failed to update assigned mentors');
        return;
      }
      
      setEditingRosterId(null);
      fetchClasses();
    } catch (e) {
      console.error(e);
      alert('Failed to update assigned mentors');
    }
  };

  if (!currentUser) return null;

  return (
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
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Scheduled Mentors</th>
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
                    {editingRosterId === c.id ? (
                      <div className="flex flex-col gap-2 p-2 border rounded" style={{ borderColor: 'var(--border-color)', maxHeight: '150px', overflowY: 'auto' }}>
                        {allMentors.map(m => (
                          <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedMentors.includes(m.id)}
                              onChange={() => toggleMentor(m.id)}
                            />
                            {m.name}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm">
                        {c.assignedMentors?.length > 0 
                          ? c.assignedMentors.map((m: any) => m.name).join(', ') 
                          : <span style={{ color: 'var(--text-secondary)' }}>None</span>}
                      </div>
                    )}
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
                        onChange={(e) => setEditValue(parseInt(e.target.value))}
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
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
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
                    ) : editingRosterId === c.id ? (
                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => handleSaveRoster(c.id)}
                        >
                          Save Mentors
                        </button>
                        <button 
                          className="btn"
                          style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--border-color)' }}
                          onClick={() => setEditingRosterId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button 
                          className="btn"
                          style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                          onClick={() => handleEditRoster(c.id, c.assignedMentors || [])}
                        >
                          Edit Mentors
                        </button>
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
  );
}
