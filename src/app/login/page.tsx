'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useRouter } from 'next/navigation';

export default function UnifiedLogin() {
  const { users, currentUser, setCurrentUser } = useUser();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // If already logged in as a mentor, redirect to mentor dashboard
  useEffect(() => {
    if (currentUser) {
      router.push(currentUser.role === 'ADMIN' ? '/admin' : '/mentor');
    }
  }, [currentUser, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // In a real app this would be an API call to verify password.
    // For MVP, we verify against the context users.
    const user = users.find(u => 
      u.username?.toLowerCase() === username.trim().toLowerCase()
    );
    
    if (!user) {
      setError('Invalid username or account not found.');
      return;
    }

    if (user.password !== password) {
      setError('Invalid password.');
      return;
    }

    setCurrentUser(user);
  };

  return (
    <div className="flex justify-center items-center w-full">
      <div className="glass-panel" style={{ width: '400px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px', textAlign: 'center' }}>Log In</h2>
        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Username</label>
            <input 
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., alice"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Password</label>
            <input 
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary mt-4" disabled={!username || !password}>
            Log In
          </button>
          
          <div className="text-center mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <a href="/signup" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Sign Up</a>
          </div>
        </form>
      </div>
    </div>
  );
}
