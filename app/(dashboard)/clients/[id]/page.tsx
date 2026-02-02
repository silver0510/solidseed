'use client';

/**
 * Client Profile Page
 *
 * Displays detailed client information with tabs for Overview, Documents, Notes, and Tasks.
 * Mobile-first design with bottom tab navigation.
 */

import { Suspense, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { ClientProfile } from '@/features/clients/components/ClientProfile';
import { ClientForm } from '@/features/clients/components/ClientForm';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { clientApi, clientQueryKeys } from '@/features/clients/api/clientApi';
import type { ClientFormData } from '@/features/clients';
import type { ClientStatus, UserTag } from '@/lib/types/client';
import { ArrowLeft, Pencil } from 'lucide-react';

// =============================================================================
// API HELPERS
// =============================================================================

/**
 * Fetch client status by ID
 */
async function fetchClientStatus(statusId: string): Promise<ClientStatus | null> {
  const response = await fetch(`/api/client-statuses/${statusId}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
}

/**
 * Fetch all user tags
 */
async function fetchUserTags(): Promise<UserTag[]> {
  const response = await fetch('/api/user-tags');
  if (!response.ok) {
    throw new Error('Failed to fetch user tags');
  }
  return response.json();
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Status Badge Component - Displays client status with color
 */
function StatusBadge({ statusId }: { statusId: string }) {
  const { data: status } = useSuspenseQuery({
    queryKey: ['client-status', statusId],
    queryFn: () => fetchClientStatus(statusId),
    staleTime: 5 * 60 * 1000,
  });

  if (!status) {
    return null;
  }

  return (
    <Badge
      variant="secondary"
      className="font-medium"
      style={{
        backgroundColor: `${status.color}20`,
        color: status.color,
        borderColor: `${status.color}40`,
      }}
    >
      {status.name}
    </Badge>
  );
}

/**
 * Tags Display Component - Shows client tags with colors
 */
function TagsDisplay({ tagNames }: { tagNames: string[] }) {
  const { data: allTags } = useSuspenseQuery({
    queryKey: ['user-tags'],
    queryFn: fetchUserTags,
    staleTime: 5 * 60 * 1000,
  });

  const clientTags = allTags.filter((tag) => tagNames.includes(tag.name));

  if (clientTags.length === 0) {
    return null;
  }

  return (
    <>
      {clientTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="flex items-center gap-1"
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          <span>{tag.name}</span>
        </Badge>
      ))}
    </>
  );
}


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
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          aria-label="Go back to clients list"
          className="-ml-2 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold truncate">
              {client?.name || 'Loading...'}
            </h1>
            {/* Status Badge */}
            {client?.status_id && (
              <Suspense fallback={<div className="h-6 w-20 bg-muted animate-pulse rounded" />}>
                <StatusBadge statusId={client.status_id} />
              </Suspense>
            )}
          </div>
          {/* Email and Tags */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <p className="text-muted-foreground">
              {client?.email || 'Loading client details...'}
            </p>
            {/* Tags */}
            {client?.tags && client.tags.length > 0 && (
              <>
                {/* <span className="text-muted-foreground">•</span> */}
                <Suspense fallback={<div className="h-6 w-32 bg-muted animate-pulse rounded" />}>
                  <TagsDisplay tagNames={client.tags} />
                </Suspense>
              </>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleEdit} aria-label="Edit client" className="shrink-0">
          <Pencil className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          <span className="hidden sm:inline ml-1">Edit</span>
        </Button>
      </div>

      {/* Content */}
      <Suspense fallback={<SectionLoader message="Loading client profile..." />}>
        <ClientProfile key={profileKey} clientId={clientId} />
      </Suspense>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-125">
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
