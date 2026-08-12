'use client';

import React, { useState } from 'react';

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  classDates: string[]; // Array of 'YYYY-MM-DD' that have classes available
}

export default function Calendar({ selectedDate, onSelectDate, classDates }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) return new Date(selectedDate);
    return new Date();
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
      <div className="flex justify-between items-center mb-4">
        <button 
          type="button" 
          onClick={prevMonth} 
          className="btn transition-colors" 
          style={{ padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
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
          <select 
            value={year} 
            onChange={(e) => setCurrentMonth(new Date(parseInt(e.target.value), month, 1))}
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', fontWeight: 600, outline: 'none' }}
          >
            {[year - 1, year, year + 1].map(y => (
              <option key={y} value={y} style={{ color: 'var(--text-primary)' }}>{y}</option>
            ))}
          </select>
        </div>
        <button 
          type="button" 
          onClick={nextMonth} 
          className="btn transition-colors" 
          style={{ padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
        {dayNames.map(d => (
          <div key={d} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {days.map((day, idx) => {
          if (!day) return <div key={idx} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = dateStr === selectedDate;
          const hasClass = classDates.includes(dateStr);
          const isToday = dateStr === new Date().toISOString().split('T')[0];

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              style={{
                padding: '12px 0',
                borderRadius: '8px',
                border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: isSelected ? '#fff' : 'inherit',
                fontWeight: isSelected || isToday ? 600 : 400,
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
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: hasClass ? 'var(--accent-primary)' : 'transparent'
              }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
