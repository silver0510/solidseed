'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Camera, Mic, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/features/clients/types';
import { DealType } from '@/features/deals/types';
import { CreateDealInput } from '@/features/deals/types';

interface QuickDealAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickDealAddSheet({ open, onOpenChange }: QuickDealAddSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [clientId, setClientId] = useState<string>('');
  const [dealTypeId, setDealTypeId] = useState<string>('');
  const [address, setAddress] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Fetch clients
  const { data: clients = [] } = useSuspenseQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Failed to fetch clients');
      const result = await res.json();
      return result.data || [];
    },
  });

  // Fetch deal types
  const { data: dealTypes = [] } = useSuspenseQuery<DealType[]>({
    queryKey: ['deal-types'],
    queryFn: async () => {
      const res = await fetch('/api/deal-types');
      if (!res.ok) throw new Error('Failed to fetch deal types');
      const result = await res.json();
      return result.data || [];
    },
  });

  // Create deal mutation
  const createDeal = useMutation({
    mutationFn: async (input: CreateDealInput) => {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create deal');
      }
      return res.json();
    },
    onSuccess: async (data) => {
      // Upload photos if any
      if (photos.length > 0 && data.data?.id) {
        await uploadPhotos(data.data.id);
      }

      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        title: 'Deal created',
        description: 'Your deal has been created successfully.',
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Upload photos as documents
  const uploadPhotos = async (dealId: string) => {
    for (const photo of photos) {
      const formData = new FormData();
      formData.append('file', photo);
      formData.append('document_name', photo.name);
      formData.append('category', 'photos');

      await fetch(`/api/deals/${dealId}/documents`, {
        method: 'POST',
        body: formData,
      });
    }
  };

  // Voice-to-text functionality
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: 'Not supported',
        description: 'Speech recognition is not supported in your browser.',
        variant: 'destructive',
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAddress(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        title: 'Error',
        description: 'Failed to recognize speech. Please try again.',
        variant: 'destructive',
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  // Generate deal name from address and client
  const generateDealName = () => {
    if (!address && !dealValue) return '';

    const client = clients.find(c => c.id === clientId);
    const parts = [];

    if (address) parts.push(address);
    if (dealValue) parts.push(`$${dealValue}`);
    if (client) parts.push(client.name);

    return parts.join(' - ');
  };

  // Reset form
  const resetForm = () => {
    setClientId('');
    setDealTypeId('');
    setAddress('');
    setDealValue('');
    setPhotos([]);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId || !dealTypeId) {
      toast({
        title: 'Missing fields',
        description: 'Please select a client and deal type.',
        variant: 'destructive',
      });
      return;
    }

    const dealType = dealTypes.find(dt => dt.id === dealTypeId);
    if (!dealType) return;

    // Generate deal name
    const dealName = generateDealName() || 'New Deal';

    // Default to first stage in pipeline
    const firstStage = dealType.pipeline_stages?.[0] || 'Lead';

    // Expected close date: +30 days
    const expectedCloseDate = new Date();
    expectedCloseDate.setDate(expectedCloseDate.getDate() + 30);

    const input: CreateDealInput = {
      deal_name: dealName,
      deal_type_id: dealTypeId,
      client_id: clientId,
      current_stage: firstStage,
      status: 'active',
      deal_value: dealValue ? parseFloat(dealValue) : null,
      expected_close_date: expectedCloseDate.toISOString().split('T')[0],
      deal_data: address ? { property_address: address } : {},
    };

    createDeal.mutate(input);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Quick Add Deal</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deal Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="dealType">Deal Type *</Label>
            <Select value={dealTypeId} onValueChange={setDealTypeId}>
              <SelectTrigger id="dealType">
                <SelectValue placeholder="Select deal type" />
              </SelectTrigger>
              <SelectContent>
                {dealTypes.map((dealType) => (
                  <SelectItem key={dealType.id} value={dealType.id}>
                    {dealType.type_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address with Voice Input */}
          <div className="space-y-2">
            <Label htmlFor="address">Property Address</Label>
            <div className="flex gap-2">
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State"
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={startVoiceInput}
                disabled={isListening}
                className={isListening ? 'animate-pulse bg-red-50' : ''}
              >
                <Mic className={`h-4 w-4 ${isListening ? 'text-red-600' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Deal Value */}
          <div className="space-y-2">
            <Label htmlFor="dealValue">Deal Value ($)</Label>
            <Input
              id="dealValue"
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Photos</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              {photos.length > 0 ? `${photos.length} photo(s) selected` : 'Add Photos'}
            </Button>
            {photos.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative">
                    <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      {photo.name.substring(0, 8)}...
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generated Deal Name Preview */}
          {(address || dealValue || clientId) && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Deal name:</p>
              <p className="font-medium">{generateDealName() || 'New Deal'}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createDeal.isPending}
              className="flex-1"
            >
              {createDeal.isPending ? 'Creating...' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
