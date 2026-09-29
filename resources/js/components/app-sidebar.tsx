import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Folder,
    LayoutDashboard,
    Clock,
    GraduationCap,
    PieChart,
    Users,
    Building2,
    Building,
    Activity,
    BarChart3,
    UserCog,
    Github,
    Send,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const getMainNavItems = (t: any, user: any): NavItem[] => {
    const hasRole = (roleName: string) => {
        if (!user?.roles) return false;
        if (Array.isArray(user.roles)) {
            return user.roles.some((r: any) =>
                typeof r === 'string' ? r.toLowerCase() === roleName.toLowerCase() : r.name?.toLowerCase() === roleName.toLowerCase()
            );
        }
        return false;
    };

    const isAdmin = hasRole('Admin') || hasRole('Superadmin');

    const items: NavItem[] = [
        {
            title: t('sidebar.dashboard', 'Dashboard'),
            href: dashboard().url,
            icon: LayoutDashboard,
        },
    ];

    if (isAdmin) {
        items.push({
            title: t('sidebar.school', 'Maktablar'),
            href: '/school',
            icon: Building2,
        });
    }

    items.push(
        {
            title: t('sidebar.branches', 'Branches'),
            href: '/branches',
            icon: Building,
        },
        {
            title: t('sidebar.shifts', 'Shifts'),
            href: '/shifts',
            icon: Clock,
        },
        {
            title: t('sidebar.classes', 'Classes'),
            href: '/classes',
            icon: GraduationCap,
        },
        {
            title: t('sidebar.students', 'Students'),
            href: '/students',
            icon: Users,
        },
        {
            title: t('sidebar.reports', 'Reports'),
            href: '/reports',
            icon: BarChart3,
        },
        {
            title: t('sidebar.monitoring', 'Monitoring'),
            href: '/monitoring',
            icon: Activity,
        },
    );

    if (hasRole('Superadmin')) {
        items.push({
            title: t('sidebar.users', 'Users'),
            href: '/users',
            icon: UserCog,
        });
    }

    return items;
};

import { usePage } from '@inertiajs/react';

export function AppSidebar() {
    const { t } = useTranslation();
    const { auth } = usePage().props as unknown as { auth: { user: any } };
    const mainNavItems = getMainNavItems(t, auth?.user);

    const footerNavItems: NavItem[] = [
        {
            title: t('sidebar.repository', 'Repository'),
            href: 'https://github.com/IslomFargoniy',
            icon: Github,
        },
        {
            title: t('sidebar.telegram', 'Telegram'),
            href: 'https://t.me/IslomFargniy',
            icon: Send,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
