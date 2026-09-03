/**
 * Clean CPF removing non-digits
 */
export function cleanDigits(value: string): string {
  return (value || '').toString().replace(/\D/g, '');
}

/**
 * Normalizes CPF digits to exactly 11 numeric characters, adding leading zeros if needed
 * (Crucial for CPFs starting with 0 that may have been stored as numbers or lost leading zero)
 */
export function normalizeCpf(value: string): string {
  const digits = cleanDigits(value);
  if (!digits) return '';
  if (digits.length <= 11) {
    return digits.padStart(11, '0');
  }
  return digits.slice(0, 11);
}

/**
 * Format string to Brazilian CPF mask: 000.000.000-00
 */
export function formatCPF(value: string): string {
  const digits = cleanDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

/**
 * Formats a complete CPF, guaranteeing 11 digits with leading zeros
 */
export function formatCompleteCPF(value: string): string {
  const normalized = normalizeCpf(value);
  if (!normalized) return '';
  return formatCPF(normalized);
}

/**
 * Validates Brazilian CPF with algorithm (check digits calculation)
 */
export function isValidCPF(cpf: string): boolean {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return false;

  // Check known invalid sequence (all same digits)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digits.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digits.charAt(10), 10)) return false;

  return true;
}

/**
 * Format Phone number mask: (00) 00000-0000 or (00) 0000-0000
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Gets current YYYY-MM-DD formatted specifically in America/Sao_Paulo timezone
 */
export function getSaoPauloDateString(d: Date | string = new Date()): string {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(dateObj);
  
  const year = parts.find(p => p.type === 'year')?.value || '2026';
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const day = parts.find(p => p.type === 'day')?.value || '01';
  return `${year}-${month}-${day}`;
}

/**
 * Gets local timestamp string in format "YYYY-MM-DD HH:MM:SS" (without timezone offset)
 * Prevents PostgreSQL TIMESTAMP WITHOUT TIME ZONE from adding UTC +3h offsets
 */
export function getSaoPauloTimestampString(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  let hour = getPart('hour');
  if (hour === '24') hour = '00';
  const minute = getPart('minute');
  const second = getPart('second');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * Gets ISO timestamp string standardized in America/Sao_Paulo timezone with -03:00 offset
 */
export function getSaoPauloISOString(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  let hour = getPart('hour');
  if (hour === '24') hour = '00';
  const minute = getPart('minute');
  const second = getPart('second');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}-03:00`;
}

/**
 * Generates formatted attendance protocol (e.g., ATD-20260830-8492) using São Paulo local date
 */
export function generateProtocolo(): string {
  const dateStr = getSaoPauloDateString(new Date()).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ATD-${dateStr}-${randomSuffix}`;
}

/**
 * Gets local YYYY-MM-DD date string in São Paulo timezone avoiding UTC shifts
 */
export function getLocalDateString(d: Date = new Date()): string {
  return getSaoPauloDateString(d);
}

/**
 * Extracts normalized YYYY-MM-DD in São Paulo timezone from any date string
 */
export function extractLocalDateOnly(dateStr?: string): string {
  if (!dateStr) return '';
  // If already standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return dateStr.slice(0, 10);
  }
  return getSaoPauloDateString(d);
}

/**
 * Format Date/Time to Brazilian standard string: DD/MM/AAAA HH:MM in São Paulo timezone (America/Sao_Paulo)
 */
export function formatDateTimeBR(isoString?: string | Date, includeSeconds: boolean = false): string {
  if (!isoString) return '-';
  
  if (typeof isoString === 'string') {
    const trimmed = isoString.trim();
    // Check if it's already in pure local format without timezone offset (e.g. "2026-08-30 14:41:15" or "2026-08-30T14:41:15")
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (match) {
      const [, y, m, d, h, min, sec] = match;
      return includeSeconds && sec ? `${d}/${m}/${y} ${h}:${min}:${sec}` : `${d}/${m}/${y} ${h}:${min}`;
    }
  }

  const d = typeof isoString === 'string' ? new Date(isoString) : isoString;
  if (isNaN(d.getTime())) return typeof isoString === 'string' ? isoString : '-';
  
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
  }).format(d);
}

/**
 * Format Date to Brazilian standard string: DD/MM/AAAA in São Paulo timezone (America/Sao_Paulo)
 */
export function formatDateBR(dateStr?: string | Date): string {
  if (!dateStr) return '-';
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '-';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Generates an RFC4122 compliant UUID v4 string
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
