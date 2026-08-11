'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'ADMIN' | 'MENTOR';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  totalLeaveDays: number;
  usedLeaveDays: number;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
      
      // Attempt to load from sessionStorage
      const savedUserId = sessionStorage.getItem('mentorLeave_userId');
      if (savedUserId) {
        const found = data.find((u: User) => u.id === savedUserId);
        if (found) {
          setCurrentUser(found);
        } else {
          sessionStorage.removeItem('mentorLeave_userId');
        }
      }
      setIsLoaded(true);
    } catch (e) {
      console.error('Failed to fetch users', e);
      setIsLoaded(true);
    }
  };

  const loginUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      sessionStorage.setItem('mentorLeave_userId', user.id);
    } else {
      sessionStorage.removeItem('mentorLeave_userId');
    }
  };

  useEffect(() => {
    refreshUsers();
    
    // Auto-refresh user context globally every 5 seconds
    const intervalId = setInterval(() => {
      refreshUsers();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser: loginUser, users, refreshUsers }}>
      {/* We could optionally render a loading spinner while !isLoaded, but for now we render children */}
      {isLoaded ? children : null}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
