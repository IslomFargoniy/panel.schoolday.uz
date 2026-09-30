import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ClassFiltersProps {
    filterData: {
        school_id?: string;
        branch_id?: string;
        shift_id?: string;
        search?: string;
        per_page: string;
    };
    schools?: { id: number; name: string }[];
    branches?: { id: number; name: string; school_id?: number }[];
    shifts?: { id: number; name: string; branch_id?: number; start_time?: string; end_time?: string }[];
    onFilterChange: (key: string, value: string) => void;
    onReset: () => void;
}

export function ClassFilters({
    filterData,
    schools = [],
    branches = [],
    shifts = [],
    onFilterChange,
    onReset,
}: ClassFiltersProps) {
    const { t } = useTranslation();

    // Cascading Branches by selected School
    const filteredBranches = filterData.school_id
        ? branches.filter((b) => String(b.school_id) === String(filterData.school_id))
        : branches;

    // Cascading Shifts by selected Branch or School
    const filteredShifts = shifts.filter((s) => {
        if (filterData.branch_id) {
            return String(s.branch_id) === String(filterData.branch_id);
        }
        if (filterData.school_id) {
            const branchIds = filteredBranches.map((b) => b.id);
            return s.branch_id && branchIds.includes(s.branch_id);
        }
        return true;
    });

    const hasActiveFilters = Boolean(
        filterData.school_id ||
        filterData.branch_id ||
        filterData.shift_id ||
        filterData.search ||
        filterData.per_page !== '20'
    );

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-sidebar-border bg-card p-3 shadow-xs dark:border-sidebar-border/70">
            <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* School Filter */}
                {schools.length > 0 && (
                    <div className="w-full sm:w-40">
                        <Select
                            value={filterData.school_id || 'all'}
                            onValueChange={(val) => {
                                const newSchool = val === 'all' ? '' : val;
                                onFilterChange('school_id', newSchool);
                                if (newSchool && filterData.branch_id) {
                                    const validBranch = branches.some(
                                        (b) => String(b.id) === filterData.branch_id && String(b.school_id) === newSchool
                                    );
                                    if (!validBranch) {
                                        onFilterChange('branch_id', '');
                                        onFilterChange('shift_id', '');
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

                {/* Branch Filter */}
                <div className="w-full sm:w-40">
                    <Select
                        value={filterData.branch_id || 'all'}
                        onValueChange={(val) => {
                            const newBranch = val === 'all' ? '' : val;
                            onFilterChange('branch_id', newBranch);
                            if (newBranch && filterData.shift_id) {
                                const validShift = shifts.some(
                                    (s) => String(s.id) === filterData.shift_id && String(s.branch_id) === newBranch
                                );
                                if (!validShift) {
                                    onFilterChange('shift_id', '');
                                }
                            }
                        }}
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

                {/* Shift Filter */}
                <div className="w-full sm:w-40">
                    <Select
                        value={filterData.shift_id || 'all'}
                        onValueChange={(val) => onFilterChange('shift_id', val === 'all' ? '' : val)}
                    >
                        <SelectTrigger className="h-9 text-xs rounded-xl">
                            <SelectValue placeholder={t('classes.all_shifts', 'Barcha smenalar')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('classes.all_shifts', 'Barcha smenalar')}</SelectItem>
                            {filteredShifts.map((shift) => (
                                <SelectItem key={shift.id} value={String(shift.id)}>
                                    {shift.name} {shift.start_time ? `(${shift.start_time.substring(0, 5)})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[140px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={filterData.search || ''}
                        onChange={(e) => onFilterChange('search', e.target.value)}
                        placeholder={t('classes.search', 'Sinfni qidirish...')}
                        className="h-9 pl-8 text-xs rounded-xl"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                {hasActiveFilters && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
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
    );
}
