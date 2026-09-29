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
    Plus,
    CalendarCheck,
    Check,
    Copy,
    Edit,
    Trash2,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import BranchDeviceTable from '@/components/branch/branch-device-table';
import CreateBranchDeviceModal from '@/components/branch/create-branch-device-modal';
import DeviceConnectionGuideModal from '@/components/branch/device-connection-guide-modal';
import CreateBranchShiftModal from '@/components/branch/create-branch-shift-modal';
import CreateBranchClassModal from '@/components/branch/create-branch-class-modal';
import CreateBranchStudentModal from '@/components/branch/create-branch-student-modal';
import StudentHikvisionEventsModal from '@/components/branch/student-hikvision-events-modal';
import { ImageModal } from '@/components/students/ImageModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/pagination';
import type { Branch, BreadcrumbItem, PaginatedResponse, SchoolClass, Shift, Student } from '@/types';

interface BranchShowProps {
    branch: Branch;
    students: PaginatedResponse<Student>;
    branchClasses?: SchoolClass[];
    filters?: {
        search?: string;
        shift_id?: string | number;
        class_id?: string | number;
        per_page?: string | number;
    };
}

export default function BranchShowPage({
    branch,
    students,
    branchClasses = [],
    filters,
}: BranchShowProps) {
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedShiftId, setSelectedShiftId] = useState<string | number | undefined>(
        filters?.shift_id || undefined,
    );
    const [selectedClassId, setSelectedClassId] = useState<string | number | undefined>(
        filters?.class_id || undefined,
    );

    // Modals state
    const [eventStudent, setEventStudent] = useState<Student | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

    const shifts: Shift[] = (branch as any).shifts || [];
    const isupDevicesCount = branch.devices?.filter((d) => d.connection_type === 'isup').length || 0;
    const onlineDevicesCount = branch.devices?.filter((d) => d.is_online).length || 0;

    // Filter classes by active shift
    const visibleClasses = selectedShiftId
        ? branchClasses.filter((c) => String(c.shift_id) === String(selectedShiftId))
        : branchClasses;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('sidebar.branches', 'Filiallar'), href: '/branches' },
        { title: branch.name, href: `/branches/${branch.id}` },
    ];

    const applyFilters = (shiftId?: string | number, classId?: string | number, search?: string) => {
        router.get(
            `/branches/${branch.id}`,
            {
                shift_id: shiftId || undefined,
                class_id: classId || undefined,
                search: search !== undefined ? search : searchTerm,
                per_page: filters?.per_page || 20,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleShiftSelect = (shiftId?: string | number) => {
        setSelectedShiftId(shiftId);
        setSelectedClassId(undefined); // Reset class filter when shift changes
        applyFilters(shiftId, undefined, searchTerm);
    };

    const handleClassSelect = (classId?: string | number) => {
        setSelectedClassId(classId);
        applyFilters(selectedShiftId, classId, searchTerm);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(selectedShiftId, selectedClassId, searchTerm);
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success(t('copied', 'Nusxalandi!'));
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDeleteStudent = (student: Student) => {
        if (!confirm(t('confirm_delete_student', 'Haqiqatan ham bu o‘quvchini o‘chirmoqchimisiz?'))) {
            return;
        }
        router.delete(`/students/${student.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('deleted_successfully', 'O‘quvchi o‘chirildi'));
            },
            onError: (err: any) => {
                toast.error(err?.message || t('delete_failed', 'O‘chirishda xatolik'));
            },
        });
    };

    // Calculate active shift & class names for breadcrumb
    const activeShift = shifts.find((s) => String(s.id) === String(selectedShiftId));
    const activeClass = branchClasses.find((c) => String(c.id) === String(selectedClassId));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${branch.name} — ${t('sidebar.branches', 'Filial')}`} />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 max-w-full">
                {/* 1. Header Banner */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
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
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span>{(branch as any).school.name}</span>
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
                    <div className="flex flex-wrap items-center gap-2">
                        <DeviceConnectionGuideModal branch={branch} />
                        <CreateBranchDeviceModal branch={branch} />
                        <CreateBranchShiftModal branch={branch} />
                    </div>
                </div>

                {/* 2. Overview Stats (4 Cards) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                            {shifts.length}
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-xs">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs font-medium">
                            <GraduationCap className="w-4 h-4 text-sky-500" />
                            <span>{t('sidebar.classes', 'Sinflar')}</span>
                        </div>
                        <div className="text-lg sm:text-2xl font-bold text-foreground">
                            {branchClasses.length}
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

                {/* 3. Hikvision Qurilmalari Section (Spacious Full Width Grid) */}
                <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
                    <BranchDeviceTable branch={branch} />
                </div>

                {/* 4. Ierarxiya: Filial ➔ Smena ➔ Sinf ➔ O'quvchilar ➔ Hikvision Actions */}
                <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                    {/* Hierarchy Header */}
                    <div className="p-4 sm:p-5 border-b border-border bg-muted/30">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-500" />
                                    <span>{t('branch_structure_title', 'Filial tuzilishi: Smena ➔ Sinf ➔ O‘quvchilar ➔ Hikvision')}</span>
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {t('branch_structure_desc', 'Filialdagi smenani tanlang, unga tegishli sinflar va o‘quvchilarni ko‘ring hamda Hikvision tizimi bilan boshqaring.')}
                                </p>
                            </div>

                            {/* Quick Add Buttons */}
                            <div className="flex items-center gap-2">
                                <CreateBranchShiftModal branch={branch} />
                                <CreateBranchClassModal branch={branch} defaultShiftId={selectedShiftId} />
                                <CreateBranchStudentModal
                                    branch={branch}
                                    classes={branchClasses}
                                    defaultClassId={selectedClassId}
                                />
                            </div>
                        </div>

                        {/* Breadcrumb Path of Hierarchy */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-border/60 text-xs font-medium text-muted-foreground">
                            <span className="text-foreground font-semibold flex items-center gap-1">
                                <Building className="w-3.5 h-3.5 text-indigo-500" />
                                {branch.name}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                            <span className={activeShift ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''}>
                                {activeShift ? activeShift.name : t('all_shifts', 'Barcha smenalar')}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                            <span className={activeClass ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : ''}>
                                {activeClass ? `${activeClass.name} ${t('class', 'sinf')}` : t('all_classes', 'Barcha sinflar')}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                            <span className="text-foreground font-semibold">
                                {students.total} {t('students.count', 'ta o‘quvchi')}
                            </span>
                        </div>
                    </div>

                    {/* Step 1: Smenalar (Shifts) selector */}
                    <div className="p-4 border-b border-border/80 bg-muted/15">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>{t('step_shift', '1-bosqich: Smenani tanlang')}</span>
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                size="sm"
                                variant={selectedShiftId === undefined ? 'default' : 'outline'}
                                onClick={() => handleShiftSelect(undefined)}
                                className={`h-8 text-xs font-medium rounded-xl ${
                                    selectedShiftId === undefined
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        : ''
                                }`}
                            >
                                <span>{t('all_shifts', 'Barcha smenalar')}</span>
                                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                                    {shifts.length}
                                </span>
                            </Button>

                            {shifts.map((shift) => {
                                const isSelected = String(shift.id) === String(selectedShiftId);
                                const classCount = (shift as any).classes_count || (shift as any).classes?.length || 0;
                                const studentCount =
                                    (shift as any).classes?.reduce(
                                        (sum: number, c: any) => sum + (c.students_count || 0),
                                        0,
                                    ) || 0;

                                return (
                                    <Button
                                        key={shift.id}
                                        size="sm"
                                        variant={isSelected ? 'default' : 'outline'}
                                        onClick={() => handleShiftSelect(shift.id)}
                                        className={`h-8 text-xs font-medium rounded-xl gap-1.5 ${
                                            isSelected
                                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                : ''
                                        }`}
                                    >
                                        <span>{shift.name}</span>
                                        <span className="text-[10px] opacity-80 font-mono">
                                            ({shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)})
                                        </span>
                                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                                            {classCount} {t('sidebar.classes', 'sinf')} • {studentCount} {t('sidebar.students', 'o‘quvchi')}
                                        </span>
                                    </Button>
                                );
                            })}

                            <CreateBranchShiftModal
                                branch={branch}
                                trigger={
                                    <Button size="sm" variant="ghost" className="h-8 text-xs font-medium gap-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50">
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>{t('add_shift', 'Smena qo‘shish')}</span>
                                    </Button>
                                }
                            />
                        </div>
                    </div>

                    {/* Step 2: Sinflar (Classes) selector */}
                    <div className="p-4 border-b border-border/80 bg-muted/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-sky-500" />
                                <span>{t('step_class', '2-bosqich: Sinfni tanlang')}</span>
                                {activeShift && (
                                    <span className="text-[11px] font-normal text-muted-foreground normal-case">
                                        ({activeShift.name})
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                size="sm"
                                variant={selectedClassId === undefined ? 'default' : 'outline'}
                                onClick={() => handleClassSelect(undefined)}
                                className={`h-8 text-xs font-medium rounded-xl ${
                                    selectedClassId === undefined
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        : ''
                                }`}
                            >
                                <span>{t('all_classes', 'Barcha sinflar')}</span>
                                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                                    {visibleClasses.length}
                                </span>
                            </Button>

                            {visibleClasses.map((cls) => {
                                const isSelected = String(cls.id) === String(selectedClassId);
                                const studentCount = (cls as any).students_count || 0;

                                return (
                                    <Button
                                        key={cls.id}
                                        size="sm"
                                        variant={isSelected ? 'default' : 'outline'}
                                        onClick={() => handleClassSelect(cls.id)}
                                        className={`h-8 text-xs font-medium rounded-xl gap-1.5 ${
                                            isSelected
                                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                : ''
                                        }`}
                                    >
                                        <span>{cls.name} {t('class', 'sinf')}</span>
                                        {studentCount > 0 && (
                                            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                                                {studentCount} {t('common.items', 'ta')}
                                            </span>
                                        )}
                                    </Button>
                                );
                            })}

                            <CreateBranchClassModal
                                branch={branch}
                                defaultShiftId={selectedShiftId}
                                trigger={
                                    <Button size="sm" variant="ghost" className="h-8 text-xs font-medium gap-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50">
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>{t('add_class', 'Sinf qo‘shish')}</span>
                                    </Button>
                                }
                            />
                        </div>
                    </div>

                    {/* Step 3 & 4: O'quvchilar & Hikvision Actions */}
                    <div className="p-4 sm:p-5">
                        {/* Table Header Controls */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                            <div>
                                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-500" />
                                    <span>{t('step_students', '3-bosqich: O‘quvchilar va Hikvision amallari')}</span>
                                    <span className="text-xs font-normal text-muted-foreground">
                                        ({students.total} {t('students.count', 'ta o‘quvchi')})
                                    </span>
                                </h4>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 sm:w-64">
                                    <div className="relative flex-1">
                                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder={t('search_students', 'Ism, telefon yoki ID...')}
                                            className="h-8 pl-8 text-xs rounded-xl"
                                        />
                                    </div>
                                    <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs rounded-xl">
                                        {t('search', 'Qidirish')}
                                    </Button>
                                </form>

                                <CreateBranchStudentModal
                                    branch={branch}
                                    classes={branchClasses}
                                    defaultClassId={selectedClassId}
                                />
                            </div>
                        </div>

                        {/* Students Table */}
                        <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border bg-muted/60 text-muted-foreground font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">{t('students.student', 'O‘quvchi')}</th>
                                        <th className="px-4 py-3">{t('sidebar.shifts', 'Smena')} / {t('sidebar.classes', 'Sinf')}</th>
                                        <th className="px-4 py-3">{t('students.hikvision_id', 'Hikvision ID')}</th>
                                        <th className="px-4 py-3">{t('face_id_status', 'Face ID Holati')}</th>
                                        <th className="px-4 py-3 text-center">{t('status', 'Holat')}</th>
                                        <th className="px-4 py-3 text-right">{t('hikvision_actions', 'Hikvision Amallari')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {students.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                                <div className="max-w-sm mx-auto space-y-2">
                                                    <Users className="w-8 h-8 mx-auto text-muted-foreground/50" />
                                                    <p className="font-semibold text-foreground">
                                                        {t('no_students_found', 'Ushbu tanlovda o‘quvchilar topilmadi')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t('no_students_found_desc', 'Yangi o‘quvchi qo‘shish orqali sinfga biriktiring va Hikvision tizimida qayd eting.')}
                                                    </p>
                                                    <div className="pt-2">
                                                        <CreateBranchStudentModal
                                                            branch={branch}
                                                            classes={branchClasses}
                                                            defaultClassId={selectedClassId}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        students.data.map((st) => {
                                            const hasFace = Boolean(st.face_image);
                                            const shiftName = (st as any).school_class?.shift?.name || (st as any).schoolClass?.shift?.name;
                                            const className = (st as any).school_class?.name || (st as any).schoolClass?.name;

                                            return (
                                                <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                                                    {/* Student Avatar + Name + Phone */}
                                                    <td className="px-4 py-3 font-semibold text-foreground">
                                                        <div className="flex items-center gap-2.5">
                                                            {st.face_image ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPreviewImage(st.face_image!)}
                                                                    className="relative w-8 h-8 rounded-full overflow-hidden border border-indigo-200 dark:border-indigo-800 shrink-0 hover:opacity-80 transition-opacity"
                                                                    title="Suratni ko‘rish"
                                                                >
                                                                    <img
                                                                        src={st.face_image}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </button>
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 border border-border">
                                                                    {st.name.charAt(0)}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="leading-tight">{st.name}</div>
                                                                <div className="text-[11px] font-normal text-muted-foreground font-mono mt-0.5">
                                                                    {st.phone || '—'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Shift & Class */}
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        <div className="font-medium text-foreground">
                                                            {className ? `${className} sinf` : '—'}
                                                        </div>
                                                        {shiftName && (
                                                            <div className="text-[10px] text-muted-foreground">
                                                                {shiftName}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Hikvision ID (employeeNoString) */}
                                                    <td className="px-4 py-3 font-mono">
                                                        {st.employeeNoString ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="px-1.5 py-0.5 rounded bg-muted text-foreground border border-border font-semibold">
                                                                    {st.employeeNoString}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyToClipboard(st.employeeNoString!, `st-${st.id}`)}
                                                                    className="p-1 text-muted-foreground hover:text-foreground rounded"
                                                                    title="Hikvision ID nusxalash"
                                                                >
                                                                    {copiedId === `st-${st.id}` ? (
                                                                        <Check className="w-3 h-3 text-emerald-500" />
                                                                    ) : (
                                                                        <Copy className="w-3 h-3" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </td>

                                                    {/* Face ID Status */}
                                                    <td className="px-4 py-3">
                                                        {hasFace ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                                <span>{t('face_enrolled', 'Yuz yuklangan')}</span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                                                                <AlertCircle className="w-3 h-3" />
                                                                <span>{t('face_none', 'Yuz yo‘q')}</span>
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-4 py-3 text-center">
                                                        <span
                                                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                                st.status === 'active'
                                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                                    : 'bg-muted text-muted-foreground'
                                                            }`}
                                                        >
                                                            {st.status === 'active' ? t('active', 'Faol') : t('inactive', 'Nofaol')}
                                                        </span>
                                                    </td>

                                                    {/* Step 4: Hikvision Actions */}
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* View Turniket Events */}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setEventStudent(st);
                                                                    setIsEventModalOpen(true);
                                                                }}
                                                                className="h-7 px-2 text-[11px] gap-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                                                                title={t('hikvision_events', 'Turniket hodisalari')}
                                                            >
                                                                <CalendarCheck className="w-3 h-3" />
                                                                <span className="hidden sm:inline">{t('hikvision_events', 'Hodisalar')}</span>
                                                            </Button>

                                                            {/* Edit Student */}
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setStudentToEdit(st);
                                                                    setIsStudentModalOpen(true);
                                                                }}
                                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                                                title={t('edit', 'Tahrirlash')}
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </Button>

                                                            {/* Delete Student */}
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteStudent(st)}
                                                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                title={t('delete', 'O‘chirish')}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {students.links && students.links.length > 3 && (
                            <div className="p-3 border-t border-border mt-3">
                                <Pagination links={students.links} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <StudentHikvisionEventsModal
                student={eventStudent}
                open={isEventModalOpen}
                onClose={() => {
                    setIsEventModalOpen(false);
                    setEventStudent(null);
                }}
            />

            <ImageModal
                imageUrl={previewImage}
                onClose={() => setPreviewImage(null)}
            />

            <CreateBranchStudentModal
                branch={branch}
                classes={branchClasses}
                defaultClassId={selectedClassId}
                studentToEdit={studentToEdit}
                open={isStudentModalOpen}
                onOpenChange={(open) => {
                    setIsStudentModalOpen(open);
                    if (!open) setStudentToEdit(null);
                }}
            />
        </AppLayout>
    );
}
