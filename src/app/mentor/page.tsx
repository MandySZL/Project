'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import Calendar from '../../components/Calendar';

export default function MentorDashboard() {
  const { currentUser, users } = useUser();
  
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [substituteRequests, setSubstituteRequests] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSubstituteId, setSelectedSubstituteId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      // Fetch my requests
      const reqRes = await fetch(`/api/requests?mentorId=${currentUser.id}`);
      setMyRequests(await reqRes.json());

      // Fetch requests asking me to substitute
      const subRes = await fetch(`/api/requests?substituteId=${currentUser.id}&status=PENDING_SUBSTITUTE`);
      setSubstituteRequests(await subRes.json());

      // Fetch available classes
      const classRes = await fetch('/api/classes');
      setClasses(await classRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh data every 5 seconds
    const intervalId = setInterval(() => {
      fetchData();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [currentUser]);

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSubstituteId) {
      setError('Please select both a class and a substitute.');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: currentUser?.id,
          classId: selectedClassId,
          substituteId: selectedSubstituteId,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit request');
      } else {
        setSelectedClassId('');
        setSelectedSubstituteId('');
        fetchData(); // Refresh lists
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubstituteAction = async (id: string, action: 'ACCEPT_SUB' | 'DECLINE_SUB') => {
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      fetchData(); // Refresh lists
    } catch (e) {
      console.error(e);
      alert('Action failed');
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert('Failed to cancel: ' + (data.error || 'Unknown error'));
        return;
      }
      fetchData(); // Refresh lists
    } catch (e) {
      console.error(e);
      alert('Failed to cancel request (Network error)');
    }
  };

  if (!currentUser) return null;

  const remainingDays = currentUser.totalLeaveDays - currentUser.usedLeaveDays;
  const otherMentors = users.filter(u => u.role === 'MENTOR' && u.id !== currentUser.id);

  const safeClasses = Array.isArray(classes) ? classes : [];
  const selectedClass = safeClasses.find(c => c.id === selectedClassId);
  const availableSubstitutes = otherMentors.filter(m => 
    !selectedClass?.assignedMentors?.some((am: any) => am.id === m.id)
  );

  const filteredClasses = safeClasses.filter(c => {
    if (!selectedDate) return false;
    const dateObj = new Date(c.time);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}` === selectedDate;
  });

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

      <div className="flex gap-8 flex-col lg:flex-row">
        {/* 2. Request Leave Form */}
        <div className="glass-panel flex-1">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px' }}>Request New Leave</h2>
          
          {error && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRequestLeave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Select Date</label>
              <Calendar 
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setSelectedClassId('');
                }}
                classDates={safeClasses.map(c => {
                  const dateObj = new Date(c.time);
                  const y = dateObj.getFullYear();
                  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const d = String(dateObj.getDate()).padStart(2, '0');
                  return `${y}-${m}-${d}`;
                })}
              />
            </div>

            {selectedDate && (
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-sm font-medium">Select Session</label>
                {filteredClasses.length === 0 ? (
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No classes scheduled for this date.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {filteredClasses.map(c => {
                      const slotsLeft = c.leaveLimit - c.currentLeaves;
                      
                      // Check if mentor already has an active request for this class
                      const hasActiveRequest = myRequests.some(req => 
                        req.classId === c.id && 
                        ['PENDING_SUBSTITUTE', 'PENDING_ADMIN', 'APPROVED'].includes(req.status)
                      );
                      
                      const isFull = slotsLeft <= 0;
                      const isDisabled = isFull || hasActiveRequest;
                      
                      const timeStr = new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const isSelected = selectedClassId === c.id;

                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedClassId(c.id)}
                          style={{
                            padding: '16px',
                            borderRadius: '12px',
                            border: isSelected ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.2)',
                            background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                            textAlign: 'left',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.5 : 1,
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            color: isSelected ? '#fff' : 'inherit'
                          }}
                        >
                          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{timeStr}</div>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: 600,
                            background: isDisabled ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: isDisabled ? '#fca5a5' : '#6ee7b7',
                            alignSelf: 'flex-start'
                          }}>
                            {hasActiveRequest ? 'Already Requested' : isFull ? 'No Slots' : `${slotsLeft} Slot(s) Left`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Select Substitute Mentor</label>
              <select 
                className="input-field"
                value={selectedSubstituteId}
                onChange={(e) => setSelectedSubstituteId(e.target.value)}
                disabled={!selectedClassId}
              >
                <option value="">
                  {!selectedClassId ? '-- Please select a session first --' : '-- Choose a substitute --'}
                </option>
                {availableSubstitutes.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary mt-2"
              disabled={submitting || remainingDays <= 0}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            {remainingDays <= 0 && (
               <div className="text-sm text-center" style={{ color: 'var(--danger)' }}>
                 You have used all your leave days.
               </div>
            )}
          </form>
        </div>

        {/* Action Needed: Substitute Requests */}
        {substituteRequests.length > 0 && (
          <div className="glass-panel flex-1" style={{ border: '1px solid var(--warning)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px', color: 'var(--warning)' }}>
              Action Needed: Substitute Requests
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Other mentors have requested you to substitute for them.
            </p>
            <div className="flex flex-col gap-4">
              {substituteRequests.map(req => (
                <div key={req.id} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div className="font-medium mb-1">{req.mentor.name} needs a substitute</div>
                  <div className="text-sm mb-3">{new Date(req.classSession.time).toLocaleString()}</div>
                  <div className="flex gap-2">
                    <button className="btn btn-success" style={{ flex: 1, padding: '6px' }} onClick={() => handleSubstituteAction(req.id, 'ACCEPT_SUB')}>Accept</button>
                    <button className="btn btn-danger" style={{ flex: 1, padding: '6px' }} onClick={() => handleSubstituteAction(req.id, 'DECLINE_SUB')}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. My Leave Requests List */}
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
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Class Date</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Substitute</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 8px' }}>
                      {new Date(req.classSession.time).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {req.substitute.name}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${
                        req.status === 'APPROVED' ? 'badge-approved' : 
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
