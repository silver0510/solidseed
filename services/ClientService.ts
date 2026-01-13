import { createClient } from '@supabase/supabase-js';
import { createId } from '@paralleldrive/cuid2';
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
  ListClientsParams,
  PaginatedClients
} from '@/lib/types/client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class ClientService {
  private supabase = supabase;

  // Methods will be added in subsequent steps
}
