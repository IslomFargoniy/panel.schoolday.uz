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
    Pencil,
    Trash2,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Sparkles,
    Send,
    Radio,
    Network,
    RefreshCw,
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
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/pagination';
import type {
    Branch,
    BreadcrumbItem,
    PaginatedResponse,
    SchoolClass,
    Shift,
    Student,
} from '@/types';

interface BranchShowProps {
    branch: Branch;
    students: PaginatedResponse<Student>;
    branchClasses?: (SchoolClass & { students_count?: number })[];
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
    const [selectedShiftId, setSelectedShiftId] = useState<
        string | number | undefined
    >(filters?.shift_id || undefined);
    const [selectedClassId, setSelectedClassId] = useState<
        string | number | undefined
    >(filters?.class_id || undefined);

    // Modals state
    const [eventStudent, setEventStudent] = useState<Student | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Edit modals state
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

    const [shiftToEdit, setShiftToEdit] = useState<Shift | null>(null);
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

    const [classToEdit, setClassToEdit] = useState<SchoolClass | null>(null);
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);

    // Delete dialogs state
    const [deleteShiftItem, setDeleteShiftItem] = useState<Shift | null>(null);
    const [deleteClassItem, setDeleteClassItem] = useState<SchoolClass | null>(
        null,
    );
    const [deleteStudentItem, setDeleteStudentItem] = useState<Student | null>(
        null,
    );

    const shifts: (Shift & {
        classes?: (SchoolClass & { students_count?: number })[];
    })[] = (branch as any).shifts || [];
    const isupDevicesCount =
        branch.devices?.filter((d) => d.connection_type === 'isup').length || 0;
    const onlineDevicesCount =
        branch.devices?.filter((d) => d.is_online).length || 0;

    // Filter classes by active shift
    const visibleClasses = selectedShiftId
        ? branchClasses.filter(
              (c) => String(c.shift_id) === String(selectedShiftId),
          )
        : branchClasses;

    // Calculate active shift & class objects
    const activeShift = shifts.find(
        (s) => String(s.id) === String(selectedShiftId),
    );
    const activeClass = branchClasses.find(
        (c) => String(c.id) === String(selectedClassId),
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('sidebar.branches', 'Filiallar'), href: '/branches' },
        { title: branch.name, href: `/branches/${branch.id}` },
    ];
    if (activeShift) {
        breadcrumbs.push({
            title: activeShift.name,
            href: `/branches/${branch.id}?shift_id=${activeShift.id}`,
        });
    }
    if (activeClass) {
        breadcrumbs.push({
            title: activeClass.name,
            href: `/branches/${branch.id}?shift_id=${activeShift?.id || ''}&class_id=${activeClass.id}`,
        });
    }

    const applyFilters = (
        shiftId?: string | number,
        classId?: string | number,
        search?: string,
    ) => {
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
        setSelectedClassId(undefined);
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

    // Delete Handlers
    const handleConfirmDeleteShift = () => {
        if (!deleteShiftItem) return;
        router.delete(`/shifts/${deleteShiftItem.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('shift_deleted_success', 'Smena o‘chirildi'));
                setDeleteShiftItem(null);
                if (String(selectedShiftId) === String(deleteShiftItem.id)) {
                    setSelectedShiftId(undefined);
                    setSelectedClassId(undefined);
                }
            },
            onError: (err: any) => {
                toast.error(
                    err?.error ||
                        err?.message ||
                        t('delete_failed', 'O‘chirishda xatolik'),
                );
            },
        });
    };

    const handleConfirmDeleteClass = () => {
        if (!deleteClassItem) return;
        router.delete(`/classes/${deleteClassItem.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('class_deleted_success', 'Sinf o‘chirildi'));
                setDeleteClassItem(null);
                if (String(selectedClassId) === String(deleteClassItem.id)) {
                    setSelectedClassId(undefined);
                }
            },
            onError: (err: any) => {
                toast.error(
                    err?.error ||
                        err?.message ||
                        t('delete_failed', 'O‘chirishda xatolik'),
                );
            },
        });
    };

    const handleConfirmDeleteStudent = () => {
        if (!deleteStudentItem) return;
        router.delete(`/students/${deleteStudentItem.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('deleted_successfully', 'O‘quvchi o‘chirildi'));
                setDeleteStudentItem(null);
            },
            onError: (err: any) => {
                toast.error(
                    err?.error ||
                        err?.message ||
                        t('delete_failed', 'O‘chirishda xatolik'),
                );
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={`${branch.name} — ${t('sidebar.branches', 'Filial')}`}
            />

            <div className="flex max-w-full min-w-0 flex-1 flex-col gap-5 p-4 sm:p-6">
                {/* 1. Header Banner */}
                <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
                        <Link
                            href="/branches"
                            className="shrink-0 rounded-xl bg-muted/60 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title={t(
                                'back_to_branches',
                                'Filiallar ro‘yxatiga qaytish',
                            )}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                    {branch.name}
                                </h1>
                                {(branch as any).school && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                        <Building2 className="h-3.5 w-3.5" />
                                        <span>
                                            {(branch as any).school.name}
                                        </span>
                                    </span>
                                )}
                            </div>
                            {branch.description && (
                                <p className="mt-1 max-w-xl truncate text-xs text-muted-foreground">
                                    {branch.description}
                                </p>
                            )}

                            {/* Summary Badges */}
                            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                                    <span>
                                        {shifts.length}{' '}
                                        {t('sidebar.shifts', 'smena')}
                                    </span>
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                    <GraduationCap className="h-3.5 w-3.5 text-sky-500" />
                                    <span>
                                        {branchClasses.length}{' '}
                                        {t('sidebar.classes', 'sinf')}
                                    </span>
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                    <Users className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>
                                        {students.total || 0}{' '}
                                        {t('sidebar.students', 'o‘quvchi')}
                                    </span>
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                    <ScanFace className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>
                                        {branch.devices?.length || 0}{' '}
                                        {t('connected_devices', 'qurilma')}
                                    </span>
                                    <span className="text-[11px] font-normal text-muted-foreground">
                                        ({onlineDevicesCount} online)
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Top Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <DeviceConnectionGuideModal branch={branch} />
                        <CreateBranchDeviceModal branch={branch} />
                        <CreateBranchShiftModal branch={branch} />
                    </div>
                </div>

                {/* 2. Hierarchical Drill-down Breadcrumb Navigation Strip */}
                {(selectedShiftId || selectedClassId) && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200/80 bg-indigo-50/50 px-4 py-3 text-xs dark:border-indigo-900/60 dark:bg-indigo-950/20">
                        <div className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                            <span className="text-muted-foreground">
                                {t('hierarchy', 'Ierarxiya')}:
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    handleShiftSelect(undefined);
                                }}
                                className="flex items-center gap-1 font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                                <Building className="h-3.5 w-3.5" />
                                <span>{branch.name}</span>
                            </button>

                            {activeShift && (
                                <>
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleClassSelect(undefined);
                                        }}
                                        className={
                                            selectedClassId
                                                ? 'flex items-center gap-1 font-semibold text-indigo-600 hover:underline dark:text-indigo-400'
                                                : 'flex items-center gap-1 font-bold text-foreground'
                                        }
                                    >
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                        <span>{activeShift.name}</span>
                                    </button>
                                </>
                            )}

                            {activeClass && (
                                <>
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                                    <span className="flex items-center gap-1 font-bold text-foreground">
                                        <GraduationCap className="h-3.5 w-3.5 text-sky-500" />
                                        <span>{activeClass.name} sinfi</span>
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Back button */}
                        {selectedClassId ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleClassSelect(undefined)}
                                className="h-7 gap-1.5 rounded-lg border-indigo-200 text-xs dark:border-indigo-800"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span>
                                    {t('back_to_classes', 'Sinflarga qaytish')}
                                </span>
                            </Button>
                        ) : selectedShiftId ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShiftSelect(undefined)}
                                className="h-7 gap-1.5 rounded-lg border-indigo-200 text-xs dark:border-indigo-800"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span>
                                    {t(
                                        'back_to_shifts',
                                        'Barcha smenalarga qaytish',
                                    )}
                                </span>
                            </Button>
                        ) : null}
                    </div>
                )}

                {/* 3. Main Split Layout: Left 70% (Shifts / Classes / Students) | Right 30% (Devices) */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-10">
                    {/* LEFT COLUMN: 70% */}
                    <div className="space-y-4 lg:col-span-7">
                        {/* ========================================================= */}
                        {/* LEVEL 1: SMENALAR RO'YXATI (Default when !selectedShiftId) */}
                        {/* ========================================================= */}
                        {!selectedShiftId && (
                            <div className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
                                <div className="mb-4 flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                                            <Clock className="h-4 w-4 text-amber-500" />
                                            <span>
                                                {t(
                                                    'branch_shifts_title',
                                                    'Filial Smenalari',
                                                )}
                                            </span>
                                            <span className="text-xs font-normal text-muted-foreground">
                                                ({shifts.length} ta)
                                            </span>
                                        </h3>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {t(
                                                'shifts_desc',
                                                'Smena tanlang va unga biriktirilgan sinflar hamda o‘quvchilar ro‘yxatiga kiring.',
                                            )}
                                        </p>
                                    </div>

                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setShiftToEdit(null);
                                            setIsShiftModalOpen(true);
                                        }}
                                        className="h-8 shrink-0 gap-1.5 rounded-xl text-xs font-medium"
                                    >
                                        <Plus className="h-3.5 w-3.5 shrink-0" />
                                        <span>Create</span>
                                    </Button>
                                </div>

                                {shifts.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                                            <Clock className="h-6 w-6" />
                                        </div>
                                        <h4 className="mb-1 text-sm font-semibold text-foreground">
                                            {t(
                                                'no_shifts_title',
                                                'Hozircha smenalar mavjud emas',
                                            )}
                                        </h4>
                                        <p className="mx-auto mb-4 max-w-sm text-xs text-muted-foreground">
                                            {t(
                                                'no_shifts_desc',
                                                'Filialda dars vaqtlari bo‘yicha smenalar yarating (masalan: 1-smena, 2-smena).',
                                            )}
                                        </p>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setShiftToEdit(null);
                                                setIsShiftModalOpen(true);
                                            }}
                                            className="h-8 gap-1.5 rounded-xl text-xs font-medium"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            <span>Create</span>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {shifts.map((shift) => {
                                            const totalStudentsInShift =
                                                shift.classes?.reduce(
                                                    (acc, c) =>
                                                        acc +
                                                        (c.students_count || 0),
                                                    0,
                                                ) || 0;

                                            return (
                                                <div
                                                    key={shift.id}
                                                    className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-indigo-400 hover:shadow-md dark:hover:border-indigo-600"
                                                >
                                                    <div>
                                                        {/* Header: Name, Time, Actions */}
                                                        <div className="mb-3 flex items-start justify-between gap-2">
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                                    {shift.name}
                                                                </h4>
                                                                <div className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                                                    <Clock className="h-3 w-3" />
                                                                    <span>
                                                                        {shift.start_time?.substring(
                                                                            0,
                                                                            5,
                                                                        )}{' '}
                                                                        -{' '}
                                                                        {shift.end_time?.substring(
                                                                            0,
                                                                            5,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        setShiftToEdit(
                                                                            shift,
                                                                        );
                                                                        setIsShiftModalOpen(
                                                                            true,
                                                                        );
                                                                    }}
                                                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                                    title={t(
                                                                        'edit',
                                                                        'Tahrirlash',
                                                                    )}
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        setDeleteShiftItem(
                                                                            shift,
                                                                        );
                                                                    }}
                                                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                                    title={t(
                                                                        'delete',
                                                                        'O‘chirish',
                                                                    )}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Stats: Classes & Students */}
                                                        <div className="my-3 grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2.5 text-xs">
                                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                <GraduationCap className="h-3.5 w-3.5 text-sky-500" />
                                                                <span className="font-semibold text-foreground">
                                                                    {shift.classes_count ||
                                                                        0}
                                                                </span>
                                                                <span>
                                                                    sinf
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                <Users className="h-3.5 w-3.5 text-emerald-500" />
                                                                <span className="font-semibold text-foreground">
                                                                    {
                                                                        totalStudentsInShift
                                                                    }
                                                                </span>
                                                                <span>
                                                                    o‘quvchi
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Drill-in Button */}
                                                    <Button
                                                        onClick={() =>
                                                            handleShiftSelect(
                                                                shift.id,
                                                            )
                                                        }
                                                        className="mt-2 h-8 w-full gap-1.5 rounded-lg bg-indigo-50 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                                                    >
                                                        <span>
                                                            {t(
                                                                'view_classes_in_shift',
                                                                'Sinflarni ko‘rish',
                                                            )}
                                                        </span>
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ========================================================================= */}
                        {/* LEVEL 2: SINFLAR RO'YXATI (When selectedShiftId && !selectedClassId)      */}
                        {/* ========================================================================= */}
                        {selectedShiftId && !selectedClassId && (
                            <div className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
                                <div className="mb-4 flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                                            <GraduationCap className="h-4 w-4 text-sky-500" />
                                            <span>
                                                {activeShift?.name} —{' '}
                                                {t(
                                                    'classes_list',
                                                    'Sinflar ro‘yxati',
                                                )}
                                            </span>
                                            <span className="text-xs font-normal text-muted-foreground">
                                                ({visibleClasses.length} ta
                                                sinf)
                                            </span>
                                        </h3>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {t(
                                                'select_class_to_view_students',
                                                'O‘quvchilarni ko‘rish va Hikvision amallarini bajarish uchun sinf ustiga bosing.',
                                            )}
                                        </p>
                                    </div>

                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setClassToEdit(null);
                                            setIsClassModalOpen(true);
                                        }}
                                        className="h-8 shrink-0 gap-1.5 rounded-xl text-xs font-medium"
                                    >
                                        <Plus className="h-3.5 w-3.5 shrink-0" />
                                        <span>Create</span>
                                    </Button>
                                </div>

                                {visibleClasses.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                                            <GraduationCap className="h-6 w-6" />
                                        </div>
                                        <h4 className="mb-1 text-sm font-semibold text-foreground">
                                            {t(
                                                'no_classes_in_shift',
                                                'Ushbu smenada hali sinflar mavjud emas',
                                            )}
                                        </h4>
                                        <p className="mx-auto mb-4 max-w-sm text-xs text-muted-foreground">
                                            {t(
                                                'create_class_hint',
                                                'Yangi sinf yarating (masalan: 10-A, 11-B) va unga o‘quvchilarni biriktiring.',
                                            )}
                                        </p>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setClassToEdit(null);
                                                setIsClassModalOpen(true);
                                            }}
                                            className="h-8 gap-1.5 rounded-xl text-xs font-medium"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            <span>Create</span>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                                        {visibleClasses.map((item) => (
                                            <div
                                                key={item.id}
                                                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 transition-all duration-200 hover:border-sky-400 hover:shadow-md dark:hover:border-sky-600"
                                            >
                                                <div>
                                                    <div className="mb-2 flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xs font-bold text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                                                                {item.name.substring(
                                                                    0,
                                                                    3,
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-foreground transition-colors group-hover:text-sky-600 dark:group-hover:text-sky-400">
                                                                    {item.name}{' '}
                                                                    sinfi
                                                                </h4>
                                                                <span className="text-[11px] text-muted-foreground">
                                                                    {
                                                                        activeShift?.name
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-0.5">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setClassToEdit(
                                                                        item,
                                                                    );
                                                                    setIsClassModalOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                                title={t(
                                                                    'edit',
                                                                    'Tahrirlash',
                                                                )}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setDeleteClassItem(
                                                                        item,
                                                                    );
                                                                }}
                                                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                                title={t(
                                                                    'delete',
                                                                    'O‘chirish',
                                                                )}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="my-2.5 space-y-1.5 rounded-lg bg-muted/40 p-2 text-xs">
                                                        <div className="flex items-center justify-between text-muted-foreground">
                                                            <span>
                                                                O‘quvchilar:
                                                            </span>
                                                            <span className="font-semibold text-foreground">
                                                                {(item as any)
                                                                    .students_count ||
                                                                    0}{' '}
                                                                ta
                                                            </span>
                                                        </div>
                                                        {item.telegram_group_id && (
                                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Send className="h-3 w-3 text-sky-500" />
                                                                    <span>
                                                                        TG
                                                                        guruh:
                                                                    </span>
                                                                </span>
                                                                <span className="max-w-[100px] truncate font-mono text-foreground">
                                                                    {
                                                                        item.telegram_group_id
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() =>
                                                        handleClassSelect(
                                                            item.id,
                                                        )
                                                    }
                                                    className="mt-1 h-7.5 w-full gap-1 rounded-lg bg-sky-50 text-xs font-medium text-sky-700 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/60"
                                                >
                                                    <span>
                                                        {t(
                                                            'view_students',
                                                            'O‘quvchilarni ko‘rish',
                                                        )}
                                                    </span>
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ========================================================================= */}
                        {/* LEVEL 3: O'QUVCHILAR RO'YXATI (When selectedClassId is set)               */}
                        {/* ========================================================================= */}
                        {selectedClassId && (
                            <div className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
                                {/* Header */}
                                <div className="mb-4 flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                                            <Users className="h-4 w-4 text-emerald-500" />
                                            <span>
                                                {activeClass?.name} sinfi —{' '}
                                                {t(
                                                    'students_list',
                                                    'O‘quvchilar',
                                                )}
                                            </span>
                                            <span className="text-xs font-normal text-muted-foreground">
                                                ({students.total || 0} ta)
                                            </span>
                                        </h3>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {t(
                                                'class_students_desc',
                                                'O‘quvchilarni boshqarish, yuz rasmlarini yuklash va Hikvision qurilmalariga sinxronlash.',
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <form
                                            onSubmit={handleSearch}
                                            className="relative w-full sm:w-56"
                                        >
                                            <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={t(
                                                    'search_student',
                                                    'Qidirish...',
                                                )}
                                                className="h-8 rounded-xl pl-8 text-xs"
                                            />
                                        </form>

                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setStudentToEdit(null);
                                                setIsStudentModalOpen(true);
                                            }}
                                            className="h-8 shrink-0 gap-1.5 rounded-xl text-xs font-medium"
                                        >
                                            <Plus className="h-3.5 w-3.5 shrink-0" />
                                            <span>Create</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="max-w-full min-w-0 overflow-x-auto rounded-xl border border-border">
                                    <table className="w-full min-w-[560px] text-left text-xs">
                                        <thead className="border-b bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase">
                                            <tr>
                                                <th className="px-3 py-3">#</th>
                                                <th className="px-3 py-3">
                                                    {t('student', 'O‘quvchi')}
                                                </th>
                                                <th className="px-3 py-3">
                                                    {t(
                                                        'hikvision_id',
                                                        'Hikvision ID',
                                                    )}
                                                </th>
                                                <th className="px-3 py-3">
                                                    {t('status', 'Status')}
                                                </th>
                                                <th className="px-3 py-3 text-right">
                                                    {t('actions', 'Amallar')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {students.data.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="py-8 text-center text-muted-foreground"
                                                    >
                                                        {t(
                                                            'no_students_found',
                                                            'Bu sinfda o‘quvchilar topilmadi',
                                                        )}
                                                    </td>
                                                </tr>
                                            ) : (
                                                students.data.map(
                                                    (student, idx) => (
                                                        <tr
                                                            key={student.id}
                                                            className="transition-colors hover:bg-muted/30"
                                                        >
                                                            <td className="px-3 py-2.5 font-mono text-muted-foreground">
                                                                {idx + 1}
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <div className="flex items-center gap-2.5">
                                                                    {student.face_image ? (
                                                                        <img
                                                                            src={`/storage/${student.face_image}`}
                                                                            alt={
                                                                                student.name
                                                                            }
                                                                            onClick={() =>
                                                                                setPreviewImage(
                                                                                    `/storage/${student.face_image}`,
                                                                                )
                                                                            }
                                                                            className="h-8 w-8 shrink-0 cursor-pointer rounded-full border border-border object-cover hover:opacity-80"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                                                                            {student.name.charAt(
                                                                                0,
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <div className="font-semibold text-foreground">
                                                                            {
                                                                                student.name
                                                                            }
                                                                        </div>
                                                                        {student.phone && (
                                                                            <div className="font-mono text-[11px] text-muted-foreground">
                                                                                {
                                                                                    student.phone
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2.5 font-mono">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-medium text-foreground">
                                                                        {student.employeeNoString ||
                                                                            student.id}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            copyToClipboard(
                                                                                student.employeeNoString ||
                                                                                    String(
                                                                                        student.id,
                                                                                    ),
                                                                                String(
                                                                                    student.id,
                                                                                ),
                                                                            )
                                                                        }
                                                                        className="rounded p-1 text-muted-foreground hover:text-foreground"
                                                                        title="Nusxalash"
                                                                    >
                                                                        {copiedId ===
                                                                        String(
                                                                            student.id,
                                                                        ) ? (
                                                                            <Check className="h-3 w-3 text-emerald-500" />
                                                                        ) : (
                                                                            <Copy className="h-3 w-3" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <span
                                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                                        student.status ===
                                                                        'active'
                                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                                            : 'bg-muted text-muted-foreground'
                                                                    }`}
                                                                >
                                                                    {student.status ===
                                                                    'active'
                                                                        ? 'Faol'
                                                                        : 'Nofaol'}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2.5 text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => {
                                                                            setEventStudent(
                                                                                student,
                                                                            );
                                                                            setIsEventModalOpen(
                                                                                true,
                                                                            );
                                                                        }}
                                                                        className="h-7 w-7 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/50"
                                                                        title={t(
                                                                            'hikvision_events',
                                                                            'Hikvision hodisalari va sinxronlash',
                                                                        )}
                                                                    >
                                                                        <CalendarCheck className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => {
                                                                            setStudentToEdit(
                                                                                student,
                                                                            );
                                                                            setIsStudentModalOpen(
                                                                                true,
                                                                            );
                                                                        }}
                                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                                        title={t(
                                                                            'edit',
                                                                            'Tahrirlash',
                                                                        )}
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() =>
                                                                            setDeleteStudentItem(
                                                                                student,
                                                                            )
                                                                        }
                                                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                                        title={t(
                                                                            'delete',
                                                                            'O‘chirish',
                                                                        )}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {students.links &&
                                    students.links.length > 3 && (
                                        <div className="mt-3 border-t border-border p-3">
                                            <Pagination
                                                links={students.links}
                                            />
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: 30% — QURILMALAR */}
                    <div className="space-y-4 lg:col-span-3">
                        <BranchDeviceTable branch={branch} layout="stack" />
                    </div>
                </div>
            </div>

            {/* Modals & Dialogs */}
            <CreateBranchShiftModal
                branch={branch}
                shiftToEdit={shiftToEdit}
                open={isShiftModalOpen}
                onOpenChange={(open) => {
                    setIsShiftModalOpen(open);
                    if (!open) setShiftToEdit(null);
                }}
            />

            <CreateBranchClassModal
                branch={branch}
                defaultShiftId={selectedShiftId}
                classToEdit={classToEdit}
                open={isClassModalOpen}
                onOpenChange={(open) => {
                    setIsClassModalOpen(open);
                    if (!open) setClassToEdit(null);
                }}
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

            {/* Delete Confirmation Dialogs */}
            <DeleteConfirmDialog
                open={deleteShiftItem !== null}
                onOpenChange={(open) => !open && setDeleteShiftItem(null)}
                onConfirm={handleConfirmDeleteShift}
                title={t('confirm_delete_shift_title', 'Smenani o‘chirish')}
                description={t(
                    'confirm_delete_shift_desc',
                    'Ushbu smenani o‘chirishni tasdiqlaysizmi? Unga biriktirilgan barcha sinflar va dars jadvallari ta’sirlanishi mumkin.',
                )}
            />

            <DeleteConfirmDialog
                open={deleteClassItem !== null}
                onOpenChange={(open) => !open && setDeleteClassItem(null)}
                onConfirm={handleConfirmDeleteClass}
                title={t('confirm_delete_class_title', 'Sinfni o‘chirish')}
                description={t(
                    'confirm_delete_class_desc',
                    'Ushbu sinfni o‘chirishni tasdiqlaysizmi? Unga biriktirilgan barcha o‘quvchilar ta’sirlanishi mumkin.',
                )}
            />

            <DeleteConfirmDialog
                open={deleteStudentItem !== null}
                onOpenChange={(open) => !open && setDeleteStudentItem(null)}
                onConfirm={handleConfirmDeleteStudent}
                title={t(
                    'confirm_delete_student_title',
                    'O‘quvchini o‘chirish',
                )}
                description={t(
                    'confirm_delete_student',
                    'Haqiqatan ham bu o‘quvchini o‘chirmoqchimisiz?',
                )}
            />
        </AppLayout>
    );
}
