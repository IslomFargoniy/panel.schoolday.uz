import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { Toaster } from '@/components/ui/sonner';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { t } = useTranslation();
    const { flash } = usePage<any>().props;

    useEffect(() => {
        const renderFlashMessage = (flashVal: any): string | null => {
            if (!flashVal) return null;
            if (typeof flashVal === 'object' && flashVal.key) {
                return String(t(flashVal.key, flashVal.params || {}));
            }
            if (typeof flashVal === 'string') {
                return String(t(flashVal));
            }
            return String(flashVal);
        };

        if (flash?.success) {
            const msg = renderFlashMessage(flash.success);
            if (msg) toast.success(msg);
        }
        if (flash?.error) {
            const msg = renderFlashMessage(flash.error);
            if (msg) toast.error(msg);
        }
    }, [flash, t]);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            <Toaster richColors position="bottom-right" />
        </AppShell>
    );
}
