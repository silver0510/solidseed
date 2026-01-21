/**
 * Client Hub Helper Utilities
 *
 * Provides utility functions for formatting, validation, and computed values
 * used across client-related components.
 *
 * @module features/clients/helpers
 */

import type {
  ClientTask,
  TaskDisplayInfo,
  TaskPriority,
  TaskStatus,
  AllowedDocumentType,
} from '../types';
import {
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE,
  PHONE_FORMAT_REGEX,
} from '../types';

// =============================================================================
// PHONE FORMATTING
// =============================================================================

/**
 * Format a phone number to the standard format (+1-XXX-XXX-XXXX)
 *
 * @param phone - Raw phone number input
 * @returns Formatted phone number or original if cannot format
 *
 * @example
 * formatPhoneNumber('5551234567') // Returns '+1-555-123-4567'
 * formatPhoneNumber('555-123-4567') // Returns '+1-555-123-4567'
 * formatPhoneNumber('+15551234567') // Returns '+1-555-123-4567'
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If starts with 1, remove it (country code)
  const cleaned = digits.startsWith('1') && digits.length === 11
    ? digits.slice(1)
    : digits;

  // Must have exactly 10 digits for US number
  if (cleaned.length !== 10) {
    return phone; // Return original if can't format
  }

  // Format as +1-XXX-XXX-XXXX
  return `+1-${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

/**
 * Validate a phone number against the required format
 *
 * @param phone - Phone number to validate
 * @returns True if valid format
 */
export function isValidPhoneFormat(phone: string): boolean {
  return PHONE_FORMAT_REGEX.test(phone);
}

/**
 * Format phone number for display (more readable)
 *
 * @param phone - Phone number in +1-XXX-XXX-XXXX format
 * @returns Display-friendly format: (XXX) XXX-XXXX
 */
export function formatPhoneForDisplay(phone: string): string {
  const match = phone.match(/^\+1-(\d{3})-(\d{3})-(\d{4})$/);
  if (!match) {
    return phone;
  }
  return `(${match[1]}) ${match[2]}-${match[3]}`;
}

// =============================================================================
// DATE FORMATTING
// =============================================================================

/**
 * Format a date string for display
 *
 * @param dateString - ISO 8601 date string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  } catch {
    return dateString;
  }
}

/**
 * Format a datetime string for display
 *
 * @param dateTimeString - ISO 8601 datetime string
 * @returns Formatted datetime string (e.g., "Jan 15, 2026, 2:30 PM")
 */
export function formatDateTime(dateTimeString: string): string {
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateTimeString;
  }
}

/**
 * Format a date as relative time (e.g., "2 days ago", "in 3 hours")
 *
 * @param dateString - ISO 8601 date/datetime string
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.round(diffMs / (1000 * 60));

    if (Math.abs(diffDays) >= 1) {
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      return rtf.format(diffDays, 'day');
    } else if (Math.abs(diffHours) >= 1) {
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      return rtf.format(diffHours, 'hour');
    } else {
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      return rtf.format(diffMinutes, 'minute');
    }
  } catch {
    return dateString;
  }
}

/**
 * Check if a date is today
 *
 * @param dateString - ISO 8601 date string (YYYY-MM-DD)
 * @returns True if the date is today
 */
export function isToday(dateString: string): boolean {
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Check if a date is tomorrow
 *
 * @param dateString - ISO 8601 date string (YYYY-MM-DD)
 * @returns True if the date is tomorrow
 */
export function isTomorrow(dateString: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = new Date(dateString);
  return (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  );
}

/**
 * Check if a date is in the past
 *
 * @param dateString - ISO 8601 date string (YYYY-MM-DD)
 * @returns True if the date is before today
 */
export function isPast(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Calculate days until a date
 *
 * @param dateString - ISO 8601 date string (YYYY-MM-DD)
 * @returns Number of days (negative if in the past)
 */
export function daysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  const diffMs = date.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// =============================================================================
// TASK HELPERS
// =============================================================================

/**
 * Get display info for a task
 *
 * @param task - The task to analyze
 * @returns TaskDisplayInfo with computed properties
 */
export function getTaskDisplayInfo(task: ClientTask): TaskDisplayInfo {
  const daysUntilDue = daysUntil(task.due_date);

  return {
    isOverdue: task.status !== 'closed' && isPast(task.due_date),
    isDueToday: isToday(task.due_date),
    isDueTomorrow: isTomorrow(task.due_date),
    daysUntilDue,
    priorityColor: getPriorityColor(task.priority),
    statusColor: getStatusColor(task.status),
  };
}

/**
 * Get the color for a task status
 *
 * @param status - Task status value
 * @returns Color name for UI
 */
export function getStatusColor(
  status: TaskStatus
): 'success' | 'primary' | 'default' {
  switch (status) {
    case 'closed':
      return 'success';
    case 'in_progress':
      return 'primary';
    case 'todo':
    default:
      return 'default';
  }
}

/**
 * Get the color for a task priority
 *
 * @param priority - Task priority value
 * @returns MUI color name
 */
export function getPriorityColor(
  priority: TaskPriority
): 'error' | 'warning' | 'success' | 'default' {
  switch (priority) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
}

/**
 * Get human-readable label for task priority
 *
 * @param priority - Task priority value
 * @returns Display label
 */
export function getPriorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case 'high':
      return 'High Priority';
    case 'medium':
      return 'Medium Priority';
    case 'low':
      return 'Low Priority';
    default:
      return 'Unknown';
  }
}

