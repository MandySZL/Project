'use client';

import React, { useEffect, useState } from 'react';

export default function DashboardCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [classes, setClasses] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clsRes, reqRes] = await Promise.all([
          fetch('/api/classes'),
          fetch('/api/requests?status=APPROVED')
        ]);
        
        const clsData = await clsRes.json();
        const reqData = await reqRes.json();
        
        setClasses(Array.isArray(clsData) ? clsData : []);
        setRequests(Array.isArray(reqData) ? reqData : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const days = Array(firstDayOfMonth).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  // We don't need to group classes by date since they repeat weekly based on dayOfWeek.
  // We'll just filter them when rendering selectedClasses or determining hasClass.

  // Group requests by date and sessionText
  const requestsByDateSession: Record<string, any[]> = {};
  requests.forEach(req => {
    // Extract YYYY-MM-DD from requestDate directly to avoid timezone shift
    const dateStr = req.requestDate.split('T')[0];
    
    const key = `${dateStr}_${req.sessionText}`;
    if (!requestsByDateSession[key]) requestsByDateSession[key] = [];
    requestsByDateSession[key].push(req);
  });

  const selectedClasses = classes.filter(c => {
    // new Date("YYYY-MM-DD") parses as UTC, so getUTCDay() gets the correct weekday
    return c.dayOfWeek === new Date(selectedDate).getUTCDay();
  }).sort((a, b) => (a.timeString || '').localeCompare(b.timeString || ''));

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            onClick={prevMonth}
            className="btn transition-colors"
            style={{ padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={month}
              onChange={(e) => setCurrentMonth(new Date(year, parseInt(e.target.value), 1))}
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', fontWeight: 600, outline: 'none' }}
            >
              {monthNames.map((m, i) => (
                <option key={m} value={i} style={{ color: 'var(--text-primary)' }}>{m}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className="btn transition-colors"
            style={{ padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '12px' }}>
          {dayNames.map(d => (
            <div key={d} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {days.map((day, idx) => {
            if (!day) return <div key={idx} />;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const hasClass = classes.some(c => c.dayOfWeek === new Date(dateStr).getUTCDay());

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDate(dateStr)}
                style={{
                  padding: '16px 0',
                  borderRadius: '10px',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isSelected ? 'var(--accent-primary)' : 'inherit',
                  fontWeight: isSelected || isToday ? 700 : 500,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{day}</span>
                <div style={{ height: '6px' }}>
                  {hasClass && (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', marginTop: '4px' }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px' }}>
          Schedule Details: {selectedDate}
        </h3>
        
        {loading ? (
          <div className="text-sm">Loading details...</div>
        ) : selectedClasses.length === 0 ? (
          <div className="text-center" style={{ padding: '32px 0', color: 'var(--text-secondary)' }}>
            No classes scheduled for this date.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {selectedClasses.map(c => {
              const startTimeStr = c.timeString || '';
              const endTimeStr = c.endTimeString || '00:00';
              const displayStr = `${c.venue || 'TBD'} ${startTimeStr}-${endTimeStr}`;
              const sessionRequests = requestsByDateSession[`${selectedDate}_${displayStr}`] || [];
              const slotsTaken = sessionRequests.length;
              const slotsLeft = c.leaveLimit - slotsTaken;
              const isFull = slotsLeft <= 0;

              return (
                <div key={c.id} style={{ 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  padding: '20px',
                  background: 'var(--bg-primary)'
                }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {displayStr}
                      </div>
                    </div>
                  </div>

                  {sessionRequests.length > 0 && (
                    <div>
                      <div className="flex flex-col gap-3 items-start">
                        {sessionRequests.map(req => (
                          <div key={req.id} style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: '6px',
                            background: 'var(--bg-secondary)',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            borderLeft: `4px solid var(--success)`
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <div style={{ fontWeight: 600, minWidth: '80px' }}>{req.mentor.name}</div>
                              
                              <div style={{ width: '80px', margin: '0 12px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', opacity: 0.4 }}>
                                <div style={{ flex: 1, borderBottom: '2px dotted currentColor', height: '0px' }}></div>
                                <svg style={{ marginLeft: '-4px' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M9 18l6-6-6-6" />
                                </svg>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sub:</span>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.substitute.name}</span>
                              </div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status: {req.status}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
