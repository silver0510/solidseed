import { describe, it, expect, vi } from 'vitest';

// Mock Supabase - must be hoisted before imports
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    auth: { getUser: vi.fn() }
  })),
}));

// Import after mock
import { ClientService } from '@/services/ClientService';

describe('ClientService Foundation', () => {
  it('should instantiate successfully', () => {
    const service = new ClientService();
    expect(service).toBeInstanceOf(ClientService);
  });

  it('should have Supabase client initialized', () => {
    const service = new ClientService();
    // Check that the service has the supabase property
    expect(service).toHaveProperty('supabase');
  });
});
