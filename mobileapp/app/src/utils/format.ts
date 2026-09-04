import type { UploadResultStatus } from '@/types/domain';

export function formatCurrency(amount: number, currency: 'INR' | 'USD') {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount);
}

export function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(iso));
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function getUploadResultLabel(status?: UploadResultStatus) {
  switch (status) {
    case 'accepted':
      return 'Accepted';
    case 'duplicate':
      return 'Duplicate';
    case 'possible_duplicate':
      return 'Possible duplicate';
    case 'processing':
      return 'Processing';
    case 'rejected':
      return 'Rejected';
    case 'failed':
      return 'Failed';
    default:
      return 'Pending';
  }
}
