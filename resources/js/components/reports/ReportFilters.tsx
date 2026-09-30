import { CalendarIcon, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ReportFiltersProps {
    filterData: {
        start_date: string;
        end_date: string;
        school_id?: string;
        branch_id: string;
        shift_id: string;
        class_id: string;
        student_id: string;
        status: string;
        per_page: string;
    };
    schools?: { id: number; name: string }[];
    branches: any[];
    shifts: any[];
    classes: any[];
    students: any[];
    setData: (key: string, value: string) => void;
    onSubmit: (e: FormEvent) => void;
    onReset?: () => void;
}

export function ReportFilters({
    filterData,
    schools = [],
    branches,
    shifts,
    classes,
    students,
    setData,
    onSubmit,
    onReset,
}: ReportFiltersProps) {
    const { t } = useTranslation();

    // Cascading branches
    const filteredBranches = filterData.school_id
        ? branches.filter((b) => String(b.school_id) === String(filterData.school_id))
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

    const classIds = filteredClasses.map((c) => c.id);

    // Cascading students
    const filteredStudents = students.filter((st) => {
        if (filterData.class_id) {
            return String(st.class_id) === String(filterData.class_id);
        }
        if (filterData.shift_id || filterData.branch_id || filterData.school_id) {
            return st.class_id && classIds.includes(st.class_id);
        }
        return true;
    });

    const hasActiveFilters = Boolean(
        filterData.school_id ||
        filterData.branch_id ||
        filterData.shift_id ||
        filterData.class_id ||
        filterData.student_id ||
        (filterData.status && filterData.status !== 'all') ||
        filterData.per_page !== '20'
    );

    return (
        <div className="mb-4 rounded-xl border border-sidebar-border bg-card p-4 shadow-sm dark:border-sidebar-border">
            <form
                onSubmit={onSubmit}
                className="flex flex-col gap-3"
            >
                {/* Row 1: Cascading Foreign Keys (School -> Branch -> Shift -> Class -> Student) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {/* 1. School (Maktab) */}
                    {schools.length > 0 && (
                        <div>
                            <Select
                                value={filterData.school_id || 'all'}
                                onValueChange={(val) => {
                                    const newSchool = val === 'all' ? '' : val;
                                    setData('school_id', newSchool);
                                    if (newSchool && filterData.branch_id) {
                                        const valid = branches.some(
                                            (b) => String(b.id) === filterData.branch_id && String(b.school_id) === newSchool
                                        );
                                        if (!valid) {
                                            setData('branch_id', '');
                                            setData('shift_id', '');
                                            setData('class_id', '');
                                            setData('student_id', '');
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

                    {/* 2. Branch (Filial) */}
                    <div>
                        <Select
                            value={filterData.branch_id || 'all'}
                            onValueChange={(val) => {
                                const newBranch = val === 'all' ? '' : val;
                                setData('branch_id', newBranch);
                                if (newBranch && filterData.shift_id) {
                                    const valid = shifts.some(
                                        (s) => String(s.id) === filterData.shift_id && String(s.branch_id) === newBranch
                                    );
                                    if (!valid) {
                                        setData('shift_id', '');
                                        setData('class_id', '');
                                        setData('student_id', '');
                                    }
                                }
                            }}
                        >
                            <SelectTrigger className="h-9 text-xs rounded-xl">
                                <SelectValue placeholder={t('reports.all_branches', 'Barcha filiallar')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('reports.all_branches', 'Barcha filiallar')}</SelectItem>
                                {filteredBranches.map((b: any) => (
                                    <SelectItem key={b.id} value={String(b.id)}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 3. Shift (Smena) */}
                    <div>
                        <Select
                            value={filterData.shift_id || 'all'}
                            onValueChange={(val) => {
                                const newShift = val === 'all' ? '' : val;
                                setData('shift_id', newShift);
                                if (newShift && filterData.class_id) {
                                    const valid = classes.some(
                                        (c) => String(c.id) === filterData.class_id && String(c.shift_id) === newShift
                                    );
                                    if (!valid) {
                                        setData('class_id', '');
                                        setData('student_id', '');
                                    }
                                }
                            }}
                        >
                            <SelectTrigger className="h-9 text-xs rounded-xl">
                                <SelectValue placeholder={t('reports.all_shifts', 'Barcha smenalar')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('reports.all_shifts', 'Barcha smenalar')}</SelectItem>
                                {filteredShifts.map((s: any) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 4. Class (Sinf) */}
                    <div>
                        <Select
                            value={filterData.class_id || 'all'}
                            onValueChange={(val) => {
                                const newClass = val === 'all' ? '' : val;
                                setData('class_id', newClass);
                                if (newClass && filterData.student_id) {
                                    const valid = students.some(
                                        (st) => String(st.id) === filterData.student_id && String(st.class_id) === newClass
                                    );
                                    if (!valid) {
                                        setData('student_id', '');
                                    }
                                }
                            }}
                        >
                            <SelectTrigger className="h-9 text-xs rounded-xl">
                                <SelectValue placeholder={t('reports.all_classes', 'Barcha sinflar')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('reports.all_classes', 'Barcha sinflar')}</SelectItem>
                                {filteredClasses.map((c: any) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 5. Student (O'quvchi) */}
                    <div>
                        <Combobox
                            value={filterData.student_id}
                            onChange={(val) => setData('student_id', val === 'all' ? '' : val)}
                            placeholder={t('reports.all_students', "Barcha o'quvchilar")}
                            searchPlaceholder={t('common.search', 'Qidirish...')}
                            emptyText={t('common.not_found', 'Topilmadi')}
                            options={[
                                {
                                    value: '',
                                    label: t('reports.all_students', "Barcha o'quvchilar"),
                                },
                                ...filteredStudents.map((s: any) => ({
                                    value: String(s.id),
                                    label: s.name,
                                })),
                            ]}
                        />
                    </div>
                </div>

                {/* Row 2: Date range, Status, Per page, Submit, Reset */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                        {/* Date Range Popover */}
                        <div className="w-full sm:w-60">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start border-sidebar-border bg-card text-left font-normal text-xs h-9 rounded-xl hover:bg-muted ${
                                            !filterData.start_date || !filterData.end_date
                                                ? 'text-muted-foreground'
                                                : ''
                                        }`}
                                    >
                                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                        {filterData.start_date || filterData.end_date ? (
                                            <span>
                                                {filterData.start_date || '...'} - {filterData.end_date || '...'}
                                            </span>
                                        ) : (
                                            <span>{t('reports.select_date', 'Sanani tanlang')}</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-4" align="start">
                                    <div className="flex flex-col gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                {t('reports.from_date', 'Dan:')}
                                            </label>
                                            <Input
                                                type="date"
                                                value={filterData.start_date}
                                                onChange={(e) => setData('start_date', e.target.value)}
                                                required
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">
                                                {t('reports.to_date', 'Gacha:')}
                                            </label>
                                            <Input
                                                type="date"
                                                value={filterData.end_date}
                                                onChange={(e) => setData('end_date', e.target.value)}
                                                required
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Status Select */}
                        <div className="w-full sm:w-40">
                            <Select
                                value={filterData.status}
                                onValueChange={(val) => setData('status', val)}
                            >
                                <SelectTrigger className="h-9 text-xs rounded-xl">
                                    <SelectValue placeholder={t('reports.status', 'Holat')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('reports.status_all', 'Barchasi')}</SelectItem>
                                    <SelectItem value="present">{t('reports.status_present', 'Kelganlar')}</SelectItem>
                                    <SelectItem value="on_time">{t('reports.status_on_time', "O'z vaqtida")}</SelectItem>
                                    <SelectItem value="late">{t('reports.status_late', 'Kechikkanlar')}</SelectItem>
                                    <SelectItem value="left_early">{t('reports.status_left_early', 'Barvaqt ketganlar')}</SelectItem>
                                    <SelectItem value="absent">{t('reports.status_absent', 'Kelmaganlar')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Per Page Select */}
                        <div className="w-28">
                            <Select
                                value={filterData.per_page}
                                onValueChange={(val) => setData('per_page', val)}
                            >
                                <SelectTrigger className="h-9 text-xs rounded-xl">
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

                    {/* Actions: Filter & Reset */}
                    <div className="flex items-center gap-2">
                        {hasActiveFilters && onReset && (
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

                        <Button type="submit" size="sm" className="h-9 text-xs rounded-xl">
                            {t('reports.filter', 'Hisobotni filtrlash')}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
