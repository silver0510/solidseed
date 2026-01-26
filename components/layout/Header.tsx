'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { PanelLeftIcon, PanelLeftCloseIcon, SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface HeaderProps {
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}

function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/clients': 'Clients',
    '/deals': 'Deals',
    '/tasks': 'Tasks',
    '/settings': 'Settings',
  };

  // Check for exact match first
  if (routes[pathname]) {
    return routes[pathname];
  }

  // Check for nested routes
  for (const [path, title] of Object.entries(routes)) {
    if (pathname.startsWith(path + '/')) {
      return title;
    }
  }

  return 'Dashboard';
}

export function Header({ onMenuClick, onToggleCollapse, isCollapsed }: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const isClientsPage = pathname === '/clients' || pathname.startsWith('/clients/');

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 lg:px-6">
      {/* Sidebar toggle - mobile only */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden h-8 w-8"
        aria-label="Open menu"
      >
        <PanelLeftIcon className="h-5 w-5" />
      </Button>

      {/* Sidebar collapse toggle - desktop only */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleCollapse}
        className="hidden lg:flex h-8 w-8"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <PanelLeftIcon className="h-5 w-5" />
        ) : (
          <PanelLeftCloseIcon className="h-5 w-5" />
        )}
      </Button>

      <Separator orientation="vertical" className="h-4" />

      {/* Page title */}
      <h1 className="text-base font-medium">{pageTitle}</h1>

      {/* Client Settings button - shown only on clients page */}
      {isClientsPage && (
        <div className="ml-auto">
          <Link href="/settings/clients">
            <Button variant="outline" size="sm" className="h-8">
              <SettingsIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Client Settings</span>
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
