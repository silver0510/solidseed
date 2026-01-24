/**
 * Deal Detail Page Route
 *
 * Server component that renders the DealDetailPage with initial data streaming.
 * Displays comprehensive deal information across 5 tabs.
 */

import { Suspense } from 'react';
import { DealDetailPage } from '@/features/deals/components/DealDetailPage';
import { SectionLoader } from '@/components/ui/SuspenseLoader';

export default function DealPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-4 lg:p-6">
      <Suspense fallback={<SectionLoader message="Loading deal details..." />}>
        <DealDetailPage dealId={params.id} />
      </Suspense>
    </div>
  );
}
