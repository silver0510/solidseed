'use client';

/**
 * Clients Page
 *
 * Displays the client list with search, filtering, and infinite scroll.
 * Mobile-first design with 44x44px touch targets.
 */

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ClientList } from '@/features/clients/components/ClientList';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import { Button } from '@/components/ui/button';
import type { ClientWithTags } from '@/features/clients';

export default function ClientsPage() {
  const router = useRouter();

  const handleClientClick = (client: ClientWithTags) => {
    router.push(`/clients/${client.id}`);
  };

  const handleAddClient = () => {
    // TODO: Open client form modal or navigate to add client page
    console.log('Add client clicked');
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Clients
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your client relationships
          </p>
        </div>
        <Button onClick={handleAddClient} size="lg" aria-label="Add new client">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="hidden sm:inline">Add Client</span>
        </Button>
      </div>

      {/* Content */}
      <Suspense fallback={<SectionLoader message="Loading clients..." />}>
        <ClientList onClientClick={handleClientClick} />
      </Suspense>
    </div>
  );
}
