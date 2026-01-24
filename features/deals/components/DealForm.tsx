/**
 * DealForm Component
 *
 * Dynamic form for creating/editing deals based on deal type configuration.
 * Handles all field types: text, number, date, enum, boolean, textarea.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import type { DealType, DealFormData } from '../types';

export interface DealFormProps {
  dealType: DealType;
  clientId?: string;
  initialData?: Partial<DealFormData>;
  onSubmit: (data: DealFormData) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function DealForm({
  dealType,
  clientId: initialClientId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: DealFormProps) {
  const [formData, setFormData] = useState<DealFormData>({
    deal_type_id: dealType.id,
    client_id: initialClientId || initialData?.client_id || '',
    name: initialData?.name || '',
    value: initialData?.value || 0,
    commission_rate: initialData?.commission_rate || 3,
    expected_close_date: initialData?.expected_close_date || '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Deal name is required';
    if (!formData.client_id) newErrors.client_id = 'Client is required';
    if (!formData.value || formData.value <= 0) newErrors.value = 'Deal value must be greater than 0';
    if (!formData.commission_rate || formData.commission_rate <= 0)
      newErrors.commission_rate = 'Commission rate must be greater than 0';

    // Validate required custom fields
    Object.entries(dealType.enabled_fields).forEach(([fieldName, config]) => {
      if (config.required && !formData[fieldName]) {
        newErrors[fieldName] = `${formatFieldLabel(fieldName)} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit(formData);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const formatFieldLabel = (fieldName: string) => {
    return fieldName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderCustomField = (fieldName: string) => {
    const fieldConfig = dealType.enabled_fields[fieldName];
    if (!fieldConfig) return null;

    const label = formatFieldLabel(fieldName);
    const value = formData[fieldName] ?? '';
    const error = errors[fieldName];

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
            {error && <p className="text-sm text-destructive">{error}</p>}
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
            {error && <p className="text-sm text-destructive">{error}</p>}
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
            {error && <p className="text-sm text-destructive">{error}</p>}
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
            {error && <p className="text-sm text-destructive">{error}</p>}
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
            {error && <p className="text-sm text-destructive">{error}</p>}
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
            {error && <p className="text-sm text-destructive ml-6">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="e.g., 123 Main St - Smith Listing"
              required
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">
                Deal Value ($)
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => handleFieldChange('value', parseFloat(e.target.value) || 0)}
                placeholder="500000"
                required
              />
              {errors.value && <p className="text-sm text-destructive">{errors.value}</p>}
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
                onChange={(e) =>
                  handleFieldChange('commission_rate', parseFloat(e.target.value) || 0)
                }
                placeholder="3.0"
                required
              />
              {errors.commission_rate && (
                <p className="text-sm text-destructive">{errors.commission_rate}</p>
              )}
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
      {Object.keys(dealType.enabled_fields).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(dealType.enabled_fields).map((fieldName) =>
                renderCustomField(fieldName)
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Deal...' : 'Create Deal'}
        </Button>
      </div>
    </form>
  );
}
