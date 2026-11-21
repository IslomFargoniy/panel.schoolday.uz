import type { Auth } from '@/types/auth';
import type { IsupServer } from '@/types/branch';
import type { AndroidApp } from '@/types/ui';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            isupServer: IsupServer | null;
            androidApp: AndroidApp;
            [key: string]: unknown;
        };
    }
}

declare global {
    interface Window {
        __REVERB__?: {
            key?: string;
            host?: string;
            port?: number;
            scheme?: string;
        };
    }
}
