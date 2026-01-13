export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  birthday?: string;
  address?: string;
  created_by: string;
  assigned_to: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  birthday?: string;
  address?: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  address?: string;
}

export interface ListClientsParams {
  cursor?: string;
  limit?: number;
  search?: string;
  tag?: string;
  sort?: 'created_at' | 'name';
}

export interface PaginatedClients {
  data: Client[];
  next_cursor?: string;
  total_count: number;
}
