'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, Plus, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import type {
  GetDealSettingsResponse,
  UpdateChecklistTemplateInput,
  ChecklistTemplateItem,
} from '@/lib/types/deal-settings';

// =====================================================
// API FUNCTIONS
// =====================================================

async function fetchDealSettings(): Promise<GetDealSettingsResponse> {
  const response = await fetch('/api/settings/deals');
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch settings' }));
    throw new Error(error.error || 'Failed to fetch settings');
  }
  return response.json();
}

async function updateChecklistTemplate(input: UpdateChecklistTemplateInput): Promise<void> {
  const response = await fetch('/api/settings/deals', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update template' }));
    throw new Error(error.error || 'Failed to update template');
  }
}

// =====================================================
// COMPONENT
// =====================================================

export function ChecklistTemplateManager() {
  const queryClient = useQueryClient();
  const [editingDealTypeId, setEditingDealTypeId] = React.useState<string | null>(null);
  const [templates, setTemplates] = React.useState<Record<string, ChecklistTemplateItem[]>>({});

  // Fetch deal settings
  const { data, isLoading, error } = useQuery({
    queryKey: ['deal-settings'],
    queryFn: fetchDealSettings,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateChecklistTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-settings'] });
      toast.success('Checklist template updated');
      setEditingDealTypeId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update template');
    },
  });

  // Initialize templates from fetched data
  React.useEffect(() => {
    if (data) {
      const initialTemplates: Record<string, ChecklistTemplateItem[]> = {};
      data.deal_types.forEach((dealType) => {
        const existingSetting = data.settings.find(
          (s) => s.deal_type_id === dealType.id
        );
        initialTemplates[dealType.id] = existingSetting?.checklist_template || [];
      });
      setTemplates(initialTemplates);
    }
  }, [data]);

  // Add new checklist item
  const handleAddItem = (dealTypeId: string) => {
    setTemplates((prev) => ({
      ...prev,
      [dealTypeId]: [
        ...(prev[dealTypeId] || []),
        { name: '' },
      ],
    }));
  };

  // Update checklist item
  const handleUpdateItem = (
    dealTypeId: string,
    index: number,
    value: string
  ) => {
    setTemplates((prev) => {
      const items = [...(prev[dealTypeId] || [])];
      items[index] = { name: value };
      return { ...prev, [dealTypeId]: items };
    });
  };

  // Remove checklist item
  const handleRemoveItem = (dealTypeId: string, index: number) => {
    setTemplates((prev) => ({
      ...prev,
      [dealTypeId]: (prev[dealTypeId] || []).filter((_, i) => i !== index),
    }));
  };

  // Save template
  const handleSaveTemplate = (dealTypeId: string) => {
    const template = templates[dealTypeId] || [];

    // Validate: all items must have a name
    const hasEmptyNames = template.some((item) => !item.name.trim());
    if (hasEmptyNames) {
      toast.error('All checklist items must have a name');
      return;
    }

    updateMutation.mutate({
      deal_type_id: dealTypeId,
      checklist_template: template,
    });
  };

  // Cancel editing
  const handleCancelEdit = (dealTypeId: string) => {
    // Reset to original data
    if (data) {
      const existingSetting = data.settings.find(
        (s) => s.deal_type_id === dealTypeId
      );
      setTemplates((prev) => ({
        ...prev,
        [dealTypeId]: existingSetting?.checklist_template || [],
      }));
    }
    setEditingDealTypeId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading settings: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!data || data.deal_types.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No deal types found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure default checklist items for each deal type. These items will be automatically
        added to new deals of that type.
      </p>

      <Accordion type="single" collapsible className="w-full">
        {data.deal_types.map((dealType) => {
          const isEditing = editingDealTypeId === dealType.id;
          const template = templates[dealType.id] || [];
          const itemCount = template.length;

          return (
            <AccordionItem key={dealType.id} value={dealType.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{dealType.type_name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  {template.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No checklist items. Click "Add Item" to create your first item.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {template.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 rounded-md border border-border/50">
                          <div className="flex-1">
                            {isEditing ? (
                              <Input
                                value={item.name}
                                onChange={(e) =>
                                  handleUpdateItem(dealType.id, index, e.target.value)
                                }
                                placeholder="e.g., Schedule property inspection"
                                className="bg-background"
                              />
                            ) : (
                              <p className="text-sm font-medium px-3 py-2">{item.name}</p>
                            )}
                          </div>
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(dealType.id, index)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddItem(dealType.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                        <div className="flex-1" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelEdit(dealType.id)}
                          disabled={updateMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveTemplate(dealType.id)}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDealTypeId(dealType.id)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
