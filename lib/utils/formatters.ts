/**
 * Formatting utilities for displaying data
 */

/**
 * Format a number as USD currency
 * @param value - Number to format or null
 * @returns Formatted currency string or '-' if null
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a date string
 * @param dateString - ISO date string or null
 * @returns Formatted date string or '-' if null
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format a datetime string
 * @param dateString - ISO datetime string
 * @returns Formatted datetime string
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Calculate days between created date and now
 * @param createdAt - ISO datetime string
 * @returns Number of days in pipeline
 */
export function getDaysInPipeline(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format a percentage value
 * @param value - Number to format or null
 * @returns Formatted percentage string or '-' if null
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${value}%`;
}

/**
 * Format a large number with abbreviations (K, M, B)
 * @param value - Number to format
 * @returns Abbreviated number string
 */
export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';

  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(value);
}
