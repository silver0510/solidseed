'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChecklistTemplateManager } from '@/features/settings/components/ChecklistTemplateManager';

export default function DealSettingsPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Deal Settings</h1>
        <p className="text-muted-foreground">
          Customize default checklists for each deal type
        </p>
      </div>

      {/* Checklist Template Management */}
      <Card>
        <CardHeader>
          <CardTitle>Default Checklists</CardTitle>
          <CardDescription>
            Configure the default checklist items that will be auto-generated when you create a new deal.
            Each deal type can have its own checklist template.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <ChecklistTemplateManager />
        </CardContent>
      </Card>
    </div>
  );
}
