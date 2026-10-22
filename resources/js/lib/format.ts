/**
 * Display helpers, same rules as App\Support\Phone / App\Support\MacAddress on the server.
 */

/** "+998901234567" → "+998 90 123 45 67"; other countries "+" and groups of three; unknown values unchanged. */
export function formatPhone(value?: string | null): string {
    if (!value) return '';
    const trimmed = value.trim();
    const digits = trimmed.replace(/\D/g, '');
    let full: string | null = null;
    if (!trimmed.startsWith('+') && digits.length === 9) full = '998' + digits;
    else if (digits.startsWith('998')) full = digits.length === 12 ? digits : null;
    else if (digits.length >= 10 && digits.length <= 15) full = digits;
    if (!full) return value;
    if (full.startsWith('998')) {
        return `+998 ${full.slice(3, 5)} ${full.slice(5, 8)} ${full.slice(8, 10)} ${full.slice(10, 12)}`;
    }
    return '+' + (full.match(/.{1,3}/g) ?? []).join(' ');
}

/** While typing a MAC: hex digits only, upper case, a colon after every pair ("88de39" → "88:DE:39"). */
export function formatMacInput(value: string): string {
    const hex = value.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 12);
    return (hex.match(/.{1,2}/g) ?? []).join(':');
}
