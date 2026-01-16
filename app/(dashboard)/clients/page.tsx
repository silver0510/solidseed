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
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <button
            onClick={handleAddClient}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label="Add new client"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="pb-20">
        <Suspense fallback={<SectionLoader message="Loading clients..." />}>
          <div className="px-4">
            <ClientList onClientClick={handleClientClick} />
          </div>
        </Suspense>
      </main>
    </div>
  );
}
