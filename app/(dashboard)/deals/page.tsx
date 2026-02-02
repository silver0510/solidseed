'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DealPipelineBoard } from '@/features/deals/components/DealPipelineBoard';
import { DealListView } from '@/features/deals/components/DealListView';
import { LostDealsView } from '@/features/deals/components/LostDealsView';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { QuickDealAddSheet } from '@/features/deals/components/QuickDealAddSheet';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import { Home, DollarSign, TrendingUp, LayoutGrid, LayoutList, XCircle, Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useDealTypes } from '@/features/deals/hooks/useDealTypes';
import { usePipelineDeals } from '@/features/deals/hooks/usePipelineDeals';

type ViewMode = 'pipeline' | 'list' | 'lost';

// Format currency helper
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Wrapper component for metric cards and controls
function DealViewWrapper({
  dealTypeId,
  viewMode,
  onViewModeChange,
  children
}: {
  dealTypeId: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data } = usePipelineDeals({ dealTypeId });

  if (!data || !data.summary || !data.stages) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Pipeline</p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatCurrency(data.summary.total_pipeline_value)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Expected Commission</p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatCurrency(data.summary.expected_commission)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
                <p className="mt-1 text-2xl font-semibold">
                  {data.summary.active_deals}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <LayoutGrid className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle and Add Deal Button */}
      <div className="flex items-center justify-end gap-2">
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            variant={viewMode === 'pipeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('pipeline')}
            className="h-9 rounded-none px-3"
            aria-label="Pipeline view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="h-9 rounded-none px-3"
            aria-label="List view"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant={viewMode === 'lost' ? 'default' : 'outline'}
          size="sm"
          className="h-9"
          onClick={() => onViewModeChange('lost')}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Lost Deals
        </Button>
        <Button variant="outline" size="sm" className="h-9" onClick={() => router.push('/deals/new')}>
          <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
          Add Deal
        </Button>
      </div>

      {/* View Content */}
      {children}
    </div>
  );
}

function DealsContent() {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedDealTypeId, setSelectedDealTypeId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [userPreferences, setUserPreferences] = useState<{
    residential_sale_enabled: boolean;
    mortgage_loan_enabled: boolean;
  } | null>(null);

  // Fetch deal types from API
  const { data: dealTypes } = useDealTypes();

  // Fetch user preferences
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch('/api/user-preferences', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUserPreferences({
            residential_sale_enabled: data.data.residential_sale_enabled,
            mortgage_loan_enabled: data.data.mortgage_loan_enabled,
          });
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        // Default to showing both if fetch fails
        setUserPreferences({
          residential_sale_enabled: true,
          mortgage_loan_enabled: true,
        });
      }
    }

    fetchPreferences();
  }, []);

  // Map deal types by type_code for easy access
  const dealTypeMap = useMemo(() => {
    return {
      residential_sale: dealTypes.find(dt => dt.type_code === 'residential_sale'),
      mortgage: dealTypes.find(dt => dt.type_code === 'mortgage'),
    };
  }, [dealTypes]);

  // Filter enabled deal types based on user preferences
  const enabledDealTypes = useMemo(() => {
    if (!userPreferences) return [];

    const enabled = [];
    if (userPreferences.residential_sale_enabled && dealTypeMap.residential_sale) {
      enabled.push(dealTypeMap.residential_sale);
    }
    if (userPreferences.mortgage_loan_enabled && dealTypeMap.mortgage) {
      enabled.push(dealTypeMap.mortgage);
    }
    return enabled;
  }, [userPreferences, dealTypeMap]);

  // Set default deal type once data is loaded
  useEffect(() => {
    if (enabledDealTypes.length > 0 && !selectedDealTypeId) {
      setSelectedDealTypeId(enabledDealTypes[0].id);
    }
  }, [enabledDealTypes, selectedDealTypeId]);

  // If no deal types loaded yet or preferences not loaded, return null (let Suspense handle it)
  if (!userPreferences || enabledDealTypes.length === 0 || !selectedDealTypeId) {
    return null;
  }

  return (
    <div className="flex-1 space-y-4 p-4 lg:p-6">
      {/* Deal Type Tabs - Only show if more than one type is enabled */}
      <Tabs value={selectedDealTypeId} onValueChange={setSelectedDealTypeId} className="space-y-4">
        {enabledDealTypes.length > 1 && (
          <TabsList className={`grid w-full grid-cols-${enabledDealTypes.length}`}>
            {userPreferences.residential_sale_enabled && dealTypeMap.residential_sale && (
              <TabsTrigger value={dealTypeMap.residential_sale.id} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">{dealTypeMap.residential_sale.type_name}</span>
                <span className="sm:hidden">Residential</span>
              </TabsTrigger>
            )}
            {userPreferences.mortgage_loan_enabled && dealTypeMap.mortgage && (
              <TabsTrigger value={dealTypeMap.mortgage.id} className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">{dealTypeMap.mortgage.type_name}</span>
                <span className="sm:hidden">Mortgage</span>
              </TabsTrigger>
            )}
          </TabsList>
        )}

        {/* Residential Sale Content */}
        {userPreferences.residential_sale_enabled && dealTypeMap.residential_sale && (
          <TabsContent value={dealTypeMap.residential_sale.id} className="space-y-4 mt-0">
            <DealViewWrapper
              dealTypeId={dealTypeMap.residential_sale.id}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            >
              {viewMode === 'pipeline' ? (
                <Suspense fallback={<SectionLoader message="Loading pipeline..." />}>
                  <DealPipelineBoard dealTypeId={dealTypeMap.residential_sale.id} />
                </Suspense>
              ) : viewMode === 'list' ? (
                <Suspense fallback={<SectionLoader message="Loading deals..." />}>
                  <DealListView dealTypeId={dealTypeMap.residential_sale.id} />
                </Suspense>
              ) : (
                <Suspense fallback={<SectionLoader message="Loading lost deals..." />}>
                  <LostDealsView dealTypeId={dealTypeMap.residential_sale.id} />
                </Suspense>
              )}
            </DealViewWrapper>
          </TabsContent>
        )}

        {/* Mortgage Content */}
        {userPreferences.mortgage_loan_enabled && dealTypeMap.mortgage && (
          <TabsContent value={dealTypeMap.mortgage.id} className="space-y-4 mt-0">
            <DealViewWrapper
              dealTypeId={dealTypeMap.mortgage.id}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            >
              {viewMode === 'pipeline' ? (
                <Suspense fallback={<SectionLoader message="Loading pipeline..." />}>
                  <DealPipelineBoard dealTypeId={dealTypeMap.mortgage.id} />
                </Suspense>
              ) : viewMode === 'list' ? (
                <Suspense fallback={<SectionLoader message="Loading deals..." />}>
                  <DealListView dealTypeId={dealTypeMap.mortgage.id} />
                </Suspense>
              ) : (
                <Suspense fallback={<SectionLoader message="Loading lost deals..." />}>
                  <LostDealsView dealTypeId={dealTypeMap.mortgage.id} />
                </Suspense>
              )}
            </DealViewWrapper>
          </TabsContent>
        )}
      </Tabs>

      {/* Floating Action Button - Mobile Only */}
      <FloatingActionButton onClick={() => setQuickAddOpen(true)} />

      {/* Quick Add Sheet */}
      <Suspense fallback={null}>
        <QuickDealAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
      </Suspense>
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="flex-1 p-4 lg:p-6"><SectionLoader message="Loading deals..." /></div>}>
      <DealsContent />
    </Suspense>
  );
}
