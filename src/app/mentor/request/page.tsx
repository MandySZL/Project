'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../../contexts/UserContext';
import Calendar from '../../../components/Calendar';

export default function RequestLeavePage() {
  const { currentUser, users } = useUser();

  const [myRequests, setMyRequests] = useState<any[]>([]);
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
      const reqRes = await fetch(`/api/requests?mentorId=${currentUser.id}`);
      setMyRequests(await reqRes.json());

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
        fetchData(); 
        alert('Request submitted successfully!');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) return null;

  const remainingDays = currentUser.totalLeaveDays - currentUser.usedLeaveDays;
  const otherMentors = users.filter(u => u.id !== currentUser.id);

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
      <div className="glass-panel w-full">
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

          <div className="flex flex-col gap-2 mt-2" style={{ minHeight: '120px' }}>
            <label className="text-sm font-medium">Select Session</label>
            {!selectedDate ? (
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Please select a date from the calendar first.
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No classes scheduled for this date.
              </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {filteredClasses.map(c => {
                    const slotsLeft = c.leaveLimit - c.currentLeaves;
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
    </div>
  );
}
