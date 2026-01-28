'use client';

/**
 * Deal Type Preferences Component
 *
 * Allows users to toggle which deal types they work with.
 * At least one deal type must remain enabled (enforced by validation).
 */

import { useState, useEffect } from 'react';
import { Home, Calculator, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function DealTypePreferences() {
  const [residential, setResidential] = useState(true);
  const [mortgage, setMortgage] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load current preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user-preferences', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setResidential(data.data.residential_sale_enabled);
        setMortgage(data.data.mortgage_loan_enabled);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (residentialEnabled: boolean, mortgageEnabled: boolean) => {
    // Validation: at least one must be enabled
    if (!residentialEnabled && !mortgageEnabled) {
      toast.error('At least one deal type must be enabled');
      return false;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          residential_sale_enabled: residentialEnabled,
          mortgage_loan_enabled: mortgageEnabled,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save preferences');
      }

      toast.success('Preferences saved');
      return true;
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save preferences');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleResidentialToggle = async (checked: boolean) => {
    const success = await savePreferences(checked, mortgage);
    if (success) {
      setResidential(checked);
    }
  };

  const handleMortgageToggle = async (checked: boolean) => {
    const success = await savePreferences(residential, checked);
    if (success) {
      setMortgage(checked);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enable or disable deal types. Your dashboard and pipeline will only show enabled types.
      </p>

      <div className="space-y-3">
        {/* Residential Sales */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/50">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-background">
              <Home className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Residential Sales</Label>
              <p className="text-xs text-muted-foreground">
                Property transactions and closings
              </p>
            </div>
          </div>
          <Switch
            checked={residential}
            onCheckedChange={handleResidentialToggle}
            disabled={isSaving || (residential && !mortgage)}
          />
        </div>

        {/* Mortgage Loans */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/50">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-background">
              <Calculator className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Mortgage Loans</Label>
              <p className="text-xs text-muted-foreground">
                Loan applications and underwriting
              </p>
            </div>
          </div>
          <Switch
            checked={mortgage}
            onCheckedChange={handleMortgageToggle}
            disabled={isSaving || (mortgage && !residential)}
          />
        </div>
      </div>

      {/* Info Note */}
      <div className="text-xs text-muted-foreground bg-muted/50 border border-border/50 rounded-md p-3">
        <strong>Note:</strong> At least one deal type must be enabled at all times.
      </div>
    </div>
  );
}
