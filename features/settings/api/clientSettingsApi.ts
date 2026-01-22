/**
 * Client Settings API functions
 * Handles client statuses and user tags
 */

import type { ClientStatus, UserTag } from '@/lib/types/client';

// =============================================================================
// CLIENT STATUSES
// =============================================================================

export async function fetchClientStatuses(): Promise<ClientStatus[]> {
  const response = await fetch('/api/client-statuses');
  if (!response.ok) {
    throw new Error('Failed to fetch statuses');
  }
  return response.json();
}

export async function createClientStatus(data: {
  name: string;
  color: string;
}): Promise<ClientStatus> {
  const response = await fetch('/api/client-statuses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create status');
  }
  return response.json();
}

export async function updateClientStatus(
  id: string,
  data: { name?: string; color?: string; position?: number }
): Promise<ClientStatus> {
  const response = await fetch(`/api/client-statuses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update status');
  }
  return response.json();
}

export async function deleteClientStatus(id: string): Promise<void> {
  const response = await fetch(`/api/client-statuses/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete status');
  }
}

export async function reorderClientStatuses(statusIds: string[]): Promise<void> {
  const response = await fetch('/api/client-statuses/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statusIds }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reorder statuses');
  }
}

// =============================================================================
// USER TAGS
// =============================================================================

export async function fetchUserTags(): Promise<UserTag[]> {
  const response = await fetch('/api/user-tags');
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  return response.json();
}

export async function createUserTag(data: {
  name: string;
  color: string;
}): Promise<UserTag> {
  const response = await fetch('/api/user-tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create tag');
  }
  return response.json();
}

export async function updateUserTag(
  id: string,
  data: { name?: string; color?: string }
): Promise<UserTag> {
  const response = await fetch(`/api/user-tags/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update tag');
  }
  return response.json();
}

export async function deleteUserTag(id: string): Promise<void> {
  const response = await fetch(`/api/user-tags/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete tag');
  }
}
