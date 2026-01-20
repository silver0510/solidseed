'use client';

/**
 * Client Profile Page
 *
 * Displays detailed client information with tabs for Overview, Documents, Notes, and Tasks.
 * Mobile-first design with bottom tab navigation.
 */

import { Suspense, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientProfile } from '@/features/clients/components/ClientProfile';
import { ClientForm } from '@/features/clients/components/ClientForm';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { clientApi, clientQueryKeys } from '@/features/clients/api/clientApi';
import type { ClientFormData } from '@/features/clients';

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const clientId = params.id as string;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [profileKey, setProfileKey] = useState(0);

  // Fetch client data for the edit form
  const { data: client } = useQuery({
    queryKey: clientQueryKeys.detail(clientId),
    queryFn: () => clientApi.getClient(clientId),
    enabled: !!clientId,
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: (data: ClientFormData) => clientApi.updateClient(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
      setIsEditDialogOpen(false);
      // Force ClientProfile to re-mount and refetch data
      setProfileKey((prev) => prev + 1);
    },
  });

  const handleBack = () => {
    router.push('/clients');
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: ClientFormData) => {
    await updateClientMutation.mutateAsync(data);
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
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
        <div className="flex-1" />
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
        <ClientProfile key={profileKey} clientId={clientId} />
      </Suspense>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client information below.
            </DialogDescription>
          </DialogHeader>
          {client && (
            <ClientForm
              client={client}
              onSubmit={handleEditSubmit}
              onCancel={handleEditCancel}
              isSubmitting={updateClientMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
