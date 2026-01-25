'use client';

import { Suspense, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DealPipelineBoard } from '@/features/deals/components/DealPipelineBoard';
import { DealListView } from '@/features/deals/components/DealListView';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { QuickDealAddSheet } from '@/features/deals/components/QuickDealAddSheet';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import { LayoutGrid, List } from 'lucide-react';

export default function DealsPage() {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="flex-1 space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Pipeline</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Suspense fallback={<SectionLoader message="Loading pipeline..." />}>
            <DealPipelineBoard />
          </Suspense>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Suspense fallback={<SectionLoader message="Loading deals..." />}>
            <DealListView />
          </Suspense>
        </TabsContent>
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
