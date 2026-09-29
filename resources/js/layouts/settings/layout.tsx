import { Link } from '@inertiajs/react';
import { Lock, Palette, Shield, Sliders, User } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import type { NavItem } from '@/types';

const getSidebarNavItems = (t: any): NavItem[] => [
    {
        title: t('settings.profile', 'Profile'),
        href: edit(),
        icon: User,
    },
    {
        title: t('settings.password', 'Password'),
        href: editPassword(),
        icon: Lock,
    },
    {
        title: t('settings.two_factor', 'Two-Factor Auth'),
        href: show(),
        icon: Shield,
    },
    {
        title: t('settings.system', 'System Settings'),
        href: '/settings/system',
        icon: Sliders,
    },
    {
        title: t('settings.appearance', 'Appearance'),
        href: editAppearance(),
        icon: Palette,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentUrl } = useCurrentUrl();
    const { t } = useTranslation();
    const sidebarNavItems = getSidebarNavItems(t);

    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <Heading
                title={t('sidebar.settings', 'Settings')}
                description={t(
                    'settings.manage',
                    'Manage your profile and account settings',
                )}
            />

            <div className="mt-6 flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-10">
                {/* Mobile Tabs & Desktop Sidebar */}
                <aside className="w-full shrink-0 lg:w-56">
                    <nav className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/60 bg-slate-100/90 p-1 sm:gap-2 lg:flex-col lg:items-stretch lg:space-y-1.5 lg:border-none lg:bg-transparent lg:p-0 dark:border-slate-800/60 dark:bg-slate-800/80">
                        {sidebarNavItems.map((item, index) => {
                            const isActive = isCurrentUrl(item.href);
                            const Icon = item.icon;
                            return (
                                <Button
                                    key={`${toUrl(item.href)}-${index}`}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn(
                                        'flex-1 cursor-pointer justify-center rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all lg:w-full lg:justify-start lg:px-3 lg:py-2.5',
                                        isActive
                                            ? 'bg-white font-bold text-indigo-600 shadow-xs lg:bg-indigo-50/80 lg:text-indigo-600 dark:bg-slate-900 dark:text-indigo-400 dark:lg:bg-indigo-950/40 dark:lg:text-indigo-400'
                                            : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white',
                                    )}
                                >
                                    <Link
                                        href={item.href}
                                        prefetch
                                        className="flex items-center justify-center gap-2 lg:justify-start"
                                    >
                                        {Icon && (
                                            <Icon
                                                className={cn(
                                                    'h-4 w-4 shrink-0',
                                                    isActive
                                                        ? 'text-indigo-600 dark:text-indigo-400'
                                                        : 'text-slate-400 dark:text-slate-500',
                                                )}
                                            />
                                        )}
                                        <span>{item.title}</span>
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Settings Content */}
                <div className="flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-8">{children}</section>
                </div>
            </div>
        </div>
    );
}
