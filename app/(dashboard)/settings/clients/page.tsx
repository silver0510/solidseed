'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusManager } from '@/features/settings/components/StatusManager';
import { TagManager } from '@/features/settings/components/TagManager';

export default function ClientSettingsPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Client Settings</h1>
        <p className="text-muted-foreground">
          Customize statuses and tags to organize your clients
        </p>
      </div>

      {/* Status Management */}
      <Card>
        <CardHeader>
          <CardTitle>Statuses</CardTitle>
          <CardDescription>
            Define the stages of your client workflow. Drag to reorder.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <StatusManager />
        </CardContent>
      </Card>

      {/* Tag Management */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>
            Create tags to categorize and filter your clients.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <TagManager />
        </CardContent>
      </Card>
    </div>
  );
}
