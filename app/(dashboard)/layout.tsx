'use client';

import { useState } from 'react';
import { QueryProvider } from '@/lib/query/QueryProvider';
import { AuthProvider } from '@/lib/auth/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sidebar, Header, BottomNav } from '@/components/layout';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AuthProvider>
      <ProtectedRoute>
        <QueryProvider>
          <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              isCollapsed={sidebarCollapsed}
            />

            {/* Main content area */}
            <div className={cn(
              "transition-all duration-300",
              sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
            )}>
              {/* Header */}
              <Header
                onMenuClick={() => setSidebarOpen(true)}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                isCollapsed={sidebarCollapsed}
              />

              {/* Page content */}
              <main className="pb-20 lg:pb-6">
                <div className="mx-auto max-w-container">
                  {children}
                </div>
              </main>
            </div>

            {/* Mobile bottom navigation */}
            <BottomNav />
          </div>
        </QueryProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}
