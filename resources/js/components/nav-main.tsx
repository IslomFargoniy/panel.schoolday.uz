import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavGroup, NavItem } from '@/types';

interface NavMainProps {
    items?: NavItem[];
    groups?: NavGroup[];
}

export function NavMain({ items, groups }: NavMainProps) {
    const { isCurrentUrl } = useCurrentUrl();
    const { t } = useTranslation();
    const { isMobile, setOpenMobile } = useSidebar();

    // If groups are provided, use them; otherwise, fallback to wrapping items in a single group
    const navGroups: NavGroup[] = groups ?? [
        {
            title: t('sidebar.platform', 'Platform'),
            items: items || [],
        },
    ];

    return (
        <div className="flex flex-col gap-2">
            {navGroups.map((group, groupIdx) => {
                if (!group.items || group.items.length === 0) return null;

                return (
                    <SidebarGroup
                        key={group.title || groupIdx}
                        className="px-2 py-0"
                    >
                        {group.title && (
                            <SidebarGroupLabel className="h-7 px-2 text-[11px] font-semibold tracking-wider text-sidebar-foreground/60 uppercase">
                                {group.title}
                            </SidebarGroupLabel>
                        )}
                        <SidebarMenu>
                            {group.items.map((item) => {
                                const active =
                                    item.isActive ?? isCurrentUrl(item.href);
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={active}
                                            tooltip={{ children: item.title }}
                                            className="h-9 rounded-lg text-[13px] font-medium transition-colors"
                                        >
                                            <Link
                                                href={item.href}
                                                onClick={() => {
                                                    if (isMobile) {
                                                        setOpenMobile(false);
                                                    }
                                                }}
                                            >
                                                {item.icon && (
                                                    <item.icon className="size-4 shrink-0" />
                                                )}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                );
            })}
        </div>
    );
}
