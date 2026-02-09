/**
 * New Deal Page
 *
 * Single-page deal creation form with all fields.
 * Supports pre-selecting client via URL parameter (?client_id=xxx)
 */

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import { cn } from '@/lib/utils/cn';
import type { DealType, CreateDealInput } from '@/features/deals/types';
import type { Client } from '@/features/clients/types';

// =============================================================================
// FIELD ORDER CONFIGURATION
// =============================================================================

// Define explicit field ordering for mortgage deal type
const MORTGAGE_FIELD_ORDER = [
  'loan_type',
  'loan_purpose',
  'purchase_price',
  'down_payment',
  'loan_amount',
  // Remaining fields will follow in their original order
  'property_address',
  'interest_rate',
  'loan_term_years',
  'credit_score',
  'debt_to_income_ratio',
  'employment_type',
  'lender_name',
  'loan_officer',
  'estimated_closing_costs',
];

// Fields that should be required for mortgage (override database config)
const MORTGAGE_REQUIRED_FIELDS = ['loan_type', 'loan_purpose', 'purchase_price', 'down_payment', 'loan_amount'];

// Field config type for enabled fields
interface FieldConfig {
  required: boolean;
  type: 'text' | 'number' | 'date' | 'enum' | 'boolean' | 'textarea';
  enum_values?: Array<{ value: string | number; display: string }>;
}

// Helper to sort fields based on mortgage field order
const sortMortgageFields = (
  fields: Array<[string, FieldConfig | null | undefined]>
): Array<[string, FieldConfig | null | undefined]> => {
  return [...fields].sort((a, b) => {
    const indexA = MORTGAGE_FIELD_ORDER.indexOf(a[0]);
    const indexB = MORTGAGE_FIELD_ORDER.indexOf(b[0]);

    // If both fields are in the order list, sort by their index
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only a is in the list, it comes first
    if (indexA !== -1) return -1;
    // If only b is in the list, it comes first
    if (indexB !== -1) return 1;
    // Otherwise maintain original order
    return 0;
  });
};

// Helper to check if a field is required (with mortgage override)
const isFieldRequired = (
  fieldName: string,
  fieldConfig: FieldConfig | null | undefined,
  dealTypeCode: string | undefined
): boolean => {
  if (dealTypeCode === 'mortgage' && MORTGAGE_REQUIRED_FIELDS.includes(fieldName)) {
    return true;
  }
  return fieldConfig?.required || false;
};

// =============================================================================
// SCHEMA
// =============================================================================

const dealFormSchema = z.object({
  deal_type_id: z.string().min(1, 'Please select a deal type'),
  client_id: z.string().min(1, 'Please select a client'),
  deal_name: z.string().optional(),
  deal_value: z.number().min(0, 'Deal value must be positive').optional().or(z.literal(undefined)),
  commission_rate: z.number().min(0).max(100, 'Commission rate must be between 0-100').optional().or(z.literal(undefined)),
  commission_split_percent: z.number().min(0).max(100, 'Split must be between 0-100').optional().or(z.literal(undefined)),
  expected_close_date: z.string().optional(),
  notes: z.string().optional(),
  referral_source: z.string().optional(),
  deal_data: z.object({}).passthrough(),
});

