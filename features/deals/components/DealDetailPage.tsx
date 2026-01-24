/**
 * DealDetailPage Component
 *
 * Main deal detail page with 5 tabs:
 * - Overview: Stage progress, financials, key dates
 * - Details: Dynamic form based on deal type
 * - Milestones: Timeline with completion toggles
 * - Documents: Upload and list documents
 * - Activity: Activity feed
 */

'use client';

import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import { useDealDetail } from '../hooks/useDealDetail';
import { OverviewTab } from './tabs/OverviewTab';
import { DetailsTab } from './tabs/DetailsTab';
import { MilestonesTab } from './tabs/MilestonesTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { ActivityTab } from './tabs/ActivityTab';

export interface DealDetailPageProps {
  dealId: string;
}

export function DealDetailPage({ dealId }: DealDetailPageProps) {
  const { data: deal } = useDealDetail(dealId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold truncate">{deal.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {deal.client.name} • {deal.deal_type.name}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">
            Overview
          </TabsTrigger>
          <TabsTrigger value="details" className="flex-1 sm:flex-none">
            Details
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex-1 sm:flex-none">
            Milestones
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex-1 sm:flex-none">
            Documents
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 sm:flex-none">
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Suspense fallback={<SectionLoader message="Loading overview..." />}>
            <OverviewTab deal={deal} />
          </Suspense>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Suspense fallback={<SectionLoader message="Loading details..." />}>
            <DetailsTab deal={deal} />
          </Suspense>
        </TabsContent>

        <TabsContent value="milestones" className="mt-4">
          <Suspense fallback={<SectionLoader message="Loading milestones..." />}>
            <MilestonesTab deal={deal} />
          </Suspense>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Suspense fallback={<SectionLoader message="Loading documents..." />}>
            <DocumentsTab deal={deal} />
          </Suspense>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Suspense fallback={<SectionLoader message="Loading activity..." />}>
            <ActivityTab deal={deal} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
