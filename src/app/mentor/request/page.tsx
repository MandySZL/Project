'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../../contexts/UserContext';
import Calendar from '../../../components/Calendar';

export default function RequestLeavePage() {
  const { currentUser, users } = useUser();

  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [activeRequests, setActiveRequests] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const [sessionText, setSessionText] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
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

      const activeRes = await fetch('/api/requests?status=PENDING_SUBSTITUTE,PENDING_ADMIN,APPROVED');
      setActiveRequests(await activeRes.json());

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
    if (!sessionText || !selectedSubstituteId) {
      setError('Please type a session and select a substitute.');
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
          requestDate: selectedDate,
          sessionText: sessionText,
          substituteId: selectedSubstituteId,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit request');
      } else {
        setSessionText('');
        setSelectedSubstituteId('');
        setStep(1);
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
  const availableSubstitutes = otherMentors;

  const dateSlots: Record<string, number> = {};
  
  // First sum up the limits from all classes
  safeClasses.forEach(c => {
    const dateObj = new Date(c.time);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    if (!dateSlots[dateStr]) dateSlots[dateStr] = 0;
    dateSlots[dateStr] += c.leaveLimit;
  });

  // Then subtract active requests for each date
  activeRequests.forEach(req => {
    if (!req.requestDate) return;
    const dateObj = new Date(req.requestDate);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    if (dateSlots[dateStr]) {
      dateSlots[dateStr] -= 1;
    }
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
          {step === 1 ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Select Date</label>
              <Calendar
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setSessionText('');
                  setStep(2);
                }}
                dateSlots={dateSlots}
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-2">
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="btn btn-outline" 
                  style={{ padding: '4px 12px', fontSize: '0.9rem' }}
                >
                  &larr; Back
                </button>
                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                  Selected Date: {selectedDate}
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2" style={{ minHeight: '120px' }}>
                <label className="text-sm font-medium">Type Session (e.g. 10:00 AM)</label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="Which session needs a substitute?"
                  value={sessionText}
                  onChange={(e) => setSessionText(e.target.value)}
                />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Select Substitute Mentor</label>
            <select
              className="input-field"
              value={selectedSubstituteId}
              onChange={(e) => setSelectedSubstituteId(e.target.value)}
              disabled={!sessionText}
            >
              <option value="">
                {!sessionText ? '-- Please type a session first --' : '-- Choose a substitute --'}
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
            </>
          )}
        </form>
      </div>
    </div>
  );
}
