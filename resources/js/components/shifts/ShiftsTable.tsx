import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ShiftsTableProps {
    shifts: any;
    schools?: { id: number; name: string }[];
    branches?: { id: number; name: string; school_id?: number }[];
    filterData: {
        school_id?: string;
        branch_id?: string;
        search?: string;
        per_page: string;
    };
    onFilterChange: (key: string, value: string) => void;
    onResetFilters: () => void;
    onEdit: (shift: any) => void;
    onDelete: (id: number) => void;
}

export function ShiftsTable({
    shifts,
    schools = [],
    branches = [],
    filterData,
    onFilterChange,
    onResetFilters,
    onEdit,
    onDelete,
}: ShiftsTableProps) {
    const { t } = useTranslation();

    // Cascading: filter branches by selected school
    const filteredBranches = filterData.school_id
        ? branches.filter((b) => String(b.school_id) === String(filterData.school_id))
        : branches;

    const hasFilters = Boolean(
        filterData.school_id || filterData.branch_id || filterData.search || filterData.per_page !== '20'
    );

    return (
        <div className="lg:col-span-2 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-sidebar-border bg-card p-3 shadow-xs dark:border-sidebar-border/70">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                    {/* Foreign key: school_id */}
                    {schools.length > 0 && (
                        <div className="w-full sm:w-44">
                            <Select
                                value={filterData.school_id || 'all'}
                                onValueChange={(val) => {
                                    onFilterChange('school_id', val === 'all' ? '' : val);
                                    // Reset branch if it doesn't belong to the newly selected school
                                    if (val !== 'all' && filterData.branch_id) {
                                        const stillValid = branches.some(
                                            (b) => String(b.id) === filterData.branch_id && String(b.school_id) === val
                                        );
                                        if (!stillValid) {
                                            onFilterChange('branch_id', '');
                                        }
                                    }
                                }}
                            >
                                <SelectTrigger className="h-9 text-xs rounded-xl">
                                    <SelectValue placeholder={t('select_school', 'Barcha maktablar')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('select_school', 'Barcha maktablar')}</SelectItem>
                                    {schools.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Foreign key: branch_id */}
                    <div className="w-full sm:w-44">
                        <Select
                            value={filterData.branch_id || 'all'}
                            onValueChange={(val) => onFilterChange('branch_id', val === 'all' ? '' : val)}
                        >
                            <SelectTrigger className="h-9 text-xs rounded-xl">
                                <SelectValue placeholder={t('branches.select_branch', 'Barcha filiallar')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('branches.select_branch', 'Barcha filiallar')}</SelectItem>
                                {filteredBranches.map((b) => (
                                    <SelectItem key={b.id} value={String(b.id)}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search by shift name */}
                    <div className="relative flex-1 min-w-[160px]">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={filterData.search || ''}
                            onChange={(e) => onFilterChange('search', e.target.value)}
                            placeholder={t('search_shift', 'Smenani qidirish...')}
                            className="h-9 pl-8 text-xs rounded-xl"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {hasFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onResetFilters}
                            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>{t('cancel', 'Tozalash')}</span>
                        </Button>
                    )}

                    <Select
                        value={filterData.per_page || '20'}
                        onValueChange={(val) => onFilterChange('per_page', val)}
                    >
                        <SelectTrigger className="w-[110px] h-9 text-xs rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="20">20 {t('common.items', 'ta')}</SelectItem>
                            <SelectItem value="50">50 {t('common.items', 'ta')}</SelectItem>
                            <SelectItem value="100">100 {t('common.items', 'ta')}</SelectItem>
                            <SelectItem value="all">{t('common.all', 'Barchasi')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="relative overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-sidebar-border/70">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/50 text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">
                                    {t('shifts.details', 'Shift Details')}
                                </th>
                                <th className="px-6 py-4 font-medium">
                                    {t('shifts.branch', 'Branch')}
                                </th>
                                <th className="px-6 py-4 font-medium">
                                    {t('shifts.capacity', 'Capacity')}
                                </th>
                                <th className="px-6 py-4 font-medium">
                                    {t(
                                        'shifts.today_attendance',
                                        "Today's Attendance",
                                    )}
                                </th>
                                <th className="px-6 py-4 text-right font-medium">
                                    {t('shifts.actions', 'Actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-card-foreground">
                            {shifts.data.map((shift: any) => (
                                <tr
                                    key={shift.id}
                                    className="transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-base font-medium">
                                                {shift.name}
                                            </span>
                                            <span className="mt-0.5 text-xs text-muted-foreground">
                                                {shift.start_time.substring(
                                                    0,
                                                    5,
                                                )}{' '}
                                                -{' '}
                                                {shift.end_time.substring(0, 5)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {shift.branch ? (
                                            <div className="flex flex-col">
                                                <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 ring-1 ring-zinc-500/20 ring-inset dark:bg-zinc-800 dark:text-zinc-200">
                                                    {shift.branch.name}
                                                </span>
                                                {shift.branch.school && (
                                                    <span className="text-[11px] text-muted-foreground mt-0.5">
                                                        {shift.branch.school.name}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs">
                                            <span className="flex items-center gap-1.5">
                                                <strong className="text-foreground">
                                                    {shift.classes_count || 0}
                                                </strong>{' '}
                                                {t('shifts.classes', 'Classes')}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <strong className="text-foreground">
                                                    {shift.total_students || 0}
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
                                                : {shift.present_students || 0}
                                            </span>
                                            <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600 ring-1 ring-blue-500/20 ring-inset">
                                                {t('classes.on_time', 'T')}:{' '}
                                                {shift.on_time_students || 0}
                                            </span>
                                            <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600 ring-1 ring-amber-500/20 ring-inset">
                                                {t('classes.late', 'L')}:{' '}
                                                {shift.late_students || 0}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => onEdit(shift)}
                                            >
                                                {t('shifts.edit', 'Edit')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() =>
                                                    onDelete(shift.id)
                                                }
                                            >
                                                {t('shifts.delete', 'Delete')}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {shifts.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-8 text-center text-muted-foreground"
                                    >
                                        {t(
                                            'shifts.no_results',
                                            'No shifts found. Create one to get started.',
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="border-t p-4">
                    <Pagination links={shifts.links} />
                </div>
            </div>
        </div>
    );
}
