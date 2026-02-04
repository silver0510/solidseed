'use client';

/**
 * Deal Type Onboarding Page
 *
 * First screen after email verification where users select which deal types they work with.
 * Users can change this later in Deal Settings.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Calculator } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function DealTypeOnboardingPage() {
  const router = useRouter();
  const [residential, setResidential] = useState(false); // Both enabled by default
  const [mortgage, setMortgage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    // Validation: at least one must be selected
    if (!residential && !mortgage) {
      toast.error('Please select at least one deal type');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save preferences
      const response = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          residential_sale_enabled: residential,
          mortgage_loan_enabled: mortgage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save preferences');
      }

      // Mark onboarding as completed
      const completeResponse = await fetch('/api/user-preferences', {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete onboarding');
      }

      // Success - redirect to dashboard
      toast.success('Preferences saved!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          What type of deals do you work with?
        </h1>
        <p className="text-sm text-muted-foreground">
          Select the deal types you manage. You can change this later in{' '} <span className="font-semibold text-foreground">Deal Settings</span>
        </p>
      </div>

      {/* Deal Type Options */}
      <div className="space-y-4">
        {/* Residential Sales Option */}
        <div
          className={`relative border-2 rounded-lg p-4 transition-all cursor-pointer hover:border-muted-foreground/50 ${
            residential
              ? 'border-foreground bg-muted'
              : 'border-border bg-card'
          }`}
          onClick={() => setResidential(!residential)}
        >
          <div className="flex items-start gap-4">
            <Checkbox
              checked={residential}
              onCheckedChange={(checked) => setResidential(checked === true)}
              className="mt-1"
              id="residential"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  residential
                    ? 'bg-secondary'
                    : 'bg-muted'
                }`}>
                  <Home className={`h-5 w-5 ${
                    residential
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`} />
                </div>
                <Label
                  htmlFor="residential"
                  className="text-base font-semibold cursor-pointer text-foreground"
                >
                  Residential Sales
                </Label>
              </div>
              <p className="text-sm text-muted-foreground pl-11">
                Track residential property transactions from showing through closing
              </p>
            </div>
          </div>
        </div>

        {/* Mortgage Loans Option */}
        <div
          className={`relative border-2 rounded-lg p-4 transition-all cursor-pointer hover:border-muted-foreground/50 ${
            mortgage
              ? 'border-foreground bg-muted'
              : 'border-border bg-card'
          }`}
          onClick={() => setMortgage(!mortgage)}
        >
          <div className="flex items-start gap-4">
            <Checkbox
              checked={mortgage}
              onCheckedChange={(checked) => setMortgage(checked === true)}
              className="mt-1"
              id="mortgage"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  mortgage
                    ? 'bg-secondary'
                    : 'bg-muted'
                }`}>
                  <Calculator className={`h-5 w-5 ${
                    mortgage
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`} />
                </div>
                <Label
                  htmlFor="mortgage"
                  className="text-base font-semibold cursor-pointer text-foreground"
                >
                  Mortgage Loans
                </Label>
              </div>
              <p className="text-sm text-muted-foreground pl-11">
                Manage mortgage loan applications through underwriting and funding
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {!residential && !mortgage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            Please select at least one deal type to continue
          </p>
        </div>
      )}

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={isSubmitting || (!residential && !mortgage)}
        className="w-full min-h-touch text-base font-semibold"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Spinner className="mr-2 size-5" />
            Saving...
          </>
        ) : (
          'Continue to Dashboard'
        )}
      </Button>

    </div>
  );
}
