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

interface FilterData {
    school_id?: string;
    branch_id?: string;
    shift_id?: string;
    class_id?: string;
    status?: string;
    search?: string;
    per_page: string;
}

interface StudentFiltersProps {
    filterData: FilterData;
    schools?: { id: number; name: string }[];
    branches?: { id: number; name: string; school_id?: number }[];
    shifts?: { id: number; name: string; branch_id?: number }[];
    classes?: { id: number; name: string; shift_id?: number }[];
    onFilterChange: (key: string, value: string) => void;
    onClear: () => void;
}

export function StudentFilters({
    filterData,
    schools = [],
    branches = [],
    shifts = [],
    classes = [],
    onFilterChange,
    onClear,
}: StudentFiltersProps) {
    const { t } = useTranslation();

    // Cascading branches
    const filteredBranches = filterData.school_id
        ? branches.filter(
              (b) => String(b.school_id) === String(filterData.school_id),
          )
        : branches;

    const branchIds = filteredBranches.map((b) => b.id);

    // Cascading shifts
    const filteredShifts = shifts.filter((s) => {
        if (filterData.branch_id) {
            return String(s.branch_id) === String(filterData.branch_id);
        }
        if (filterData.school_id) {
            return s.branch_id && branchIds.includes(s.branch_id);
        }
        return true;
    });

    const shiftIds = filteredShifts.map((s) => s.id);

    // Cascading classes
    const filteredClasses = classes.filter((c) => {
        if (filterData.shift_id) {
            return String(c.shift_id) === String(filterData.shift_id);
        }
        if (filterData.branch_id || filterData.school_id) {
            return c.shift_id && shiftIds.includes(c.shift_id);
        }
        return true;
    });

    const hasActiveFilters = Boolean(
        filterData.school_id ||
        filterData.branch_id ||
        filterData.shift_id ||
        filterData.class_id ||
        filterData.status ||
        filterData.search ||
        filterData.per_page !== '20',
    );

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-sidebar-border bg-card p-3 shadow-xs dark:border-sidebar-border/70">
            {/* Top row: Cascading foreign key dropdowns */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                {/* 1. School (Maktab) */}
                {schools.length > 0 && (
                    <Select
                        value={filterData.school_id || 'all'}
                        onValueChange={(val) => {
                            const newSchool = val === 'all' ? '' : val;
                            onFilterChange('school_id', newSchool);
                            if (newSchool && filterData.branch_id) {
                                const validBranch = branches.some(
                                    (b) =>
                                        String(b.id) === filterData.branch_id &&
                                        String(b.school_id) === newSchool,
                                );
                                if (!validBranch) {
                                    onFilterChange('branch_id', '');
                                    onFilterChange('shift_id', '');
                                    onFilterChange('class_id', '');
                                }
                            }
                        }}
                    >
                        <SelectTrigger className="h-9 rounded-xl text-xs">
                            <SelectValue
                                placeholder={t(
                                    'select_school',
                                    'Barcha maktablar',
                                )}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                {t('select_school', 'Barcha maktablar')}
                            </SelectItem>
                            {schools.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* 2. Branch (Filial) */}
                <Select
                    value={filterData.branch_id || 'all'}
                    onValueChange={(val) => {
                        const newBranch = val === 'all' ? '' : val;
                        onFilterChange('branch_id', newBranch);
                        if (newBranch && filterData.shift_id) {
                            const validShift = shifts.some(
                                (s) =>
                                    String(s.id) === filterData.shift_id &&
                                    String(s.branch_id) === newBranch,
                            );
                            if (!validShift) {
                                onFilterChange('shift_id', '');
                                onFilterChange('class_id', '');
                            }
                        }
                    }}
                >
                    <SelectTrigger className="h-9 rounded-xl text-xs">
                        <SelectValue
                            placeholder={t(
                                'branches.select_branch',
                                'Barcha filiallar',
                            )}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            {t('branches.select_branch', 'Barcha filiallar')}
                        </SelectItem>
                        {filteredBranches.map((b) => (
                            <SelectItem key={b.id} value={String(b.id)}>
                                {b.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* 3. Shift (Smena) */}
                <Select
                    value={filterData.shift_id || 'all'}
                    onValueChange={(val) => {
                        const newShift = val === 'all' ? '' : val;
                        onFilterChange('shift_id', newShift);
                        if (newShift && filterData.class_id) {
                            const validClass = classes.some(
                                (c) =>
                                    String(c.id) === filterData.class_id &&
                                    String(c.shift_id) === newShift,
                            );
                            if (!validClass) {
                                onFilterChange('class_id', '');
                            }
                        }
                    }}
                >
                    <SelectTrigger className="h-9 rounded-xl text-xs">
                        <SelectValue
                            placeholder={t(
                                'classes.all_shifts',
                                'Barcha smenalar',
                            )}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            {t('classes.all_shifts', 'Barcha smenalar')}
                        </SelectItem>
                        {filteredShifts.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                                {s.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* 4. Class (Sinf) */}
                <Select
                    value={filterData.class_id || 'all'}
                    onValueChange={(val) =>
                        onFilterChange('class_id', val === 'all' ? '' : val)
                    }
                >
                    <SelectTrigger className="h-9 rounded-xl text-xs">
                        <SelectValue
                            placeholder={t(
                                'students.all_classes',
                                'Barcha sinflar',
                            )}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            {t('students.all_classes', 'Barcha sinflar')}
                        </SelectItem>
                        {filteredClasses.map((cls) => (
                            <SelectItem key={cls.id} value={String(cls.id)}>
                                {cls.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* 5. Status */}
                <Select
                    value={filterData.status || 'all'}
                    onValueChange={(val) =>
                        onFilterChange('status', val === 'all' ? '' : val)
                    }
                >
                    <SelectTrigger className="h-9 rounded-xl text-xs">
                        <SelectValue
                            placeholder={t(
                                'students.all_status',
                                'Barcha holatlar',
                            )}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            {t('students.all_status', 'Barcha holatlar')}
                        </SelectItem>
                        <SelectItem value="active">
                            {t('students.active', 'Faol')}
                        </SelectItem>
                        <SelectItem value="inactive">
                            {t('students.inactive', 'Nofaol')}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Bottom row: Search, Clear, Per Page */}
            <div className="flex flex-col items-stretch justify-between gap-2 border-t border-border/50 pt-1 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={filterData.search || ''}
                        onChange={(e) =>
                            onFilterChange('search', e.target.value)
                        }
                        placeholder={t(
                            'students.placeholder_search',
                            'F.I.O, telefon yoki ID bo‘yicha qidirish...',
                        )}
                        className="h-9 rounded-xl pl-8 text-xs"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClear}
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
                </div>
            </div>
        </div>
    );
}
