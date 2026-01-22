'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SettingsIcon,
  BellIcon,
  LogOutIcon,
  MoreVerticalIcon,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth/useAuth';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            onClick={onClick}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-11',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}>
              {item.icon}
            </span>
            {item.name}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="lg:hidden">
          {item.name}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function getInitials(name: string | undefined, email: string | undefined): string {
  if (name) {
    const parts = name.split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'U';
}

function UserMenu({ onClose }: { onClose?: () => void }) {
  const { user, logout, isLoading } = useAuth();

  const displayName = user?.full_name || user?.email || 'User';
  const displayEmail = user?.email || '';
  const initials = getInitials(user?.full_name, user?.email);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-2 animate-pulse">
        <div className="h-8 w-8 rounded-lg bg-muted" />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-3 w-28 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg bg-muted/50 p-2 text-sm hover:bg-muted transition-colors">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left leading-tight">
            <p className="truncate font-medium text-sm">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
          </div>
          <MoreVerticalIcon className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="start"
        side="right"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 leading-tight">
              <p className="truncate font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings" onClick={onClose}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="text-destructive focus:text-destructive"
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationsDropdown() {
  const notifications = [
    {
      id: '1',
      title: 'New client added',
      description: 'John Smith was added to your client list',
      time: '5 min ago',
      read: false,
    },
    {
      id: '2',
      title: 'Task due soon',
      description: 'Follow up with Sarah Johnson is due tomorrow',
      time: '1 hour ago',
      read: false,
    },
    {
      id: '3',
      title: 'Document uploaded',
      description: 'Contract.pdf was uploaded to Mike Brown\'s profile',
      time: '2 hours ago',
      read: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <span className="relative text-muted-foreground">
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </span>
          Notifications
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 rounded-lg"
        align="start"
        side="right"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-medium">
          Notifications
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-1 p-3 cursor-pointer"
            >
              <div className="flex w-full items-start justify-between gap-2">
                <p className={cn(
                  "text-sm font-medium leading-tight",
                  !notification.read && "text-foreground"
                )}>
                  {notification.title}
                </p>
                {!notification.read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {notification.description}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {notification.time}
              </p>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-sm text-primary hover:text-primary cursor-pointer">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = mounted && theme === 'dark';

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
          K
        </div>
        <span className="font-semibold text-lg">Korella</span>
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} onClick={onClose} />
          ))}
        </nav>
      </ScrollArea>

      {/* Notifications */}
      <div className="mt-auto px-4 pb-2">
        <NotificationsDropdown />
      </div>

      {/* Theme toggle */}
      <div className="px-4 pb-2">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span className="text-muted-foreground">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </span>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      {/* User menu */}
      <div className="p-4">
        <UserMenu onClose={onClose} />
      </div>
    </div>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile sidebar using Sheet */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent onClose={onClose} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:border-r lg:border-border lg:bg-card">
        <SidebarContent />
      </aside>
    </>
  );
}
