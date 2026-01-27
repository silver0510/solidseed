/**
 * DetailsTab Component
 *
 * Dynamic form based on deal_type.enabled_fields with:
 * - View mode by default, Edit mode on button click
 * - Required vs optional fields
 * - Enum dropdowns with proper {value, display} handling
 * - Save/Cancel buttons in edit mode
 * - Comma formatting for currency/number fields
 * - Calendar component for date fields
 * - Mortgage-specific fields: down_payment with $/% toggle, auto-calculated loan_amount
 */

'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Pencil, X, Check } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils/cn';
import { useDealMutations } from '../../hooks/useDealMutations';
import type { DealWithRelations } from '../../types';

// Enum value can be either simple string/number or object with value/display
type EnumValue = string | number | { value: string | number; display: string };

// Structure of enabled_fields from the database
interface EnabledFieldsConfig {
  required?: string[];
  optional?: string[];
  enums?: Record<string, EnumValue[]>;
}

export interface DetailsTabProps {
  deal: DealWithRelations;
}

export function DetailsTab({ deal }: DetailsTabProps) {
  const { updateDeal } = useDealMutations(deal.id);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [downPaymentMode, setDownPaymentMode] = useState<'dollar' | 'percent'>('dollar');

  // Check if this is a mortgage deal
  const isMortgage = deal.deal_type?.type_code === 'mortgage';

  // Initialize form data from deal
  const getInitialFormData = () => ({
    deal_name: deal.deal_name,
    deal_value: deal.deal_value || undefined,
    commission_rate: deal.commission_rate || undefined,
    commission_split_percent: deal.commission_split_percent || undefined,
    expected_close_date: deal.expected_close_date
      ? new Date(deal.expected_close_date).toISOString().split('T')[0]
      : '',
    ...(deal.deal_data || {}),
  });

  const [formData, setFormData] = useState<Record<string, any>>(getInitialFormData);

  // Reset form when deal changes
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [deal]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle multiple field changes at once (for auto-calculations)
  const handleMultiFieldChange = (updates: Record<string, any>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData: any = {
        deal_name: formData.deal_name,
        deal_value: formData.deal_value,
        commission_rate: formData.commission_rate,
        commission_split_percent: formData.commission_split_percent,
        expected_close_date: formData.expected_close_date || null,
      };

      // Collect deal_data fields
      const dealDataFields: Record<string, any> = {};
      const coreFields = ['deal_name', 'deal_value', 'commission_rate', 'commission_split_percent', 'expected_close_date'];

      Object.entries(formData).forEach(([key, value]) => {
        if (!coreFields.includes(key)) {
          dealDataFields[key] = value;
        }
      });

      if (Object.keys(dealDataFields).length > 0) {
        updateData.deal_data = dealDataFields;
      }

      await updateDeal.mutateAsync(updateData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save deal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(getInitialFormData());
    setIsEditing(false);
  };

  const formatFieldLabel = (fieldName: string) => {
    return fieldName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format number with commas
  const formatNumberWithCommas = (value: number | string | undefined): string => {
    if (value === undefined || value === null || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US');
  };

  // Format currency
  const formatCurrency = (value: number | string | undefined): string => {
    if (value === undefined || value === null || value === '') return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';
    return `$${num.toLocaleString('en-US')}`;
  };

  // Get enabled fields config from deal type
  const enabledFieldsConfig = (deal.deal_type?.enabled_fields || {}) as EnabledFieldsConfig;
  let requiredFields = enabledFieldsConfig.required || [];
  let optionalFields = enabledFieldsConfig.optional || [];
  const enumsConfig = enabledFieldsConfig.enums || {};

  // For mortgage deals, customize field order and requirements
  if (isMortgage) {
    // Remove down_payment_percent from optional fields
    optionalFields = optionalFields.filter(f => f !== 'down_payment_percent');

    // Move purchase_price and down_payment from optional to required
    optionalFields = optionalFields.filter(f => f !== 'purchase_price' && f !== 'down_payment');

    // Move loan_amount from optional to required
    optionalFields = optionalFields.filter(f => f !== 'loan_amount');

    // Match creation page order: loan_type, loan_purpose, purchase_price, down_payment, loan_amount
    const mortgageFieldOrder = ['loan_type', 'loan_purpose', 'purchase_price', 'down_payment', 'loan_amount'];
    const mortgageRequiredFields = ['loan_type', 'loan_purpose', 'purchase_price', 'down_payment', 'loan_amount'];

    // Separate mortgage-specific fields from other fields
    const otherRequired = requiredFields.filter(f => !mortgageFieldOrder.includes(f));
    const otherOptional = optionalFields.filter(f => !mortgageFieldOrder.includes(f));

    // Rebuild required and optional based on mortgage configuration
    requiredFields = [
      ...mortgageFieldOrder.filter(f => mortgageRequiredFields.includes(f)),
      ...otherRequired,
    ];

    optionalFields = [
      ...mortgageFieldOrder.filter(f => !mortgageRequiredFields.includes(f)),
      ...otherOptional,
    ];
  }

  // Get display value for enum fields
  const getEnumDisplayValue = (fieldName: string, value: any): string => {
    if (!value) return '-';
    const enumOptions = enumsConfig[fieldName] || [];
    const option = enumOptions.find((opt) => {
      const optValue = typeof opt === 'object' && opt !== null && 'value' in opt
        ? String(opt.value)
        : String(opt);
      return optValue === String(value);
    });
    if (option && typeof option === 'object' && 'display' in option) {
      return option.display;
    }
    return String(value).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Determine field type based on field name patterns and enum config
  const getFieldType = (fieldName: string): 'text' | 'number' | 'date' | 'enum' | 'boolean' | 'textarea' => {
    if (enumsConfig[fieldName]) {
      return 'enum';
    }
    const numericPatterns = ['price', 'amount', 'value', 'rate', 'bedrooms', 'bathrooms',
      'square_feet', 'square_footage', 'lot_size', 'year_built', 'down_payment',
      'interest_rate', 'loan_amount', 'credit_score', 'debt_to_income', 'closing_costs'];
    if (numericPatterns.some(p => fieldName.includes(p))) {
      return 'number';
    }
    const datePatterns = ['date', 'closing', 'inspection'];
    if (datePatterns.some(p => fieldName.includes(p))) {
      return 'date';
    }
    const textareaPatterns = ['notes', 'description', 'comments'];
    if (textareaPatterns.some(p => fieldName.includes(p))) {
      return 'textarea';
    }
    return 'text';
  };

  // Render view mode value
  const renderViewValue = (fieldName: string, value: any) => {
    const fieldType = getFieldType(fieldName);

    // Special handling for down_payment in mortgage - show amount and percentage
    if (fieldName === 'down_payment' && isMortgage && value) {
      const purchasePrice = formData.purchase_price;
      if (purchasePrice && purchasePrice > 0) {
        const percentage = ((value / purchasePrice) * 100).toFixed(1);
        return `${formatCurrency(value)} (${percentage}%)`;
      }
      return formatCurrency(value);
    }

    // Special handling for other mortgage fields in view mode - show as currency
    if ((fieldName === 'loan_amount' || fieldName === 'purchase_price') && isMortgage) {
      return value ? formatCurrency(value) : '-';
    }

    switch (fieldType) {
      case 'enum':
        return getEnumDisplayValue(fieldName, value);
      case 'number':
        return value ? formatNumberWithCommas(value) : '-';
      case 'date':
        return value ? format(new Date(value), 'PPP') : '-';
      case 'boolean':
        return value === true || value === 'true' ? 'Yes' : 'No';
      default:
        return value || '-';
    }
  };

  // Mortgage-specific handlers
  const handleDownPaymentChange = (rawValue: string, isPercent: boolean) => {
    const cleanValue = rawValue.replace(/,/g, '');
    const purchasePrice = formData.purchase_price;

    if (cleanValue === '') {
      const updates: Record<string, any> = { down_payment: undefined };
      if (purchasePrice) {
        updates.loan_amount = undefined;
      }
      handleMultiFieldChange(updates);
      return;
    }

    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return;

    let downPaymentDollars: number;
    if (isPercent && purchasePrice) {
      downPaymentDollars = (numValue / 100) * purchasePrice;
    } else {
      downPaymentDollars = numValue;
    }

    const updates: Record<string, any> = { down_payment: downPaymentDollars };

    // Auto-calculate loan_amount if purchase_price is set
    if (isMortgage && purchasePrice && purchasePrice > 0) {
      updates.loan_amount = purchasePrice - downPaymentDollars;
    }

    handleMultiFieldChange(updates);
  };

  const handleLoanAmountChange = (rawValue: string) => {
    const cleanValue = rawValue.replace(/,/g, '');
    const purchasePrice = formData.purchase_price;

    if (cleanValue === '') {
      const updates: Record<string, any> = { loan_amount: undefined };
      if (purchasePrice) {
        updates.down_payment = undefined;
      }
      handleMultiFieldChange(updates);
      return;
    }

    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return;

    const updates: Record<string, any> = { loan_amount: numValue };

    // Auto-calculate down_payment if purchase_price is set
    if (isMortgage && purchasePrice && purchasePrice > 0) {
      updates.down_payment = purchasePrice - numValue;
    }

    handleMultiFieldChange(updates);
  };

  const handlePurchasePriceChange = (rawValue: string) => {
    const cleanValue = rawValue.replace(/,/g, '');

    if (cleanValue === '') {
      handleFieldChange('purchase_price', undefined);
      return;
    }

    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return;

    const downPayment = formData.down_payment;
    const loanAmount = formData.loan_amount;

    const updates: Record<string, any> = { purchase_price: numValue };

    // Auto-calculate loan_amount if down_payment is already set
    if (isMortgage && downPayment !== undefined && downPayment > 0) {
      updates.loan_amount = numValue - downPayment;
    }
    // Or auto-calculate down_payment if loan_amount is already set
    else if (isMortgage && loanAmount !== undefined && loanAmount > 0) {
      updates.down_payment = numValue - loanAmount;
    }

    handleMultiFieldChange(updates);
  };

  // Render edit mode field
  const renderEditField = (fieldName: string) => {
    const label = formatFieldLabel(fieldName);
    const value = formData[fieldName];
    const fieldType = getFieldType(fieldName);

    // Special handling for mortgage down_payment field with $/% toggle
    if (fieldName === 'down_payment' && isMortgage) {
      const purchasePrice = formData.purchase_price;

      // Calculate display value based on mode
      let displayValue = '';
      if (value !== undefined && value !== null) {
        if (downPaymentMode === 'dollar') {
          displayValue = parseFloat(String(value)).toLocaleString('en-US');
        } else if (purchasePrice && purchasePrice > 0) {
          const percentage = (parseFloat(String(value)) / purchasePrice) * 100;
          displayValue = percentage.toFixed(1);
        }
      }

      return (
        <div className="flex gap-2 items-center">
          <Input
            id={fieldName}
            type="text"
            value={displayValue}
            onChange={(e) => handleDownPaymentChange(e.target.value, downPaymentMode === 'percent')}
            placeholder={downPaymentMode === 'dollar' ? '0' : '0.0'}
            className="flex-1"
          />
          <div className="flex border border-input rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setDownPaymentMode('dollar')}
              className={cn(
                'px-4 h-10 text-sm font-medium transition-colors border-r',
                downPaymentMode === 'dollar'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent'
              )}
            >
              $
            </button>
            <button
              type="button"
              onClick={() => setDownPaymentMode('percent')}
              className={cn(
                'px-4 h-10 text-sm font-medium transition-colors',
                downPaymentMode === 'percent'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent'
              )}
            >
              %
            </button>
          </div>
        </div>
      );
    }

    // Special handling for mortgage loan_amount field
    if (fieldName === 'loan_amount' && isMortgage) {
      const purchasePrice = formData.purchase_price;
      const downPayment = formData.down_payment;

      return (
        <div className="space-y-1">
          <Input
            id={fieldName}
            type="text"
            value={value ? parseFloat(String(value)).toLocaleString('en-US') : ''}
            onChange={(e) => handleLoanAmountChange(e.target.value)}
            placeholder="0"
          />
          {purchasePrice && downPayment !== undefined && (
            <p className="text-xs text-muted-foreground">
              = ${purchasePrice.toLocaleString('en-US')} - ${downPayment.toLocaleString('en-US')}
            </p>
          )}
        </div>
      );
    }

    // Special handling for purchase_price field (triggers auto-calculation)
    if (fieldName === 'purchase_price' && isMortgage) {
      return (
        <Input
          id={fieldName}
          type="text"
          value={value ? parseFloat(String(value)).toLocaleString('en-US') : ''}
          onChange={(e) => handlePurchasePriceChange(e.target.value)}
          placeholder="0"
        />
      );
    }

    switch (fieldType) {
      case 'text':
        return (
          <Input
            id={fieldName}
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            rows={3}
            className="resize-none"
          />
        );

      case 'number':
        return (
          <Input
            id={fieldName}
            type="text"
            value={formatNumberWithCommas(value)}
            onChange={(e) => {
              const rawValue = e.target.value.replace(/,/g, '');
              const numValue = rawValue === '' ? undefined : parseFloat(rawValue);
              if (rawValue === '' || !isNaN(numValue!)) {
                handleFieldChange(fieldName, numValue);
              }
            }}
            placeholder="0"
          />
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm h-10',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  !value && 'text-muted-foreground'
                )}
              >
                <span>{value ? format(new Date(value), 'PPP') : 'Pick a date'}</span>
                <CalendarIcon className="h-4 w-4 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => {
                  handleFieldChange(fieldName, date ? format(date, 'yyyy-MM-dd') : '');
                }}
                captionLayout="dropdown"
                startMonth={new Date(2020, 0)}
                endMonth={new Date(2100, 11)}
              />
            </PopoverContent>
          </Popover>
        );

      case 'enum':
        const enumOptions = enumsConfig[fieldName] || [];
        return (
          <Select
            value={String(value || '')}
            onValueChange={(val) => handleFieldChange(fieldName, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {enumOptions.map((option) => {
                const optionValue = typeof option === 'object' && option !== null && 'value' in option
                  ? String(option.value)
                  : String(option);
                const optionDisplay = typeof option === 'object' && option !== null && 'display' in option
                  ? option.display
                  : String(option).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return (
                  <SelectItem key={optionValue} value={optionValue}>
                    {optionDisplay}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldName}
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => handleFieldChange(fieldName, checked)}
            />
            <Label htmlFor={fieldName} className="cursor-pointer font-normal">
              {label}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  // Render a field row (view or edit mode)
  const renderFieldRow = (fieldName: string, isRequired: boolean) => {
    const label = formatFieldLabel(fieldName);
    const value = formData[fieldName];

    return (
      <div key={fieldName} className="space-y-2">
        <Label htmlFor={fieldName} className="text-muted-foreground text-sm">
          {label}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
        {isEditing ? (
          renderEditField(fieldName)
        ) : (
          <p className="text-sm font-medium">{renderViewValue(fieldName, value)}</p>
        )}
      </div>
    );
  };

  const allFields = [...requiredFields, ...optionalFields];

  return (
    <div className="space-y-6">
      {/* Core Fields */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Deal Information</CardTitle>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Deal Name */}
          <div className="space-y-2">
            <Label htmlFor="deal_name" className="text-muted-foreground text-sm">
              Deal Name
              <span className="text-destructive ml-1">*</span>
            </Label>
            {isEditing ? (
              <Input
                id="deal_name"
                type="text"
                value={formData.deal_name}
                onChange={(e) => handleFieldChange('deal_name', e.target.value)}
                required
              />
            ) : (
              <p className="text-sm font-medium">{formData.deal_name}</p>
            )}
          </div>

          {/* Deal Value */}
          <div className="space-y-2">
            <Label htmlFor="deal_value" className="text-muted-foreground text-sm">Deal Value ($)</Label>
            {isEditing ? (
              <Input
                id="deal_value"
                type="text"
                value={formData.deal_value ? formatNumberWithCommas(formData.deal_value) : ''}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/,/g, '');
                  const numValue = rawValue === '' ? undefined : parseFloat(rawValue);
                  if (rawValue === '' || !isNaN(numValue!)) {
                    handleFieldChange('deal_value', numValue);
                  }
                }}
                placeholder="0"
              />
            ) : (
              <p className="text-sm font-medium">{formatCurrency(formData.deal_value)}</p>
            )}
          </div>

          {/* Commission Rate */}
          <div className="space-y-2">
            <Label htmlFor="commission_rate" className="text-muted-foreground text-sm">Commission Rate (%)</Label>
            {isEditing ? (
              <Input
                id="commission_rate"
                type="number"
                step="0.1"
                min="0"
                value={formData.commission_rate ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  handleFieldChange('commission_rate', value);
                }}
                placeholder="3.0"
              />
            ) : (
              <p className="text-sm font-medium">{formData.commission_rate ? `${formData.commission_rate}%` : '-'}</p>
            )}
          </div>

          {/* Commission Split */}
          <div className="space-y-2">
            <Label htmlFor="commission_split_percent" className="text-muted-foreground text-sm">Your Split (%)</Label>
            {isEditing ? (
              <Input
                id="commission_split_percent"
                type="number"
                step="0.1"
                min="0"
                value={formData.commission_split_percent ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  handleFieldChange('commission_split_percent', value);
                }}
                placeholder="80.0"
              />
            ) : (
              <p className="text-sm font-medium">{formData.commission_split_percent ? `${formData.commission_split_percent}%` : '-'}</p>
            )}
          </div>

          {/* Expected Close Date */}
          <div className="space-y-2">
            <Label htmlFor="expected_close_date" className="text-muted-foreground text-sm">Expected Close Date</Label>
            {isEditing ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm h-10',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      !formData.expected_close_date && 'text-muted-foreground'
                    )}
                  >
                    <span>
                      {formData.expected_close_date
                        ? format(new Date(formData.expected_close_date), 'PPP')
                        : 'Pick a date'}
                    </span>
                    <CalendarIcon className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                  <Calendar
                    mode="single"
                    selected={formData.expected_close_date ? new Date(formData.expected_close_date) : undefined}
                    onSelect={(date) => {
                      handleFieldChange('expected_close_date', date ? format(date, 'yyyy-MM-dd') : '');
                    }}
                    captionLayout="dropdown"
                    startMonth={new Date(2020, 0)}
                    endMonth={new Date(2100, 11)}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <p className="text-sm font-medium">
                {formData.expected_close_date ? format(new Date(formData.expected_close_date), 'PPP') : '-'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      {allFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Required Fields */}
            {requiredFields.length > 0 && (
              <>
                <p className="text-sm font-medium text-muted-foreground">Required Fields</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requiredFields.map((fieldName) => renderFieldRow(fieldName, true))}
                </div>
              </>
            )}

            {/* Optional Fields */}
            {optionalFields.length > 0 && (
              <>
                <p className="text-sm font-medium text-muted-foreground mt-4">Optional Fields</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {optionalFields.map((fieldName) => renderFieldRow(fieldName, false))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
