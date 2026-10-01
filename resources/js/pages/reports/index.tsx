import { Head, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AttendanceTable } from '@/components/reports/AttendanceTable';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import type {
    BreadcrumbItem,
    DailyAttendance,
    Branch,
    Shift,
    SchoolClass,
    Student,
    PaginatedResponse,
} from '@/types';

interface ReportPageFilters {
    start_date?: string;
    end_date?: string;
    school_id?: string;
    branch_id?: string;
    shift_id?: string;
    class_id?: string;
    student_id?: string;
    status?: string;
    per_page?: string;
}

interface ReportsPageProps {
    attendances: PaginatedResponse<DailyAttendance>;
    schools?: { id: number; name: string }[];
    branches: (Branch & { school_id?: number })[];
    shifts: (Shift & { branch_id?: number })[];
    classes: (SchoolClass & { shift_id?: number })[];
    students: (Student & { class_id?: number })[];
    filters: ReportPageFilters;
    range_truncated?: boolean;
    effective_end_date?: string | null;
}

export default function ReportsPage({
    attendances,
    schools = [],
    branches,
    shifts,
    classes,
    students,
    filters,
    range_truncated = false,
    effective_end_date = null,
}: ReportsPageProps) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('reports.title', 'Daily Attendance Report'),
            href: '/reports',
        },
    ];

    const { data: filterData, setData } = useForm({
        start_date: filters?.start_date || '',
        end_date: filters?.end_date || '',
        school_id: filters?.school_id || '',
        branch_id: filters?.branch_id || '',
        shift_id: filters?.shift_id || '',
        class_id: filters?.class_id || '',
        student_id: filters?.student_id || '',
        status: filters?.status || 'all',
        per_page: filters?.per_page || '20',
    });

    const handleFilter = (e: FormEvent) => {
        e.preventDefault();
        router.get('/reports', filterData, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        const today = new Date().toISOString().split('T')[0];
        const resetData = {
            start_date: today,
            end_date: today,
            school_id: '',
            branch_id: '',
            shift_id: '',
            class_id: '',
            student_id: '',
            status: 'all',
            per_page: '20',
        };
        router.get('/reports', resetData, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('reports.title', 'Daily Attendance Report')} />
            <div className="flex max-w-full min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6">
                <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        {t('reports.title', 'Daily Attendance Report')}
                    </h2>
                </div>
                <ReportFilters
                    filterData={filterData}
                    schools={schools}
                    branches={branches}
                    shifts={shifts}
                    classes={classes}
                    students={students}
                    setData={setData}
                    onSubmit={handleFilter}
                    onReset={handleReset}
                />
                {range_truncated && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {t(
                                'reports.range_truncated',
                                'Kelmaganlar hisoboti bir martada ko‘pi bilan 31 kunni qamrab oladi. Natijalar {{date}} sanasigacha ko‘rsatilmoqda.',
                                { date: effective_end_date },
                            )}
                        </AlertDescription>
                    </Alert>
                )}
                <AttendanceTable
                    attendances={attendances}
                    filters={filterData}
                />
            </div>
        </AppLayout>
    );
}
