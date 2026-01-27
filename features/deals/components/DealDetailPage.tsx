/**
 * DealDetailPage Component
 *
 * Main deal detail page with 5 tabs:
 * - Overview: Stage progress, financials, key dates
 * - Details: Dynamic form based on deal type
 * - Checklist: Track key tasks and milestones
 * - Documents: Upload and list documents
 * - Activity: Activity feed
 */

'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import { useDealDetail } from '../hooks/useDealDetail';
import { OverviewTab } from './tabs/OverviewTab';
import { DetailsTab } from './tabs/DetailsTab';
import { ChecklistTab } from './tabs/ChecklistTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { ActivityTab } from './tabs/ActivityTab';

export interface DealDetailPageProps {
  dealId: string;
}

export function DealDetailPage({ dealId }: DealDetailPageProps) {
  const { data: deal } = useDealDetail(dealId);

  // Status badge color
  const getStatusBadge = () => {
    if (deal.status === 'closed_won') {
      return <Badge className="bg-green-500 text-white">Won</Badge>;
    }
    if (deal.status === 'closed_lost') {
      return <Badge variant="destructive">Lost</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold truncate">{deal.deal_name}</h1>
          <Badge
            variant="secondary"
            className="text-xs font-medium shrink-0"
            style={{
              backgroundColor: `${deal.deal_type?.color || '#3b82f6'}15`,
              color: deal.deal_type?.color || '#3b82f6',
              borderColor: `${deal.deal_type?.color || '#3b82f6'}30`,
            }}
          >
            {deal.deal_type.type_name}
          </Badge>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          <Link
            href={`/clients/${deal.client_id}`}
            className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
          >
            {deal.client.name}
          </Link>
        </p>
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
          <TabsTrigger value="checklist" className="flex-1 sm:flex-none">
            Checklist
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

        <TabsContent value="checklist" className="mt-4">
          <Suspense fallback={<SectionLoader message="Loading checklist..." />}>
            <ChecklistTab deal={deal} />
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
