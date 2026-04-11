import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date & Time ─────────────────────────────────────────────
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, hh:mm a');
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'hh:mm a');
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// ─── Currency ────────────────────────────────────────────────
export function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── String helpers ──────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length = 50): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

// ─── Phone validation ────────────────────────────────────────
export function formatPhonePK(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return '+92' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('92')) {
    return '+92' + cleaned;
  }
  return '+' + cleaned;
}

export function isValidPKPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^(92|0)?3[0-9]{9}$/.test(cleaned);
}

// ─── Rating ──────────────────────────────────────────────────
export function renderStars(rating: number): string {
  return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
}

// ─── File helpers ────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// ─── Generate time slots ─────────────────────────────────────
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMins: number
): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + durationMins <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    slots.push(`${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`);
    current += durationMins;
  }

  return slots;
}

// ─── Color for status ────────────────────────────────────────
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    confirmed: 'text-blue-600 bg-blue-50 border-blue-200',
    completed: 'text-green-600 bg-green-50 border-green-200',
    rejected: 'text-red-600 bg-red-50 border-red-200',
    cancelled: 'text-gray-600 bg-gray-50 border-gray-200',
    verified: 'text-green-600 bg-green-50 border-green-200',
    refunded: 'text-purple-600 bg-purple-50 border-purple-200',
  };
  return map[status] || 'text-gray-600 bg-gray-50 border-gray-200';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    verified: 'Verified',
    refunded: 'Refunded',
  };
  return map[status] || status;
}
