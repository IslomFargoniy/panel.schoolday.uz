import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { RecentEventsTable } from '@/components/dashboard/RecentEventsTable';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface StatData {
    total_students: number;
    present_today: number;
    late_arrivals: number;
    on_time_today: number;
    absent_today: number;
}

interface MonthlyStat {
    date: string;
    present: number;
    absent: number;
    late: number;
    on_time: number;
}

interface EventData {
    id: number;
    employeeNoString: string | null;
    start_time: string | null;
    created_at: string;
    majorEventType: number;
    subEventType: number;
    student?: {
        name: string;
        school_class?: { name: string };
    };
}

export default function Dashboard() {
    const { props } = usePage();
    const { t } = useTranslation();

    const stats = (props.stats as StatData) || {
        total_students: 0,
        present_today: 0,
        late_arrivals: 0,
        on_time_today: 0,
        absent_today: 0,
    };
    const recentEvents = (props.recent_events as EventData[]) || [];
    const monthlyStats = (props.monthly_stats as MonthlyStat[]) || [];

    const schools = (props.schools as { id: number; name: string }[]) || [];
    const branches = (props.branches as { id: number; name: string; school_id?: number }[]) || [];
    const filters = (props.filters as { school_id?: string; branch_id?: string }) || {};

    const filteredBranches = filters.school_id
        ? branches.filter((b) => String(b.school_id) === String(filters.school_id))
        : branches;

    const handleFilterChange = (key: string, val: string) => {
        const next: any = { ...filters, [key]: val === 'all' ? '' : val };
        if (key === 'school_id' && val !== 'all' && next.branch_id) {
            const valid = branches.some(
                (b) => String(b.id) === next.branch_id && String(b.school_id) === val
            );
            if (!valid) delete next.branch_id;
        }
        router.get(dashboard().url, next, { preserveState: true, replace: true });
    };

    const handleResetFilters = () => {
        router.get(dashboard().url, {}, { preserveState: true, replace: true });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('dashboard.title', 'Dashboard'), href: dashboard().url },
    ];

    const hasFilters = Boolean(filters.school_id || filters.branch_id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('dashboard.title', 'Dashboard')} />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 max-w-full">
                {/* Filter Bar (Foreign keys: School -> Branch) */}
                {(schools.length > 0 || branches.length > 0) && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-sidebar-border bg-card p-3 shadow-xs dark:border-sidebar-border/70">
                        <div className="flex flex-wrap items-center gap-2 flex-1">
                            {/* School filter */}
                            {schools.length > 0 && (
                                <div className="w-full sm:w-56">
                                    <Select
                                        value={filters.school_id || 'all'}
                                        onValueChange={(val) => handleFilterChange('school_id', val)}
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

                            {/* Branch filter */}
                            {branches.length > 0 && (
                                <div className="w-full sm:w-56">
                                    <Select
                                        value={filters.branch_id || 'all'}
                                        onValueChange={(val) => handleFilterChange('branch_id', val)}
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
                            )}
                        </div>

                        {hasFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
                                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>{t('cancel', 'Tozalash')}</span>
                            </Button>
                        )}
                    </div>
                )}

                <StatsGrid stats={stats} />

                <DashboardCharts stats={stats} monthlyStats={monthlyStats} />

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">
                        {t(
                            'dashboard.recent_events',
                            'Recent Access Events (Live Feed)',
                        )}
                    </h2>
                </div>

                <RecentEventsTable events={recentEvents} />
            </div>
        </AppLayout>
    );
}