type DealFormData = z.infer<typeof dealFormSchema>;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function NewDealContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('client_id');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dealTypes, setDealTypes] = useState<DealType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDealType, setSelectedDealType] = useState<DealType | null>(null);
  const [isLoadingDealTypes, setIsLoadingDealTypes] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [downPaymentMode, setDownPaymentMode] = useState<'dollar' | 'percent'>('dollar');
  const [dynamicFieldErrors, setDynamicFieldErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      deal_type_id: '',
      client_id: preselectedClientId || '',
      deal_name: '',
      deal_value: undefined,
      commission_rate: undefined,
      commission_split_percent: undefined,
      expected_close_date: '',
      notes: '',
      referral_source: '',
      deal_data: {},
    },
  });

  const selectedDealTypeId = watch('deal_type_id');
  const selectedClientId = watch('client_id');
  const dealData = watch('deal_data');

  // Fetch deal types
  useEffect(() => {
    const fetchDealTypes = async () => {
      try {
        const response = await fetch('/api/deals/types', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch deal types');
        const data = await response.json();
        setDealTypes(data.deal_types || []);
      } catch (error) {
        console.error('Failed to fetch deal types:', error);
      } finally {
        setIsLoadingDealTypes(false);
      }
    };

    fetchDealTypes();
  }, []);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients?limit=100', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch clients');
        const result = await response.json();
        setClients(result.data || []);
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  // Update selected deal type when deal_type_id changes
  useEffect(() => {
    if (selectedDealTypeId) {
      const dealType = dealTypes.find((dt) => dt.id === selectedDealTypeId);
      setSelectedDealType(dealType || null);
      setValue('deal_data', {});
    } else {
      setSelectedDealType(null);
    }
  }, [selectedDealTypeId, dealTypes, setValue]);

  // Validate dynamic fields before submission
  const validateDynamicFields = (): boolean => {
    if (!selectedDealType) return true;

    const newErrors: Record<string, string> = {};
    const currentDealData = dealData as Record<string, any>;

    Object.entries(selectedDealType.enabled_fields).forEach(([fieldName, fieldConfig]) => {
      if (fieldName === 'down_payment_percent') return; // Skip merged field

      // Use the helper to check if field is required (with mortgage overrides)
      const fieldRequired = isFieldRequired(
        fieldName,
        fieldConfig as FieldConfig | null | undefined,
        selectedDealType.type_code
      );
      if (!fieldRequired) return;

      const value = currentDealData[fieldName];
      const isEmpty = value === undefined || value === null || value === '';

      if (isEmpty) {
        const label = fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        newErrors[fieldName] = `${label} is required`;
      }
    });

    setDynamicFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (data: DealFormData) => {
    // Validate dynamic fields first
    if (!validateDynamicFields()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const createData: CreateDealInput = {
        deal_type_id: data.deal_type_id,
        client_id: data.client_id,
        deal_name: data.deal_name,
        deal_value: data.deal_value,
        commission_rate: data.commission_rate,
        commission_split_percent: data.commission_split_percent,
        expected_close_date: data.expected_close_date,
        notes: data.notes,
        referral_source: data.referral_source,
        deal_data: data.deal_data,
      };

      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(createData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create deal');
      }

      const result = await response.json();
      router.push(`/deals/${result.data.id}`);
    } catch (error) {
      console.error('Failed to create deal:', error);
      alert(error instanceof Error ? error.message : 'Failed to create deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Render dynamic field based on field config
  const renderDynamicField = (fieldName: string, fieldConfig: FieldConfig) => {
    // Get raw value - cast per usage below
    const value = (dealData as Record<string, unknown>)[fieldName];

    switch (fieldConfig.type) {
      case 'text':
      case 'textarea':
        const textFieldRequired = isFieldRequired(fieldName, fieldConfig, selectedDealType?.type_code);
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              {textFieldRequired && ' *'}
            </Label>
            {fieldConfig.type === 'textarea' ? (
              <Textarea
                id={fieldName}
                value={(value as string) || ''}
                onChange={(e) => {
                  setValue('deal_data', { ...dealData, [fieldName]: e.target.value });
                  if (dynamicFieldErrors[fieldName]) {
                    setDynamicFieldErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors[fieldName];
                      return newErrors;
                    });
                  }
                }}
                className="resize-none"
                rows={3}
              />
            ) : (
              <Input
                id={fieldName}
                type="text"
                value={(value as string) || ''}
                onChange={(e) => {
                  setValue('deal_data', { ...dealData, [fieldName]: e.target.value });
                  if (dynamicFieldErrors[fieldName]) {
                    setDynamicFieldErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors[fieldName];
                      return newErrors;
                    });
                  }
                }}
              />
            )}
            {dynamicFieldErrors[fieldName] && (
              <p className="text-sm text-destructive">{dynamicFieldErrors[fieldName]}</p>
            )}
          </div>
        );

      case 'number':
        // Special handling for down_payment field with $/% toggle
        if (fieldName === 'down_payment') {
          const purchasePrice = (dealData as Record<string, number | undefined>)['purchase_price'];
          const isMortgage = selectedDealType?.type_code === 'mortgage';
          const fieldRequired = isFieldRequired(fieldName, fieldConfig, selectedDealType?.type_code);

          // Calculate values based on mode
          let displayValue = '';
          if (value !== undefined && value !== null) {
            if (downPaymentMode === 'dollar') {
              displayValue = parseFloat(String(value)).toLocaleString('en-US');
            } else if (purchasePrice && purchasePrice > 0) {
              const percentage = (parseFloat(String(value)) / purchasePrice) * 100;
              displayValue = percentage.toFixed(1);
            }
          }

          // Handler for down payment change with auto-calculation
          const handleDownPaymentChange = (rawValue: string, isPercent: boolean) => {
            const cleanValue = rawValue.replace(/,/g, '');
            if (cleanValue === '') {
              setValue('deal_data', {
                ...dealData,
                down_payment: undefined,
                // Clear loan_amount if purchase_price exists
                ...(purchasePrice ? { loan_amount: undefined } : {}),
              });
              return;
            }

            const numValue = parseFloat(cleanValue);
            if (isNaN(numValue)) return;

            let downPaymentDollars: number;
            if (isPercent && purchasePrice) {
              // Convert percent to dollars
              downPaymentDollars = (numValue / 100) * purchasePrice;
            } else {
              downPaymentDollars = numValue;
            }

            // Auto-calculate loan_amount if purchase_price is set
            const newDealData: Record<string, number | undefined> = {
              ...dealData,
              down_payment: downPaymentDollars,
            };

            if (isMortgage && purchasePrice && purchasePrice > 0) {
              newDealData.loan_amount = purchasePrice - downPaymentDollars;
            }

            setValue('deal_data', newDealData);
            if (dynamicFieldErrors[fieldName]) {
              setDynamicFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
              });
            }
          };

          return (
            <div key={fieldName} className="space-y-2">
              <Label htmlFor={fieldName}>
                Down Payment{fieldRequired && ' *'}
              </Label>
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
              {dynamicFieldErrors[fieldName] && (
                <p className="text-sm text-destructive">{dynamicFieldErrors[fieldName]}</p>
              )}
            </div>
          );
        }

        // Special handling for loan_amount field (auto-calculated for mortgage)
        if (fieldName === 'loan_amount') {
          const purchasePrice = (dealData as Record<string, number | undefined>)['purchase_price'];
          const downPayment = (dealData as Record<string, number | undefined>)['down_payment'];
          const isMortgage = selectedDealType?.type_code === 'mortgage';
          const fieldRequired = isFieldRequired(fieldName, fieldConfig, selectedDealType?.type_code);

          // Handler for loan amount change with auto-calculation
          const handleLoanAmountChange = (rawValue: string) => {
            const cleanValue = rawValue.replace(/,/g, '');
            if (cleanValue === '') {
              setValue('deal_data', {
                ...dealData,
                loan_amount: undefined,
                // Clear down_payment if purchase_price exists
                ...(purchasePrice ? { down_payment: undefined } : {}),
              });
              return;
            }

            const numValue = parseFloat(cleanValue);
            if (isNaN(numValue)) return;

            // Auto-calculate down_payment if purchase_price is set
            const newDealData: Record<string, number | undefined> = {
              ...dealData,
              loan_amount: numValue,
            };

            if (isMortgage && purchasePrice && purchasePrice > 0) {
              newDealData.down_payment = purchasePrice - numValue;
            }

            setValue('deal_data', newDealData);
            if (dynamicFieldErrors[fieldName]) {
              setDynamicFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
              });
            }
          };

          return (
            <div key={fieldName} className="space-y-2">
              <Label htmlFor={fieldName}>
                Loan Amount{fieldRequired && ' *'}
              </Label>
              <Input
                id={fieldName}
                type="text"
                value={value ? parseFloat(String(value)).toLocaleString('en-US') : ''}
                onChange={(e) => handleLoanAmountChange(e.target.value)}
                placeholder="0"
              />
              {isMortgage && purchasePrice && downPayment !== undefined && (
                <p className="text-xs text-muted-foreground">
                  = ${purchasePrice.toLocaleString('en-US')} - ${downPayment.toLocaleString('en-US')}
                </p>
              )}
              {dynamicFieldErrors[fieldName] && (
                <p className="text-sm text-destructive">{dynamicFieldErrors[fieldName]}</p>
              )}
            </div>
          );
        }

        // Special handling for purchase_price field (triggers auto-calculation)
        if (fieldName === 'purchase_price') {
          const downPayment = (dealData as Record<string, number | undefined>)['down_payment'];
          const loanAmount = (dealData as Record<string, number | undefined>)['loan_amount'];
          const isMortgage = selectedDealType?.type_code === 'mortgage';
          const fieldRequired = isFieldRequired(fieldName, fieldConfig, selectedDealType?.type_code);

          // Handler for purchase price change with auto-calculation
          const handlePurchasePriceChange = (rawValue: string) => {
            const cleanValue = rawValue.replace(/,/g, '');
            if (cleanValue === '') {
              setValue('deal_data', {
                ...dealData,
                purchase_price: undefined,
              });
              return;
            }

            const numValue = parseFloat(cleanValue);
            if (isNaN(numValue)) return;

            const newDealData: Record<string, number | undefined> = {
              ...dealData,
              purchase_price: numValue,
            };

            // Auto-calculate loan_amount if down_payment is already set
            if (isMortgage && downPayment !== undefined && downPayment > 0) {
              newDealData.loan_amount = numValue - downPayment;
            }
            // Or auto-calculate down_payment if loan_amount is already set
            else if (isMortgage && loanAmount !== undefined && loanAmount > 0) {
              newDealData.down_payment = numValue - loanAmount;
            }

            setValue('deal_data', newDealData);
            if (dynamicFieldErrors[fieldName]) {
              setDynamicFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
              });
            }
          };

          return (
            <div key={fieldName} className="space-y-2">
              <Label htmlFor={fieldName}>
                Purchase Price{fieldRequired && ' *'}
              </Label>
              <Input
                id={fieldName}
                type="text"
                value={value ? parseFloat(String(value)).toLocaleString('en-US') : ''}
                onChange={(e) => handlePurchasePriceChange(e.target.value)}
                placeholder="0"
              />
              {dynamicFieldErrors[fieldName] && (
                <p className="text-sm text-destructive">{dynamicFieldErrors[fieldName]}</p>
              )}
            </div>
          );
        }

        // Default number field rendering for other fields
        const numberFieldRequired = isFieldRequired(fieldName, fieldConfig, selectedDealType?.type_code);
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              {numberFieldRequired && ' *'}
            </Label>
            <Input
              id={fieldName}
              type="text"
              value={value ? parseFloat(String(value)).toLocaleString('en-US') : ''}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/,/g, '');
                const numValue = rawValue === '' ? undefined : parseFloat(rawValue);
                if (rawValue === '' || !isNaN(numValue!)) {
                  setValue('deal_data', {
                    ...dealData,
                    [fieldName]: numValue,
                  });
                  if (dynamicFieldErrors[fieldName]) {
                    setDynamicFieldErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors[fieldName];
                      return newErrors;
                    });
                  }
                }
              }}
            />
            {dynamicFieldErrors[fieldName] && (
              <p className="text-sm text-destructive">{dynamicFieldErrors[fieldName]}</p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              {fieldConfig.required && ' *'}
            </Label>
            <Input
              id={fieldName}
              type="date"
              value={(value as string) || ''}
              onChange={(e) => {
                setValue('deal_data', { ...dealData, [fieldName]: e.target.value });
                if (dynamicFieldErrors[fieldName]) {
                  setDynamicFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[fieldName];
                    return newErrors;
                  });
                }
              }}
            />
            {dynamicFieldErrors[fieldName] && (
              <p className="text-sm text-destructive">{dynamicFieldErrors[fieldName]}</p>
            )}
          </div>
        );

      case 'enum':
        const enumFieldRequired = isFieldRequired(fieldName, fieldConfig, selectedDealType?.type_code);
        return (
          <div key={fieldName} className="space-y-2">
            <Label htmlFor={fieldName}>
              {fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              {enumFieldRequired && ' *'}
            </Label>
            <Select
              value={String(value || '')}
              onValueChange={(val) => {
                setValue('deal_data', { ...dealData, [fieldName]: val });
                if (dynamicFieldErrors[fieldName]) {
                  setDynamicFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[fieldName];
                    return newErrors;
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {fieldConfig.enum_values?.map((enumOption: { value: string | number; display: string }) => (
                  <SelectItem
                    key={String(enumOption.value)}
                    value={String(enumOption.value)}
                  >
                    {enumOption.display}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dynamicFieldErrors[fieldName] && (
              <p className="text-sm text-destructive">{dynamicFieldErrors[fieldName]}</p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={fieldName} className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={fieldName}
                checked={Boolean(value) || false}
                onChange={(e) => {
                  setValue('deal_data', { ...dealData, [fieldName]: e.target.checked });
                  if (dynamicFieldErrors[fieldName]) {
                    setDynamicFieldErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors[fieldName];
                      return newErrors;
                    });
                  }
                }}
                className="h-4 w-4"
              />
              <Label htmlFor={fieldName} className="font-normal">
                {fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Label>
            </div>
            {dynamicFieldErrors[fieldName] && (
              <p className="text-sm text-destructive">{dynamicFieldErrors[fieldName]}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoadingDealTypes || isLoadingClients) {
    return <SectionLoader message="Loading form..." />;
  }

  // Get selected client for display
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Deals</h1>
          <p className="text-muted-foreground mt-1">
            Fill in the details below to create a new deal
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client_id">Client *</Label>
              {preselectedClientId ? (
                <div className="flex items-center h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                  {selectedClient?.name || 'Loading...'}
                </div>
              ) : (
                <Controller
                  name="client_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.client_id && (
                <p className="text-sm text-destructive">{errors.client_id.message}</p>
              )}
            </div>

            {/* Deal Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="deal_type_id">Deal Type *</Label>
              <Controller
                name="deal_type_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deal type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dealTypes.map((dealType) => (
                        <SelectItem key={dealType.id} value={dealType.id}>
                          {dealType.type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.deal_type_id && (
                <p className="text-sm text-destructive">{errors.deal_type_id.message}</p>
              )}
            </div>

            {/* Basic Information */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium">Basic Information</h3>

              {/* Deal Name (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="deal_name">Deal Name (Optional)</Label>
                <Input
                  id="deal_name"
                  type="text"
                  {...register('deal_name')}
                  placeholder="Auto-generated if not provided"
                />
                {errors.deal_name && (
                  <p className="text-sm text-destructive">{errors.deal_name.message}</p>
                )}
              </div>

              {/* Deal Value */}
              <div className="space-y-2">
                <Label htmlFor="deal_value">Deal Value ($)</Label>
                <Controller
                  name="deal_value"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="deal_value"
                      type="text"
                      value={field.value ? field.value.toLocaleString('en-US') : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, '');
                        const numValue = rawValue === '' ? undefined : parseFloat(rawValue);
                        if (rawValue === '' || !isNaN(numValue!)) {
                          field.onChange(numValue);
                        }
                      }}
                      placeholder="0"
                    />
                  )}
                />
                {errors.deal_value && (
                  <p className="text-sm text-destructive">{errors.deal_value.message}</p>
                )}
              </div>

              {/* Commission Rate */}
              <div className="space-y-2">
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Controller
                  name="commission_rate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="commission_rate"
                      type="number"
                      step="0.1"
                      min="0"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                      placeholder="3.0"
                    />
                  )}
                />
                {errors.commission_rate && (
                  <p className="text-sm text-destructive">{errors.commission_rate.message}</p>
                )}
              </div>

              {/* Commission Split */}
              <div className="space-y-2">
                <Label htmlFor="commission_split_percent">Your Split (%)</Label>
                <Controller
                  name="commission_split_percent"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="commission_split_percent"
                      type="number"
                      step="0.1"
                      min="0"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                      placeholder="80.0"
                    />
                  )}
                />
                {errors.commission_split_percent && (
                  <p className="text-sm text-destructive">
                    {errors.commission_split_percent.message}
                  </p>
                )}
              </div>

              {/* Expected Close Date */}
              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Expected Close Date</Label>
                <Controller
                  name="expected_close_date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      placeholder="Pick a date"
                      fromYear={2020}
                      toYear={2100}
                    />
                  )}
                />
                {errors.expected_close_date && (
                  <p className="text-sm text-destructive">
                    {errors.expected_close_date.message}
                  </p>
                )}
              </div>

              {/* Referral Source */}
              <div className="space-y-2">
                <Label htmlFor="referral_source">Referral Source</Label>
                <Controller
                  name="referral_source"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="past_client">Past Client</SelectItem>
                        <SelectItem value="cold_call">Cold Call</SelectItem>
                        <SelectItem value="open_house">Open House</SelectItem>
                        <SelectItem value="zillow">Zillow</SelectItem>
                        <SelectItem value="realtor_com">Realtor.com</SelectItem>
                        <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                        <SelectItem value="google_ads">Google Ads</SelectItem>
                        <SelectItem value="direct_mail">Direct Mail</SelectItem>
                        <SelectItem value="networking_event">Networking Event</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Additional information about this deal"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Additional Details (Dynamic based on deal type) */}
            {selectedDealType && selectedDealType.enabled_fields &&
             Object.keys(selectedDealType.enabled_fields).length > 0 && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium">Additional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    // Get field entries and filter
                    const rawEntries = Object.entries(selectedDealType.enabled_fields)
                      .filter(([fieldName, fieldConfig]) => {
                        // Skip down_payment_percent since it's merged with down_payment toggle
                        if (fieldName === 'down_payment_percent') return false;
                        return fieldConfig !== null && fieldConfig !== undefined;
                      }) as Array<[string, FieldConfig]>;

                    // Sort fields for mortgage type
                    const fieldEntries = selectedDealType.type_code === 'mortgage'
                      ? sortMortgageFields(rawEntries)
                      : rawEntries;

                    return fieldEntries.map(([fieldName, fieldConfig]) =>
                      renderDynamicField(fieldName, fieldConfig!)
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Deal'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewDealPage() {
  return (
    <Suspense fallback={<SectionLoader message="Loading deal creation form..." />}>
      <NewDealContent />
    </Suspense>
  );
}
