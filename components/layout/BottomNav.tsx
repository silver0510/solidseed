'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

const navigation: NavItem[] = [
  {
    name: 'Home',
    href: '/dashboard',
    icon: <Home className="h-6 w-6" strokeWidth={1.5} />,
    activeIcon: <Home className="h-6 w-6" fill="currentColor" strokeWidth={0} />,
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: <Users className="h-6 w-6" strokeWidth={1.5} />,
    activeIcon: <Users className="h-6 w-6" fill="currentColor" strokeWidth={0} />,
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: <CheckCircle2 className="h-6 w-6" strokeWidth={1.5} />,
    activeIcon: <CheckCircle2 className="h-6 w-6" fill="currentColor" strokeWidth={0} />,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card lg:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[64px] min-h-[56px] rounded-lg transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive ? item.activeIcon : item.icon}
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)] bg-card" />
    </nav>
  );
}
