import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Activity,
    BarChart3,
    Building2,
    Building,
    Clock,
    GraduationCap,
    Users,
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
    useSidebar,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavGroup, NavItem } from '@/types';
import AppLogo from './app-logo';

const getNavGroups = (t: any, user: any): NavGroup[] => {
    const hasRole = (roleName: string) => {
        if (!user?.roles) return false;
        if (Array.isArray(user.roles)) {
            return user.roles.some((r: any) =>
                typeof r === 'string'
                    ? r.toLowerCase() === roleName.toLowerCase()
                    : r.name?.toLowerCase() === roleName.toLowerCase()
            );
        }
        return false;
    };

    const isAdmin = hasRole('Admin') || hasRole('Superadmin');
    const isSuperadmin = hasRole('Superadmin');

    const groups: NavGroup[] = [];

    // 1. Asosiy bo'lim (Umumiy ko'rinish, jonli monitoring va davomat tahlillari)
    groups.push({
        title: t('sidebar.group_overview', 'Asosiy'),
        items: [
            {
                title: t('sidebar.dashboard', 'Bosh sahifa'),
                href: dashboard().url,
                icon: LayoutDashboard,
            },
            {
                title: t('sidebar.monitoring', 'Monitoring'),
                href: '/monitoring',
                icon: Activity,
            },
            {
                title: t('sidebar.reports', 'Hisobotlar'),
                href: '/reports',
                icon: BarChart3,
            },
        ],
    });

    // 2. Ta'lim tuzilmasi (Iyerarxiya: Maktab -> Filial -> Smena -> Sinf -> O'quvchi)
    const educationItems: NavItem[] = [];

    if (isAdmin) {
        educationItems.push({
            title: t('sidebar.school', 'Maktablar'),
            href: '/school',
            icon: Building2,
        });
    }

    educationItems.push(
        {
            title: t('sidebar.branches', 'Filiallar'),
            href: '/branches',
            icon: Building,
        },
        {
            title: t('sidebar.shifts', 'Smenalar'),
            href: '/shifts',
            icon: Clock,
        },
        {
            title: t('sidebar.classes', 'Sinflar'),
            href: '/classes',
            icon: GraduationCap,
        },
        {
            title: t('sidebar.students', 'O‘quvchilar'),
            href: '/students',
            icon: Users,
        },
    );

    groups.push({
        title: t('sidebar.group_education', 'Ta’lim tuzilmasi'),
        items: educationItems,
    });

    // 3. Tizim va boshqaruv (Foydalanuvchilar va ruxsatlar)
    const systemItems: NavItem[] = [];

    if (isSuperadmin) {
        systemItems.push({
            title: t('sidebar.users', 'Foydalanuvchilar'),
            href: '/users',
            icon: UserCog,
        });
    }

    if (systemItems.length > 0) {
        groups.push({
            title: t('sidebar.group_system', 'Tizim'),
            items: systemItems,
        });
    }

    return groups;
};

export function AppSidebar() {
    const { t } = useTranslation();
    const { auth } = usePage().props as unknown as { auth: { user: any } };
    const { isMobile, setOpenMobile } = useSidebar();
    const navGroups = getNavGroups(t, auth?.user);

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
                            <Link
                                href={dashboard().url}
                                onClick={() => {
                                    if (isMobile) {
                                        setOpenMobile(false);
                                    }
                                }}
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
