import { usePage } from '@inertiajs/react';
import type { IsupServer } from '@/types';

const FALLBACK: IsupServer = {
    ip: '193.180.213.188',
    domain: 'panel.schoolday.uz',
    port: 7670,
};

/** Where an ISUP terminal connects to (shared by HandleInertiaRequests). */
export function useIsupServer(): IsupServer {
    return usePage().props.isupServer ?? FALLBACK;
}
