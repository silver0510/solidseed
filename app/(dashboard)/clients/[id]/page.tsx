'use client';

/**
 * Client Profile Page
 *
 * Displays detailed client information with tabs for Overview, Documents, Notes, and Tasks.
 * Mobile-first design with bottom tab navigation.
 */

import { Suspense, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientProfile } from '@/features/clients/components/ClientProfile';
import { ClientForm } from '@/features/clients/components/ClientForm';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { clientApi, clientQueryKeys, taskApi, noteApi, documentApi } from '@/features/clients/api/clientApi';
import type { ClientFormData } from '@/features/clients';

// Metric card component matching dashboard design
function MetricCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
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
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
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

  // Fetch counts for metrics
  const { data: tasks } = useQuery({
    queryKey: ['clients', clientId, 'tasks'],
    queryFn: () => taskApi.getClientTasks(clientId),
    enabled: !!clientId,
  });

  const { data: notes } = useQuery({
    queryKey: ['clients', clientId, 'notes'],
    queryFn: () => noteApi.getClientNotes(clientId),
    enabled: !!clientId,
  });

  const { data: documents } = useQuery({
    queryKey: ['clients', clientId, 'documents'],
    queryFn: () => documentApi.getClientDocuments(clientId),
    enabled: !!clientId,
  });

  const activeTasksCount = tasks?.filter((t) => t.status !== 'closed').length ?? 0;
  const closedTasksCount = tasks?.filter((t) => t.status === 'closed').length ?? 0;
  const notesCount = notes?.length ?? 0;
  const documentsCount = documents?.length ?? 0;

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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold truncate">
              {client?.name || 'Loading...'}
            </h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            {client?.email || 'Loading client details...'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleEdit} aria-label="Edit client" className="shrink-0">
          <svg
            className="h-4 w-4"
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
          <span className="hidden sm:inline ml-1">Edit</span>
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricCard
          title="Active Tasks"
          value={activeTasksCount}
          subtitle={activeTasksCount === 1 ? 'Task to complete' : 'Tasks to complete'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Closed"
          value={closedTasksCount}
          subtitle="Tasks done"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Notes"
          value={notesCount}
          subtitle="Interactions logged"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          }
        />
        <MetricCard
          title="Documents"
          value={documentsCount}
          subtitle="Files uploaded"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
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
