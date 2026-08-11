import type { Metadata } from 'next';
import './globals.css';
import { UserProvider } from '../contexts/UserContext';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'Mentor Leave System',
  description: 'Attendance and leave management for mentors',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <Navbar />
          <main className="container mt-8 mb-8" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {children}
          </main>
        </UserProvider>
      </body>
    </html>
  );
}
