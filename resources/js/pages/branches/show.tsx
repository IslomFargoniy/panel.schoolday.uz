import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    Building2,
    Building,
    ScanFace,
    GraduationCap,
    Clock,
    Users,
    ArrowLeft,
    Search,
    BookOpen,
    CalendarCheck,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import BranchDeviceTable from '@/components/branch/branch-device-table';
import CreateBranchDeviceModal from '@/components/branch/create-branch-device-modal';
import DeviceConnectionGuideModal from '@/components/branch/device-connection-guide-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/pagination';
import type { Branch, BreadcrumbItem, PaginatedResponse, Student } from '@/types';

interface BranchShowProps {
    branch: Branch;
    students: PaginatedResponse<Student>;
    filters?: {
        search?: string;
        per_page?: string | number;
    };
}

export default function BranchShowPage({ branch, students, filters }: BranchShowProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('sidebar.branches', 'Filiallar'), href: '/branches' },
        { title: branch.name, href: `/branches/${branch.id}` },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            `/branches/${branch.id}`,
            { search: searchTerm, per_page: filters?.per_page || 15 },
            { preserveState: true, replace: true },
        );
    };

    const isupDevicesCount = branch.devices?.filter(d => d.connection_type === 'isup').length || 0;
    const onlineDevicesCount = branch.devices?.filter(d => d.is_online).length || 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${branch.name} — ${t('sidebar.branches', 'Filial')}`} />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 max-w-full">
                {/* Header Banner */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-start sm:items-center gap-3.5">
                        <Link
                            href="/branches"
                            className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            title={t('back_to_branches', 'Filiallar ro‘yxatiga qaytish')}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                                    {branch.name}
                                </h1>
                                {(branch as any).school && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                        <Building2 className="w-3 h-3" />
                                        <span>{((branch as any).school.name)}</span>
                                    </span>
                                )}
                            </div>
                            {branch.description && (
                                <p className="mt-1 text-xs text-muted-foreground truncate max-w-xl">
                                    {branch.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Top Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <DeviceConnectionGuideModal branch={branch} />
                        <CreateBranchDeviceModal branch={branch} />
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-xs">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs font-medium">
                            <ScanFace className="w-4 h-4 text-indigo-500" />
                            <span>{t('connected_devices', 'Qurilmalar')}</span>
                        </div>
                        <div className="text-lg sm:text-2xl font-bold text-foreground">
                            {branch.devices?.length || 0}
                            <span className="text-xs font-normal text-muted-foreground ml-1.5">
                                ({isupDevicesCount} ISUP / {onlineDevicesCount} online)
                            </span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-xs">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs font-medium">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span>{t('sidebar.shifts', 'Smenalar')}</span>
                        </div>
                        <div className="text-lg sm:text-2xl font-bold text-foreground">
                            {(branch as any).shifts?.length || 0}
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-xs">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs font-medium">
                            <GraduationCap className="w-4 h-4 text-sky-500" />
                            <span>{t('sidebar.classes', 'Sinflar')}</span>
                        </div>
                        <div className="text-lg sm:text-2xl font-bold text-foreground">
                            {(branch as any).shifts?.reduce((acc: number, s: any) => acc + (s.classes_count || s.classes?.length || 0), 0) || 0}
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-xs">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs font-medium">
                            <Users className="w-4 h-4 text-emerald-500" />
                            <span>{t('sidebar.students', 'O‘quvchilar')}</span>
                        </div>
                        <div className="text-lg sm:text-2xl font-bold text-foreground">
                            {students.total || 0}
                        </div>
                    </div>
                </div>

                {/* Main 2-Column Split: Students/Shifts on Left, Devices on Right */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Left: Students & Classes */}
                    <div className="xl:col-span-7 space-y-6">
                        {/* Students Card */}
                        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-border bg-muted/40">
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        <span>{t('branch_students', 'Filialdagi o‘quvchilar')}</span>
                                        <span className="text-xs font-normal text-muted-foreground">
                                            ({students.total})
                                        </span>
                                    </h3>
                                </div>

                                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-60">
                                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder={t('search_students', 'O‘quvchini qidirish...')}
                                            className="h-8 pl-8 text-xs rounded-xl"
                                        />
                                    </div>
                                    <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs rounded-xl">
                                        {t('search', 'Qidirish')}
                                    </Button>
                                </form>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-border bg-muted/60 text-muted-foreground font-semibold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">{t('student_name', 'O‘quvchi')}</th>
                                            <th className="px-4 py-3">{t('class', 'Sinf')}</th>
                                            <th className="px-4 py-3">{t('phone', 'Telefon')}</th>
                                            <th className="px-4 py-3 text-center">{t('status', 'Holat')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {students.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                                    {t('no_students_in_branch', 'Bu filialda hozircha o‘quvchilar mavjud emas')}
                                                </td>
                                            </tr>
                                        ) : (
                                            students.data.map((st) => (
                                                <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 font-semibold text-foreground">
                                                        <div className="flex items-center gap-2.5">
                                                            {st.face_image ? (
                                                                <img
                                                                    src={st.face_image}
                                                                    alt=""
                                                                    className="w-7 h-7 rounded-full object-cover border border-border"
                                                                />
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                                    {st.name.charAt(0)}
                                                                </div>
                                                            )}
                                                            <span>{st.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {(st as any).school_class?.name || (st as any).schoolClass?.name || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground font-mono">
                                                        {st.phone || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                            st.status === 'active'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                                : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                            {st.status === 'active' ? t('active', 'Faol') : t('inactive', 'Nofaol')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {students.links && students.links.length > 3 && (
                                <div className="p-3 border-t border-border">
                                    <Pagination links={students.links} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Dedicated Hikvision ISUP 5.0 Devices Management Card */}
                    <div className="xl:col-span-5 space-y-4">
                        <BranchDeviceTable branch={branch} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
