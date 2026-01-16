'use client';

/**
 * Client Profile Page
 *
 * Displays detailed client information with tabs for Overview, Documents, Notes, and Tasks.
 * Mobile-first design with bottom tab navigation.
 */

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ClientProfile } from '@/features/clients/components/ClientProfile';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import { Button } from '@/components/ui/button';

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const handleBack = () => {
    router.push('/clients');
  };

  const handleEdit = () => {
    // TODO: Open edit modal or navigate to edit page
    console.log('Edit client clicked');
  };

  if (!clientId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Client not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Page header */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          aria-label="Go back to clients list"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">
            Client Profile
          </h1>
        </div>
        <Button variant="outline" onClick={handleEdit} aria-label="Edit client">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
          <span className="hidden sm:inline">Edit</span>
        </Button>
      </div>

      {/* Content */}
      <Suspense fallback={<SectionLoader message="Loading client profile..." />}>
        <ClientProfile clientId={clientId} />
      </Suspense>
    </div>
  );
}
