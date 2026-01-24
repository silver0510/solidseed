/**
 * CSV export utility for deals
 * Uses Papa Parse to generate CSV from deal data
 */

import Papa from 'papaparse';
import type { Deal } from '@/lib/types/deals';

interface CSVRow {
  'Deal Name': string;
  'Client': string;
  'Deal Type': string;
  'Stage': string;
  'Status': string;
  'Deal Value': string;
  'Commission Rate': string;
  'Commission Amount': string;
  'Agent Commission': string;
  'Expected Close': string;
  'Actual Close': string;
  'Days in Pipeline': string;
  'Referral Source': string;
  'Created': string;
  'Updated': string;
}

/**
 * Export deals to CSV file
 * @param deals - Array of deals to export (max 1000)
 * @param filename - Optional filename (defaults to deals-export-{date}.csv)
 */
export function exportDealsToCSV(deals: Deal[], filename?: string): void {
  // Limit to 1000 rows
  const dealsToExport = deals.slice(0, 1000);

  // Transform deals to CSV rows
  const csvRows: CSVRow[] = dealsToExport.map((deal) => ({
    'Deal Name': deal.deal_name,
    'Client': deal.client?.name || deal.client_id,
    'Deal Type': deal.deal_type?.type_name || deal.deal_type_id,
    'Stage': deal.current_stage,
    'Status': deal.status,
    'Deal Value': formatCurrency(deal.deal_value),
    'Commission Rate': formatPercentage(deal.commission_rate),
    'Commission Amount': formatCurrency(deal.commission_amount),
    'Agent Commission': formatCurrency(deal.agent_commission),
    'Expected Close': formatDate(deal.expected_close_date),
    'Actual Close': formatDate(deal.actual_close_date),
    'Days in Pipeline': deal.days_in_pipeline?.toString() || '',
    'Referral Source': deal.referral_source || '',
    'Created': formatDateTime(deal.created_at),
    'Updated': formatDateTime(deal.updated_at),
  }));

  // Generate CSV
  const csv = Papa.unparse(csvRows);

  // Create and trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const finalFilename = filename || `deals-export-${formatDateForFilename(new Date())}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper functions

function formatCurrency(value: number | null): string {
  if (value === null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number | null): string {
  if (value === null) return '';
  return `${value}%`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
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

function formatDateTime(dateString: string): string {
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

function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
