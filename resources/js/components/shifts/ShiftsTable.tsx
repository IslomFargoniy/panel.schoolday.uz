import { Plus, Search, X, Pencil, Trash2 } from 'lucide-react';
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
    onCreate?: () => void;
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
    onCreate,
    onEdit,
    onDelete,
}: ShiftsTableProps) {
    const { t } = useTranslation();

    // Cascading: filter branches by selected school
    const filteredBranches = filterData.school_id
        ? branches.filter(
              (b) => String(b.school_id) === String(filterData.school_id),
          )
        : branches;

    const hasFilters = Boolean(
        filterData.school_id ||
        filterData.branch_id ||
        filterData.search ||
        filterData.per_page !== '20',
    );

    return (
        <div className="w-full space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-sidebar-border bg-card p-3 shadow-xs sm:flex-row sm:items-center dark:border-sidebar-border/70">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    {/* Foreign key: school_id */}
                    {schools.length > 0 && (
                        <div className="w-full sm:w-44">
                            <Select
                                value={filterData.school_id || 'all'}
                                onValueChange={(val) => {
                                    onFilterChange(
                                        'school_id',
                                        val === 'all' ? '' : val,
                                    );
                                    // Reset branch if it doesn't belong to the newly selected school
                                    if (val !== 'all' && filterData.branch_id) {
                                        const stillValid = branches.some(
                                            (b) =>
                                                String(b.id) ===
                                                    filterData.branch_id &&
                                                String(b.school_id) === val,
                                        );
                                        if (!stillValid) {
                                            onFilterChange('branch_id', '');
                                        }
                                    }
                                }}
                            >
                                <SelectTrigger className="h-9 rounded-xl text-xs">
                                    <SelectValue
                                        placeholder={t(
                                            'all_schools',
                                            'Barcha maktablar',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        {t('all_schools', 'Barcha maktablar')}
                                    </SelectItem>
                                    {schools.map((s) => (
                                        <SelectItem
                                            key={s.id}
                                            value={String(s.id)}
                                        >
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
                            onValueChange={(val) =>
                                onFilterChange(
                                    'branch_id',
                                    val === 'all' ? '' : val,
                                )
                            }
                        >
                            <SelectTrigger className="h-9 rounded-xl text-xs">
                                <SelectValue
                                    placeholder={t(
                                        'all_branches',
                                        'Barcha filiallar',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    {t(
                                        'all_branches',
                                        'Barcha filiallar',
                                    )}
                                </SelectItem>
                                {filteredBranches.map((b) => (
                                    <SelectItem key={b.id} value={String(b.id)}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search by shift name */}
                    <div className="relative min-w-[160px] flex-1">
                        <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={filterData.search || ''}
                            onChange={(e) =>
                                onFilterChange('search', e.target.value)
                            }
                            placeholder={t(
                                'search_shift',
                                'Smenani qidirish...',
                            )}
                            className="h-9 rounded-xl pl-8 text-xs"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {hasFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onResetFilters}
                            className="h-9 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                            <span>{t('cancel', 'Tozalash')}</span>
                        </Button>
                    )}

                    <Select
                        value={filterData.per_page || '20'}
                        onValueChange={(val) => onFilterChange('per_page', val)}
                    >
                        <SelectTrigger className="h-9 w-[110px] rounded-xl text-xs">
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

                    {onCreate && (
                        <Button
                            onClick={onCreate}
                            size="sm"
                            className="h-9 shrink-0 gap-1.5 rounded-xl font-medium shadow-xs"
                        >
                            <Plus className="h-4 w-4 shrink-0" />
                            <span>{t('create', 'Yaratish')}</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="relative overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-sidebar-border/70">
                <div className="max-w-full min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                        <thead className="border-b bg-muted/50 text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-4 py-3.5 font-medium sm:px-6 sm:py-4">
                                    {t('shifts.details', 'Shift Details')}
                                </th>
                                <th className="px-4 py-3.5 font-medium sm:px-6 sm:py-4">
                                    {t('shifts.branch', 'Branch')}
                                </th>
                                <th className="px-4 py-3.5 font-medium sm:px-6 sm:py-4">
                                    {t('shifts.capacity', 'Capacity')}
                                </th>
                                <th className="px-4 py-3.5 font-medium sm:px-6 sm:py-4">
                                    {t(
                                        'shifts.today_attendance',
                                        "Today's Attendance",
                                    )}
                                </th>
                                <th className="px-4 py-3.5 text-right font-medium sm:px-6 sm:py-4">
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
                                                    <span className="mt-0.5 text-[11px] text-muted-foreground">
                                                        {
                                                            shift.branch.school
                                                                .name
                                                        }
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
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => onEdit(shift)}
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                title={t('shifts.edit', 'Edit')}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() =>
                                                    onDelete(shift.id)
                                                }
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                title={t(
                                                    'shifts.delete',
                                                    'Delete',
                                                )}
                                            >
                                                <Trash2 className="h-4 w-4" />
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
