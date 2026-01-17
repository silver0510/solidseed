'use client';

import { useState } from 'react';
import { QueryProvider } from '@/lib/query/QueryProvider';
import { AuthProvider } from '@/lib/auth/useAuth';
import { Sidebar, Header, BottomNav } from '@/components/layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <QueryProvider>
        <div className="min-h-screen bg-background">
          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* Main content area */}
          <div className="lg:pl-64">
            {/* Header */}
            <Header onMenuClick={() => setSidebarOpen(true)} />

            {/* Page content */}
            <main className="pb-20 lg:pb-6">
              {children}
            </main>
          </div>

          {/* Mobile bottom navigation */}
          <BottomNav />
        </div>
      </QueryProvider>
    </AuthProvider>
  );
}
