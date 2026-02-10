'use client';

import { useNotifications, useNotificationMutations } from '@/features/notifications';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { BellIcon, CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types/notification';

export default function NotificationsPage() {
  const router = useRouter();
  const { markAsRead, markAllAsRead } = useNotificationMutations();

  // Fetch all, unread, and read notifications
  const all = useNotifications({ filters: { limit: 50 } });
  const unread = useNotifications({ filters: { read: false, limit: 50 } });
  const read = useNotifications({ filters: { read: true, limit: 50 } });

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read_at) {
      markAsRead(notification.id);
    }

    // Navigate to action URL
    const actionUrl = notification.metadata?.action_url as string | undefined;
    if (actionUrl) {
      router.push(actionUrl);
    }
  };

  const renderNotifications = (notifications: Notification[], isLoading: boolean) => {
    if (isLoading) {
      return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
    }

    if (notifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BellIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No notifications</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={cn(
              'p-4 cursor-pointer transition-colors hover:bg-muted/50',
              !notification.read_at && 'border-l-4 border-l-primary'
            )}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className={cn(
                    'text-sm font-medium',
                    !notification.read_at && 'text-foreground font-semibold'
                  )}>
                    {notification.title}
                  </h4>
                  {!notification.read_at && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                {notification.message && (
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/70">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
              {!notification.read_at && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                >
                  <CheckIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Stay updated on your tasks and activities
          </p>
        </div>
        {unread.unreadCount > 0 && (
          <Button onClick={() => markAllAsRead()} variant="outline">
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All ({all.totalCount})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unread.unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({read.totalCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderNotifications(all.notifications, all.isLoading)}
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          {renderNotifications(unread.notifications, unread.isLoading)}
        </TabsContent>

        <TabsContent value="read" className="mt-6">
          {renderNotifications(read.notifications, read.isLoading)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
