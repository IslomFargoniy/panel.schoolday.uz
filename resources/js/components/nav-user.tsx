import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';

export function NavUser() {
    const { auth } = usePage().props;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="flex max-w-[250px] items-center gap-2 rounded-lg border border-transparent p-1 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:px-2 md:py-1.5"
                    data-test="sidebar-menu-button"
                >
                    <UserInfo user={auth.user} />
                    <ChevronsUpDown className="ml-1 hidden size-4 shrink-0 text-muted-foreground md:block" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 rounded-lg"
                align="end"
                side="bottom"
                sideOffset={10}
            >
                <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
