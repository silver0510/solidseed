'use client';

/**
 * Clients Page
 *
 * Displays the client list with search, filtering, and infinite scroll.
 * Mobile-first design with 44x44px touch targets.
 */

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientList } from '@/features/clients/components/ClientList';
import { ClientForm } from '@/features/clients/components/ClientForm';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { clientApi, clientQueryKeys } from '@/features/clients/api/clientApi';
import type { ClientWithTags, ClientFormData } from '@/features/clients';

export default function ClientsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const createClientMutation = useMutation({
    mutationFn: (data: ClientFormData) => clientApi.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
      setIsDialogOpen(false);
    },
  });

  const handleClientClick = (client: ClientWithTags) => {
    router.push(`/clients/${client.id}`);
  };

  const handleAddClient = () => {
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (data: ClientFormData) => {
    await createClientMutation.mutateAsync(data);
  };

  const handleFormCancel = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Content */}
      <Suspense fallback={<SectionLoader message="Loading clients..." />}>
        <ClientList onClientClick={handleClientClick} onAddClient={handleAddClient} />
      </Suspense>

      {/* Add Client Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client profile. Fill in the required information below.
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isSubmitting={createClientMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
