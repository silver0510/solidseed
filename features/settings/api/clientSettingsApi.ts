/**
 * Client Settings API functions
 * Handles client statuses and user tags
 */

import type { ClientStatus, UserTag } from '@/lib/types/client';
import { getBaseUrl } from '@/lib/api/utils';

// =============================================================================
// CLIENT STATUSES
// =============================================================================

export async function fetchClientStatuses(): Promise<ClientStatus[]> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/client-statuses`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch statuses');
  }
  return response.json();
}

export async function createClientStatus(data: {
  name: string;
  color: string;
}): Promise<ClientStatus> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/client-statuses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
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
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/client-statuses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update status');
  }
  return response.json();
}

export async function deleteClientStatus(id: string): Promise<void> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/client-statuses/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete status');
  }
}

export async function reorderClientStatuses(statusIds: string[]): Promise<void> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/client-statuses/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statusIds }),
    credentials: 'include',
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
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/user-tags`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  return response.json();
}

export async function createUserTag(data: {
  name: string;
  color: string;
}): Promise<UserTag> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/user-tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
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
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/user-tags/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update tag');
  }
  return response.json();
}

export async function deleteUserTag(id: string): Promise<void> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/user-tags/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete tag');
  }
}
