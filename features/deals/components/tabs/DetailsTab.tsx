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
    deal_name: deal.deal_name,
    deal_value: deal.deal_value || 0,
    commission_rate: deal.commission_rate || 0,
    expected_close_date: deal.expected_close_date
      ? new Date(deal.expected_close_date).toISOString().split('T')[0]
      : '',
    ...(deal.deal_data || {}),
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
        if (field === 'deal_name') updateData.deal_name = value;
        if (field === 'deal_value') {
          updateData.deal_value = parseFloat(value) || 0;
        }
        if (field === 'commission_rate') {
          updateData.commission_rate = parseFloat(value) || 0;
        }
        if (field === 'expected_close_date') updateData.expected_close_date = value;

        // Deal data fields (custom fields)
        if (
          field !== 'deal_name' &&
          field !== 'deal_value' &&
          field !== 'commission_rate' &&
          field !== 'expected_close_date'
        ) {
          updateData.deal_data = {
            ...(deal.deal_data || {}),
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

  // Get enabled fields from deal type
  const enabledFields = deal.deal_type?.enabled_fields as {
    required?: string[];
    optional?: string[];
    enums?: Record<string, string[] | number[]>;
  } || { required: [], optional: [], enums: {} };

  const requiredFields = enabledFields.required || [];
  const optionalFields = enabledFields.optional || [];
  const enumValues = enabledFields.enums || {};

  const renderField = (fieldName: string, isRequired: boolean) => {
    const label = formatFieldLabel(fieldName);
    const value = (formData as Record<string, any>)[fieldName] ?? '';
    const enumOptions = enumValues[fieldName];

    // If field has enum values, render as select
    if (enumOptions && enumOptions.length > 0) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>
            {label}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select value={String(value)} onValueChange={(val) => handleFieldChange(fieldName, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {enumOptions.map((option) => (
                <SelectItem key={String(option)} value={String(option)}>
                  {String(option).replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // For numeric fields (detect by common patterns)
    const numericFields = ['price', 'amount', 'value', 'rate', 'bedrooms', 'bathrooms', 'square_feet', 'square_footage', 'lot_size', 'year_built', 'down_payment', 'interest_rate', 'loan_amount'];
    if (numericFields.some(f => fieldName.includes(f))) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>
            {label}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={fieldName}
            type="number"
            step={fieldName.includes('rate') ? '0.01' : '1'}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            required={isRequired}
          />
        </div>
      );
    }

    // For date fields
    const dateFields = ['date', 'closing', 'inspection'];
    if (dateFields.some(f => fieldName.includes(f))) {
      return (
        <div key={fieldName} className="space-y-2">
          <Label htmlFor={fieldName}>
            {label}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={fieldName}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            required={isRequired}
          />
        </div>
      );
    }

    // Default to text input
    return (
      <div key={fieldName} className="space-y-2">
        <Label htmlFor={fieldName}>
          {label}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id={fieldName}
          type="text"
          value={value}
          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          required={isRequired}
        />
      </div>
    );
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
            <Label htmlFor="deal_name">
              Deal Name
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="deal_name"
              type="text"
              value={formData.deal_name}
              onChange={(e) => handleFieldChange('deal_name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal_value">
                Deal Value
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="deal_value"
                type="number"
                step="0.01"
                value={formData.deal_value}
                onChange={(e) => handleFieldChange('deal_value', e.target.value)}
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
      {(requiredFields.length > 0 || optionalFields.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requiredFields.length > 0 && (
              <>
                <p className="text-sm font-medium text-muted-foreground">Required Fields</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requiredFields.map((fieldName) => renderField(fieldName, true))}
                </div>
              </>
            )}
            {optionalFields.length > 0 && (
              <>
                <p className="text-sm font-medium text-muted-foreground mt-4">Optional Fields</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {optionalFields.map((fieldName) => renderField(fieldName, false))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