/**
 * Get human-readable label for task status
 *
 * @param status - Task status value
 * @returns Display label
 */
export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'closed':
      return 'Closed';
    case 'in_progress':
      return 'In Progress';
    case 'todo':
      return 'To Do';
    default:
      return 'Unknown';
  }
}

/**
 * Sort tasks by due date (ascending) then priority (descending)
 *
 * @param tasks - Array of tasks to sort
 * @returns Sorted array (new array, original not modified)
 */
export function sortTasksByUrgency(tasks: ClientTask[]): ClientTask[] {
  const priorityOrder: Record<TaskPriority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return [...tasks].sort((a, b) => {
    // First sort by due date (ascending)
    const dateCompare = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    if (dateCompare !== 0) {
      return dateCompare;
    }
    // Then by priority (descending - high first)
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// =============================================================================
// DOCUMENT HELPERS
// =============================================================================

/**
 * Check if a file type is allowed for upload
 *
 * @param mimeType - MIME type of the file
 * @returns True if allowed
 */
export function isAllowedDocumentType(mimeType: string): mimeType is AllowedDocumentType {
  return (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Check if a file size is within the allowed limit
 *
 * @param size - File size in bytes
 * @returns True if within limit
 */
export function isValidDocumentSize(size: number): boolean {
  return size > 0 && size <= MAX_DOCUMENT_SIZE;
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Human-readable size string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 *
 * @param filename - The filename
 * @returns File extension (lowercase) or empty string
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * Get human-readable file type name
 *
 * @param mimeType - MIME type of the file
 * @returns Display name for the file type
 */
export function getFileTypeName(mimeType: string): string {
  const typeNames: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
  };
  return typeNames[mimeType] || 'Unknown';
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate email format
 *
 * @param email - Email address to validate
 * @returns True if valid format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate that a string is not empty (after trimming)
 *
 * @param value - String to validate
 * @returns True if not empty
 */
export function isNotEmpty(value: string | undefined | null): boolean {
  return value != null && value.trim().length > 0;
}

/**
 * Validate birthday is in the past
 *
 * @param birthday - Birthday string in YYYY-MM-DD format
 * @returns True if valid (in the past)
 */
export function isValidBirthday(birthday: string): boolean {
  const date = new Date(birthday);
  const today = new Date();
  return date < today;
}

// =============================================================================
// STRING HELPERS
// =============================================================================

/**
 * Truncate text to a maximum length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Get initials from a name
 *
 * @param name - Full name
 * @returns Initials (up to 2 characters)
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0]?.slice(0, 2).toUpperCase() || '';
  }
  return `${parts[0]?.charAt(0) || ''}${parts[parts.length - 1]?.charAt(0) || ''}`.toUpperCase();
}

/**
 * Highlight search term in text
 *
 * @param text - Text to search in
 * @param searchTerm - Term to highlight
 * @returns Array of { text, highlight } segments
 */
export function highlightSearchTerm(
  text: string,
  searchTerm: string
): Array<{ text: string; highlight: boolean }> {
  if (!searchTerm) {
    return [{ text, highlight: false }];
  }

  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part) => ({
    text: part,
    highlight: part.toLowerCase() === searchTerm.toLowerCase(),
  }));
}

/**
 * Escape special regex characters in a string
 *
 * @param string - String to escape
 * @returns Escaped string safe for use in regex
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
