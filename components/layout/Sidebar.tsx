'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  SettingsIcon,
  BellIcon,
  LogOutIcon,
  MoreVerticalIcon,
  Moon,
  Sun,
  Home,
  Users,
  Briefcase,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: <Users className="h-5 w-5" />,
  },
  {
    name: 'Deals',
    href: '/deals',
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

function NavLink({ item, onClick, isCollapsed }: { item: NavItem; onClick?: () => void; isCollapsed?: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  const link = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center rounded-lg text-sm font-medium transition-colors min-h-11',
        isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <span className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}>
        {item.icon}
      </span>
      {!isCollapsed && item.name}
    </Link>
  );

  if (!isCollapsed) {
    return link;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">
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

function UserMenu({ onClose, isCollapsed }: { onClose?: () => void; isCollapsed?: boolean }) {
  const { user, logout, isLoading } = useAuth();

  const displayName = user?.full_name || user?.email || 'User';
  const displayEmail = user?.email || '';
  const initials = getInitials(user?.full_name, user?.email);

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center rounded-lg bg-muted/50 p-2 animate-pulse",
        isCollapsed ? "justify-center" : "gap-3"
      )}>
        <div className="h-8 w-8 rounded-lg bg-muted" />
        {!isCollapsed && (
          <div className="flex-1 space-y-1">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-3 w-28 rounded bg-muted" />
          </div>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "flex w-full items-center rounded-lg bg-muted/50 p-2 text-sm hover:bg-muted transition-colors",
          isCollapsed ? "justify-center" : "gap-3"
        )}>
          <Avatar className="h-8 w-8 rounded-lg">
            {user?.image && <AvatarImage key={user.image} src={user.image} alt={displayName} />}
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="flex-1 text-left leading-tight">
                <p className="truncate font-medium text-sm">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
              </div>
              <MoreVerticalIcon className="h-4 w-4 text-muted-foreground" />
            </>
          )}
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
              {user?.image && <AvatarImage key={user.image} src={user.image} alt={displayName} />}
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

function NotificationsDropdown({ isCollapsed }: { isCollapsed?: boolean }) {
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
        <button className={cn(
          "flex w-full items-center rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
        )}>
          <span className="relative text-muted-foreground">
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </span>
          {!isCollapsed && 'Notifications'}
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

function SidebarContent({ onClose, isCollapsed }: { onClose?: () => void; isCollapsed?: boolean }) {
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
      <div className={cn(
        "flex h-16 items-center",
        isCollapsed ? "justify-center px-2" : "gap-3 px-6"
      )}>
        <div className="relative shrink-0">
          {isCollapsed ? (
            <Image
              src="/icons/icon-500x500.png"
              alt="SolidSeed Logo"
              width={32}
              height={32}
              priority
            />
          ) : (
            <Image
              src={isDark ? "/icons/icon-text-light.png" : "/icons/icon-text.png"}
              alt="SolidSeed Logo"
              width={140}
              height={54}
              // className="h-9 w-auto"
              priority
            />
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} onClick={onClose} isCollapsed={isCollapsed} />
          ))}
        </nav>
      </ScrollArea>

      {/* Notifications */}
      <div className="mt-auto px-4 pb-2">
        <NotificationsDropdown isCollapsed={isCollapsed} />
      </div>

      {/* Theme toggle */}
      <div className="px-4 pb-2">
        <button
          onClick={toggleTheme}
          className={cn(
            "flex w-full items-center rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
          )}
        >
          <span className="text-muted-foreground">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </span>
          {!isCollapsed && (isDark ? 'Light Mode' : 'Dark Mode')}
        </button>
      </div>

      {/* User menu */}
      <div className="p-4">
        <UserMenu onClose={onClose} isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
}

export function Sidebar({ isOpen, onClose, isCollapsed }: SidebarProps) {
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
      <aside className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:border-r lg:border-border lg:bg-card transition-all duration-300",
        isCollapsed ? "lg:w-16" : "lg:w-64"
      )}>
        <SidebarContent isCollapsed={isCollapsed} />
      </aside>
    </>
  );
}
