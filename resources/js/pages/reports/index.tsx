import { Head, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AttendanceTable } from '@/components/reports/AttendanceTable';
import { ReportFilters } from '@/components/reports/ReportFilters';
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
    branch_id?: string;
    shift_id?: string;
    class_id?: string;
    student_id?: string;
    status?: string;
    per_page?: string;
}

interface ReportsPageProps {
    attendances: PaginatedResponse<DailyAttendance>;
    branches: Branch[];
    shifts: Shift[];
    classes: SchoolClass[];
    students: Student[];
    filters: ReportPageFilters;
}

export default function ReportsPage({
    attendances,
    branches,
    shifts,
    classes,
    students,
    filters,
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('reports.title', 'Daily Attendance Report')} />
            <div className="flex flex-1 flex-col gap-4 overflow-x-auto p-6">
                <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold tracking-tight">
                        {t('reports.title', 'Daily Attendance Report')}
                    </h2>
                </div>
                <ReportFilters
                    filterData={filterData}
                    branches={branches}
                    shifts={shifts}
                    classes={classes}
                    students={students}
                    setData={setData}
                    onSubmit={handleFilter}
                />
                <AttendanceTable
                    attendances={attendances}
                    filters={filterData}
                />
            </div>
        </AppLayout>
    );
}
