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
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import type { ClientForFollowup } from '../types';

interface NeedFollowupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientForFollowup[];
  totalCount: number;
}

export function NeedFollowupSheet({
  open,
  onOpenChange,
  clients,
  totalCount,
}: NeedFollowupSheetProps) {
  const router = useRouter();

  const handleClientClick = (clientId: string) => {
    onOpenChange(false);
    router.push(`/clients/${clientId}`);
  };

  const handleSeeAll = () => {
    onOpenChange(false);
    router.push('/clients?filter=need-followup');
  };

  const formatLastContact = (lastNoteDate: string | null): string => {
    if (!lastNoteDate) {
      return 'No notes yet';
    }
    return `Last note ${formatDistanceToNow(new Date(lastNoteDate), { addSuffix: true })}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Need Follow-up</SheetTitle>
          <SheetDescription>
            {totalCount} client{totalCount !== 1 ? 's' : ''} with no contact in 30+ days
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-4 h-[calc(100vh-12rem)]">
          <div className="space-y-2 pr-4">
            {clients.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                All clients have been contacted recently!
              </p>
            ) : (
              clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleClientClick(client.id)}
                  className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
                >
                  <p className="font-medium text-foreground">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    {formatLastContact(client.last_note_date)}
                  </p>
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
