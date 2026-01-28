'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChecklistTemplateManager } from '@/features/settings/components/ChecklistTemplateManager';
import { DealTypePreferences } from '@/features/settings/components/DealTypePreferences';

export default function DealSettingsPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Deal Settings</h1>
        <p className="text-muted-foreground">
          Manage your deal types and default checklist templates
        </p>
      </div>

      {/* Deal Type Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Deal Type Preferences</CardTitle>
          <CardDescription>
            Choose which types of deals you work with. Your dashboard and pipeline will only show the deal types you enable.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <DealTypePreferences />
        </CardContent>
      </Card>

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
