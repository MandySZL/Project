'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = useUser();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    } else if (currentUser.role !== 'ADMIN') {
      router.push('/login'); // Or show an access denied
    } else {
      setChecked(true);
    }
  }, [currentUser, router]);

  if (!checked) return null;

  return (
    <>
      {children}
    </>
  );
}
