import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientService } from '../ClientService';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    auth: { getUser: vi.fn() }
  })),
}));

describe('ClientService Foundation', () => {
  it('should instantiate successfully', () => {
    const service = new ClientService();
    expect(service).toBeInstanceOf(ClientService);
  });

  it('should initialize Supabase client', () => {
    new ClientService();
    expect(createClient).toHaveBeenCalled();
  });
});
