import type { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(dateInput?: string | Date | null): string {
    if (!dateInput) return '—';
    if (typeof dateInput === 'string') {
        const trimmed = dateInput.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed;
        }
        if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
            return trimmed.slice(0, 10);
        }
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput.slice(0, 10) : '—';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format datetime as YYYY-MM-DD HH:mm:ss
 */
export function formatDateTime(dateInput?: string | Date | null): string {
    if (!dateInput) return '—';
    if (typeof dateInput === 'string') {
        const trimmed = dateInput.trim();
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
            return trimmed;
        }
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
