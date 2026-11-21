import type { Auth } from '@/types/auth';
import type { IsupServer } from '@/types/branch';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            isupServer: IsupServer | null;
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
