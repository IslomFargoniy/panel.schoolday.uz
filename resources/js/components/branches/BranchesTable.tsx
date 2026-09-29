import { ScanFace } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface BranchesTableProps {
    branches: any;
    perPage: string;
    onPerPageChange: (val: string) => void;
    onEdit: (branch: any) => void;
    onDelete: (id: number) => void;
    onManageDevices: (branch: any) => void;
}

export function BranchesTable({
    branches,
    perPage,
    onPerPageChange,
    onEdit,
    onDelete,
    onManageDevices,
}: BranchesTableProps) {
    const { t } = useTranslation();

    return (
        <div className="xl:col-span-3">
            <div className="mb-4 flex justify-end">
                <Select value={perPage} onValueChange={onPerPageChange}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="20">
                            20 {t('common.items', 'ta')}
                        </SelectItem>
                        <SelectItem value="50">
                            50 {t('common.items', 'ta')}
                        </SelectItem>
                        <SelectItem value="100">
                            100 {t('common.items', 'ta')}
                        </SelectItem>
                        <SelectItem value="all">
                            {t('common.all', 'Barchasi')}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-sidebar-border/70">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/50 text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">
                                    {t('branches.details', 'Branch Details')}
                                </th>
                                <th className="px-6 py-4 font-medium">
                                    {t('branches.devices', 'Qurilmalar')}
                                </th>
                                <th className="px-6 py-4 font-medium">
                                    {t('branches.capacity', 'Capacity')}
                                </th>
                                <th className="px-6 py-4 font-medium">
                                    {t(
                                        'branches.today_attendance',
                                        "Today's Attendance",
                                    )}
                                </th>
                                <th className="px-6 py-4 text-right font-medium">
                                    {t('branches.actions', 'Actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-card-foreground">
                            {branches.data.map((branch: any) => (
                                <tr
                                    key={branch.id}
                                    className="transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-base font-medium">
                                                {branch.name}
                                            </span>
                                            <span className="mt-0.5 text-xs text-muted-foreground">
                                                {branch.description || '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {branch.devices &&
                                        branch.devices.length > 0 ? (
                                            <div className="flex flex-col gap-1.5">
                                                {branch.devices.map(
                                                    (dev: any) => (
                                                        <div
                                                            key={dev.id}
                                                            className="flex flex-wrap items-center gap-1.5"
                                                        >
                                                            <span
                                                                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                                                    dev.connection_type ===
                                                                    'isup'
                                                                        ? 'border border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                                                        : 'border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                                }`}
                                                            >
                                                                {dev.connection_type ===
                                                                'isup'
                                                                    ? 'ISUP 5.0'
                                                                    : 'HTTP'}
                                                            </span>
                                                            <span
                                                                className={`inline-block h-2 w-2 rounded-full ${
                                                                    dev.is_online
                                                                        ? 'animate-pulse bg-emerald-500 ring-2 ring-emerald-500/30'
                                                                        : 'bg-rose-400'
                                                                }`}
                                                                title={
                                                                    dev.is_online
                                                                        ? 'Online'
                                                                        : 'Offline'
                                                                }
                                                            />
                                                            <span className="font-mono text-xs text-foreground">
                                                                {dev.name ||
                                                                    dev.mac_address}
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        ) : branch.mac_address_list &&
                                          branch.mac_address_list.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {branch.mac_address_list.map(
                                                    (mac: string) => (
                                                        <span
                                                            key={mac}
                                                            className="rounded bg-muted px-2 py-0.5 font-mono text-xs"
                                                        >
                                                            {mac}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs">
                                            <span className="flex items-center gap-1.5">
                                                <strong className="text-foreground">
                                                    {branch.shifts_count || 0}
                                                </strong>{' '}
                                                {t(
                                                    'branches.shifts_count',
                                                    'Shifts',
                                                )}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <strong className="text-foreground">
                                                    {branch.classes_count || 0}
                                                </strong>{' '}
                                                {t('shifts.classes', 'Classes')}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <strong className="text-foreground">
                                                    {branch.total_students || 0}
                                                </strong>{' '}
                                                {t(
                                                    'shifts.students',
                                                    'Students',
                                                )}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 ring-1 ring-emerald-500/20 ring-inset">
                                                {t(
                                                    'classes.present_today',
                                                    'P',
                                                )}
                                                : {branch.present_students || 0}
                                            </span>
                                            <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600 ring-1 ring-blue-500/20 ring-inset">
                                                {t('classes.on_time', 'T')}:{' '}
                                                {branch.on_time_students || 0}
                                            </span>
                                            <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600 ring-1 ring-amber-500/20 ring-inset">
                                                {t('classes.late', 'L')}:{' '}
                                                {branch.late_students || 0}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="flex flex-wrap items-center justify-end gap-2 px-6 py-4 text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                onManageDevices(branch)
                                            }
                                            className="gap-1.5 border-indigo-200 text-xs text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                                        >
                                            <ScanFace className="h-3.5 w-3.5" />
                                            <span>
                                                {t(
                                                    'branches.devices',
                                                    'Qurilmalar',
                                                )}{' '}
                                                (
                                                {branch.devices?.length ||
                                                    branch.mac_address_list
                                                        ?.length ||
                                                    0}
                                                )
                                            </span>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => onEdit(branch)}
                                        >
                                            {t('branches.edit', 'Edit')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => onDelete(branch.id)}
                                        >
                                            {t('branches.delete', 'Delete')}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {branches.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-8 text-center text-muted-foreground"
                                    >
                                        {t(
                                            'branches.no_results',
                                            'No branches found. Create one to get started.',
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="border-t p-4">
                    <Pagination links={branches.links} />
                </div>
            </div>
        </div>
    );
}
