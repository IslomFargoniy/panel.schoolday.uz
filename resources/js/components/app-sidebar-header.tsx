import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Breadcrumbs } from '@/components/breadcrumbs';
import LanguageBar from '@/components/language';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-40 flex h-14 w-full max-w-full min-w-0 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 backdrop-blur-md sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex min-w-0 items-center gap-2 truncate">
                <SidebarTrigger className="-ml-1 shrink-0 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" />
                <div className="min-w-0 truncate">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <LanguageBar />
                <AppearanceToggleDropdown />
            </div>
        </header>
    );
}
