'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeaderProps {
  onMenuClick: () => void;
}

function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/clients': 'Clients',
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

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-card px-4 lg:px-6">
      {/* Mobile menu button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden mr-3"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open menu</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Page title */}
      <h1 className="font-semibold text-lg">{pageTitle}</h1>
    </header>
  );
}
