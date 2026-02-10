'use client';

/**
 * Clients Page
 *
 * Displays the client list with search, filtering, and infinite scroll.
 * Mobile-first design with 44x44px touch targets.
 */

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ClientList } from '@/features/clients/components/ClientList';
import { ClientForm } from '@/features/clients/components/ClientForm';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { clientApi, clientQueryKeys } from '@/features/clients/api/clientApi';
import { CSVUploadDialog } from '@/features/clients/components/CSVUploadDialog';
import type { ClientWithTags, ClientFormData } from '@/features/clients';
import { Users, UserPlus, Clock, Cake, X } from 'lucide-react';

export type SpecialFilter = 'need-followup' | 'birthdays-soon' | null;

// Metric card component matching dashboard design
function MetricCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  onAction,
  actionLabel,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger' | 'info' | 'success' | 'pink';
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {subtitle}
              </p>
            )}
            {onAction && actionLabel && Number(value) > 0 && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 mt-1 text-xs"
                onClick={onAction}
              >
                {actionLabel}
              </Button>
            )}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            variant === 'danger' ? 'bg-destructive/10 text-destructive' :
            variant === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
            variant === 'info' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
            variant === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
            variant === 'pink' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' :
            'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
          }`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ClientWithTags | null>(null);
  const [specialFilter, setSpecialFilter] = useState<SpecialFilter>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Check for action=new query parameter to open dialog
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      setIsDialogOpen(true);
      // Remove the query parameter after opening the dialog
      router.replace('/clients');
    }
  }, [searchParams, router]);

  // Fetch client stats for metrics
  const { data: clientStats } = useQuery({
    queryKey: clientQueryKeys.stats(),
    queryFn: () => clientApi.getClientStats(),
  });

  // Fetch full client data for editing
  const { data: selectedClient, isLoading: isLoadingClient } = useQuery({
    queryKey: clientQueryKeys.detail(selectedClientId!),
    queryFn: () => clientApi.getClient(selectedClientId!),
    enabled: !!selectedClientId && isEditDialogOpen,
  });

  const createClientMutation = useMutation({
    mutationFn: (data: ClientFormData) => clientApi.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      // Error will be displayed by the form
      console.error('Failed to create client:', error);
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientFormData }) =>
      clientApi.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
      setIsEditDialogOpen(false);
      setSelectedClientId(null);
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: string) => clientApi.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
    },
  });

  const handleClientClick = (client: ClientWithTags) => {
    router.push(`/clients/${client.id}`);
  };

  const handleAddClient = () => {
    setIsDialogOpen(true);
  };

  const handleEditClient = (client: ClientWithTags) => {
    setSelectedClientId(client.id);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClient = (client: ClientWithTags) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      await deleteClientMutation.mutateAsync(clientToDelete.id);
      setIsDeleteDialogOpen(false);
      setClientToDelete(null);
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const handleFormSubmit = async (data: ClientFormData) => {
    await createClientMutation.mutateAsync(data);
  };

  const handleEditFormSubmit = async (data: ClientFormData) => {
    if (selectedClientId) {
      await updateClientMutation.mutateAsync({ id: selectedClientId, data });
    }
  };

  const handleFormCancel = () => {
    setIsDialogOpen(false);
  };

  const handleEditFormCancel = () => {
    setIsEditDialogOpen(false);
    setSelectedClientId(null);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricCard
          title="Total Clients"
          value={clientStats?.total_clients ?? 0}
          variant="info"
          icon={<Users className="h-5 w-5" strokeWidth={1.5} />}
        />
        <MetricCard
          title="New This Month"
          value={clientStats?.new_this_month ?? 0}
          subtitle="Added recently"
          variant="success"
          icon={<UserPlus className="h-5 w-5" strokeWidth={1.5} />}
        />
        <MetricCard
          title="Need Follow-up"
          value={clientStats?.need_followup.count ?? 0}
          subtitle="No contact in 30+ days"
          variant="warning"
          icon={<Clock className="h-5 w-5" strokeWidth={1.5} />}
          onAction={() => setSpecialFilter('need-followup')}
          actionLabel="View list"
        />
        <MetricCard
          title="Birthdays Soon"
          value={clientStats?.birthdays_soon.count ?? 0}
          subtitle="Next 30 days"
          variant="pink"
          icon={<Cake className="h-5 w-5" strokeWidth={1.5} />}
          onAction={() => setSpecialFilter('birthdays-soon')}
          actionLabel="View list"
        />
      </div>

      {/* Client List Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {specialFilter === 'need-followup' ? 'Clients Needing Follow-up' :
             specialFilter === 'birthdays-soon' ? 'Clients with Upcoming Birthdays' :
             'All Clients'}
          </h2>
          {specialFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSpecialFilter(null)}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear filter
            </Button>
          )}
        </div>
        <Suspense fallback={<SectionLoader message="Loading clients..." />}>
          <ClientList
            onClientClick={handleClientClick}
            onAddClient={handleAddClient}
            onImportClick={() => setIsImportDialogOpen(true)}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
            specialFilter={specialFilter}
          />
        </Suspense>
      </div>

      {/* Add Client Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-125">
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

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client information below.
            </DialogDescription>
          </DialogHeader>
          {isLoadingClient ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <Spinner className="size-8 text-primary" />
                <p className="text-sm text-muted-foreground">Loading client data...</p>
              </div>
            </div>
          ) : selectedClient ? (
            <ClientForm
              client={selectedClient}
              onSubmit={handleEditFormSubmit}
              onCancel={handleEditFormCancel}
              isSubmitting={updateClientMutation.isPending}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this client? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {clientToDelete && (
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-sm font-medium text-foreground">{clientToDelete.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{clientToDelete.email}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelDelete}
                disabled={deleteClientMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteClientMutation.isPending}
              >
                {deleteClientMutation.isPending ? 'Deleting...' : 'Delete Client'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <CSVUploadDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />

    </div>
  );
}
