'use client';

import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Cake, ChevronRight } from 'lucide-react';
import type { ClientForBirthday } from '../types';

interface BirthdaysSoonSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientForBirthday[];
  totalCount: number;
}

export function BirthdaysSoonSheet({
  open,
  onOpenChange,
  clients,
  totalCount,
}: BirthdaysSoonSheetProps) {
  const router = useRouter();

  const handleClientClick = (clientId: string) => {
    onOpenChange(false);
    router.push(`/clients/${clientId}`);
  };

  const handleSeeAll = () => {
    onOpenChange(false);
    router.push('/clients?filter=birthdays-soon');
  };

  const formatDaysUntil = (daysUntil: number): string => {
    if (daysUntil === 0) {
      return 'Today!';
    }
    if (daysUntil === 1) {
      return 'Tomorrow';
    }
    return `In ${daysUntil} days`;
  };

  const formatBirthdayDate = (birthday: string): string => {
    const date = new Date(birthday);
    return format(date, 'MMMM d');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Upcoming Birthdays</SheetTitle>
          <SheetDescription>
            {totalCount} client{totalCount !== 1 ? 's' : ''} with birthdays in the next 30 days
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-4 h-[calc(100vh-12rem)]">
          <div className="space-y-2 pr-4">
            {clients.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No upcoming birthdays in the next 30 days
              </p>
            ) : (
              clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientClick(client.id)}
                  className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatBirthdayDate(client.birthday)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-pink-100 px-2 py-1 dark:bg-pink-900/30">
                      <Cake className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
                      <span className="text-xs font-medium text-pink-600 dark:text-pink-400">
                        {formatDaysUntil(client.days_until)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
        {totalCount > clients.length && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSeeAll}
            >
              See all {totalCount} clients
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
