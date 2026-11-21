import type { ReactNode } from 'react';
import type { BreadcrumbItem } from './navigation';

export type AppLayoutProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

export type AuthLayoutProps = {
    children?: ReactNode;
    name?: string;
    title?: string;
    description?: string;
};

/** Shared prop: the Android APK published at /downloads/schoolday.apk (version from public/downloads/version.json). */
export type AndroidApp = {
    version: string | null;
    url: string;
};
