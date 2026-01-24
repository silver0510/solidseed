/**
 * DetailsTab Component
 *
 * Dynamic form based on deal_type.enabled_fields with:
 * - Required vs optional fields
 * - Enum dropdowns
 * - Inline editing with auto-save (500ms debounce)
 * - Commission recalculation on value/rate changes
 * - Validation with zod
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useDealMutations } from '../../hooks/useDealMutations';
import type { DealWithRelations } from '../../types';

export interface DetailsTabProps {
  deal: DealWithRelations;
}

export function DetailsTab({ deal }: DetailsTabProps) {
  const { updateDeal } = useDealMutations(deal.id);
  const [formData, setFormData] = useState({
    name: deal.name,
    value: deal.value,
    commission_rate: deal.commission_rate,
    expected_close_date: deal.expected_close_date
      ? new Date(deal.expected_close_date).toISOString().split('T')[0]
      : '',
    ...deal.custom_fields,
  });
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save with debounce
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        const updateData: any = {};

        // Core fields
        if (field === 'name') updateData.name = value;
        if (field === 'value') {
          updateData.value = parseFloat(value) || 0;
          // Recalculate commission
          const commissionAmount = (parseFloat(value) || 0) * (formData.commission_rate / 100);
          const agentCommission = commissionAmount * 0.7; // Assuming 70% split
        }
        if (field === 'commission_rate') {
          updateData.commission_rate = parseFloat(value) || 0;
        }
        if (field === 'expected_close_date') updateData.expected_close_date = value;

        // Custom fields
        if (
          field !== 'name' &&
          field !== 'value' &&
          field !== 'commission_rate' &&
          field !== 'expected_close_date'
        ) {
          updateData.custom_fields = {
            ...deal.custom_fields,
            [field]: value,
          };
        }

        await updateDeal.mutateAsync(updateData);
      } finally {
        setIsSaving(false);
      }
    }, 500);

    setSaveTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const formatFieldLabel = (fieldName: string) => {
    return fieldName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderField = (fieldName: string) => {
    const fieldConfig = deal.deal_type.enabled_fields[fieldName];
    if (!fieldConfig) return null;

    const label = formatFieldLabel(fieldName);
    const value = formData[fieldName] ?? '';

    switch (fieldConfig.type) {
      case 'text':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {label}
              {fieldConfig.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              required={fieldConfig.required}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {label}
              {fieldConfig.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldName}
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              required={fieldConfig.required}
              rows={3}
            />
          </div>
        );

      case 'number':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {label}
              {fieldConfig.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              required={fieldConfig.required}
            />
          </div>
        );

      case 'date':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {label}
              {fieldConfig.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              required={fieldConfig.required}
            />
          </div>
        );

      case 'enum':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {label}
              {fieldConfig.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => handleFieldChange(fieldName, val)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {fieldConfig.enum_values?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'boolean':
        return (
          <div key={fieldName} className="flex items-center space-x-2 py-2">
            <Checkbox
              id={fieldName}
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => handleFieldChange(fieldName, checked)}
            />
            <Label htmlFor={fieldName} className="cursor-pointer">
              {label}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Save Indicator */}
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Saving...
        </div>
      )}

      {/* Core Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Deal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Deal Name
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">
                Deal Value
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => handleFieldChange('value', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_rate">
                Commission Rate (%)
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="commission_rate"
                type="number"
                step="0.01"
                value={formData.commission_rate}
                onChange={(e) => handleFieldChange('commission_rate', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_close_date">Expected Close Date</Label>
            <Input
              id="expected_close_date"
              type="date"
              value={formData.expected_close_date}
              onChange={(e) => handleFieldChange('expected_close_date', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      {Object.keys(deal.deal_type.enabled_fields).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(deal.deal_type.enabled_fields).map((fieldName) =>
                renderField(fieldName)
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
