/**
 * New Deal Page
 *
 * Multi-step deal creation flow:
 * 1. Select deal type
 * 2. Select client
 * 3. Fill deal form
 * Auto-creates milestones on completion
 */

'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import { useDealTypes } from '@/features/deals/hooks/useDealTypes';
import { DealForm } from '@/features/deals/components/DealForm';
import type { DealType, DealFormData, CreateDealInput } from '@/features/deals/types';
import { useQuery } from '@tanstack/react-query';
import { clientApi } from '@/features/clients/api/clientApi';

function NewDealContent() {
  const router = useRouter();
  const { data: dealTypes } = useDealTypes();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDealType, setSelectedDealType] = useState<DealType | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Fetch clients for step 2
  const { data: clientsData } = useQuery({
    queryKey: ['clients', 'list'],
    queryFn: () => clientApi.listClients({ page: 1, limit: 100 }),
    enabled: step >= 2,
  });

  const createDealMutation = useMutation({
    mutationFn: async (input: CreateDealInput) => {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create deal' }));
        throw new Error(error.message || 'Failed to create deal');
      }

      return response.json();
    },
    onSuccess: (response) => {
      router.push(`/deals/${response.data.id}`);
    },
  });

  const handleDealTypeSelect = (dealType: DealType) => {
    setSelectedDealType(dealType);
    setStep(2);
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setStep(3);
  };

  const handleFormSubmit = async (formData: DealFormData) => {
    // Build deal_data from custom fields
    const deal_data: Record<string, unknown> = {};
    Object.keys(formData).forEach((key) => {
      if (
        key !== 'deal_type_id' &&
        key !== 'client_id' &&
        key !== 'name' &&
        key !== 'value' &&
        key !== 'commission_rate' &&
        key !== 'expected_close_date'
      ) {
        deal_data[key] = formData[key];
      }
    });

    const input: CreateDealInput = {
      deal_type_id: formData.deal_type_id,
      client_id: formData.client_id,
      deal_name: formData.name,
      deal_value: formData.value,
      commission_rate: formData.commission_rate,
      expected_close_date: formData.expected_close_date || undefined,
      deal_data,
    };

    await createDealMutation.mutateAsync(input);
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Create New Deal</h1>
        <p className="text-muted-foreground mt-1">
          Follow the steps to create a new deal and start tracking progress
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-2 ${
            step >= 1 ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            1
          </div>
          <span className="text-sm font-medium hidden sm:inline">Deal Type</span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div
          className={`flex items-center gap-2 ${
            step >= 2 ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            2
          </div>
          <span className="text-sm font-medium hidden sm:inline">Client</span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div
          className={`flex items-center gap-2 ${
            step >= 3 ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            3
          </div>
          <span className="text-sm font-medium hidden sm:inline">Details</span>
        </div>
      </div>

      {/* Step 1: Select Deal Type */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Select Deal Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dealTypes.map((dealType) => (
              <Card
                key={dealType.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleDealTypeSelect(dealType)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{dealType.type_name}</CardTitle>
                    </div>
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: dealType.color }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const fields = dealType.enabled_fields as { required?: string[]; optional?: string[] };
                      const allFields = [...(fields.required || []), ...(fields.optional || [])];
                      return (
                        <>
                          {allFields.slice(0, 3).map((field) => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              {field.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                          {allFields.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{allFields.length - 3} more
                            </Badge>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select Client */}
      {step === 2 && selectedDealType && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Select Client</h2>
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
              Back
            </Button>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Client</label>
                <Select value={selectedClientId} onValueChange={handleClientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsData?.data.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/clients?action=create')}
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create New Client
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Fill Deal Form */}
      {step === 3 && selectedDealType && selectedClientId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Deal Details</h2>
            <Button variant="outline" size="sm" onClick={() => setStep(2)}>
              Back
            </Button>
          </div>

          <DealForm
            dealType={selectedDealType}
            clientId={selectedClientId}
            onSubmit={handleFormSubmit}
            isSubmitting={createDealMutation.isPending}
            onCancel={() => router.push('/deals')}
          />

          {createDealMutation.isError && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <p className="text-sm text-destructive">
                  {createDealMutation.error?.message || 'Failed to create deal. Please try again.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function NewDealPage() {
  return (
    <Suspense fallback={<SectionLoader message="Loading deal creation form..." />}>
      <NewDealContent />
    </Suspense>
  );
}
