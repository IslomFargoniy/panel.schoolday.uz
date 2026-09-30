import { Head, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ClassesTable } from '@/components/classes/ClassesTable';
import { ClassFilters } from '@/components/classes/ClassFilters';
import { ClassForm } from '@/components/classes/ClassForm';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type {
    BreadcrumbItem,
    SchoolClass,
    Shift,
    PaginatedResponse,
} from '@/types';

interface ClassesPageFilters {
    school_id?: string;
    branch_id?: string;
    shift_id?: string;
    search?: string;
    per_page?: string;
}

interface ClassesPageProps {
    classes: PaginatedResponse<SchoolClass>;
    schools?: { id: number; name: string }[];
    branches?: { id: number; name: string; school_id?: number }[];
    shifts: (Shift & { branch_id?: number })[];
    filters: ClassesPageFilters;
}

export default function ClassesPage({
    classes,
    schools = [],
    branches = [],
    shifts,
    filters,
}: ClassesPageProps) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('classes.title', 'Classes'), href: '/classes' },
    ];

    const [filterData, setFilterData] = useState({
        school_id: filters?.school_id || '',
        branch_id: filters?.branch_id || '',
        shift_id: filters?.shift_id || '',
        search: filters?.search || '',
        per_page: filters?.per_page || '20',
    });

    const handleFilterChange = (key: string, value: string) => {
        const next = { ...filterData, [key]: value };
        setFilterData(next);
        router.get('/classes', next, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        const resetData = {
            school_id: '',
            branch_id: '',
            shift_id: '',
            search: '',
            per_page: '20',
        };
        setFilterData(resetData);
        router.get('/classes', resetData, {
            preserveState: true,
            replace: true,
        });
    };

    const [editing, setEditing] = useState<SchoolClass | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [deleteClassId, setDeleteClassId] = useState<number | null>(null);

    const {
        data: formData,
        setData,
        post,
        put,
        delete: destroy,
        reset,
        errors,
        clearErrors,
    } = useForm({
        name: '',
        shift_id: '',
        telegram_group_id: '',
    });

    const handleOpenCreate = () => {
        setEditing(null);
        reset();
        clearErrors();
        setIsFormModalOpen(true);
    };

    const handleEdit = (schoolClass: SchoolClass) => {
        setEditing(schoolClass);
        clearErrors();
        setData({
            name: schoolClass.name,
            shift_id: String(schoolClass.shift_id),
            telegram_group_id: schoolClass.telegram_group_id || '',
        });
        setIsFormModalOpen(true);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!formData.shift_id) {
            toast.error(
                t('classes.shift_required', 'Smenani tanlash majburiy!'),
            );
            return;
        }
        if (editing) {
            put(`/classes/${editing.id}`, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setEditing(null);
                    reset();
                },
            });
        } else {
            post('/classes', {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleConfirmDelete = () => {
        if (!deleteClassId) return;
        destroy(`/classes/${deleteClassId}`, {
            onSuccess: () => setDeleteClassId(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('classes.title', 'Classes')} />
            <div className="flex w-full max-w-full min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6">
                <ClassFilters
                    filterData={filterData}
                    schools={schools}
                    branches={branches}
                    shifts={shifts}
                    onFilterChange={handleFilterChange}
                    onReset={clearFilters}
                    onCreate={handleOpenCreate}
                />
                <ClassesTable
                    classes={classes}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteClassId(id)}
                />
            </div>

            {/* Create / Edit Class Modal */}
            <Dialog
                open={isFormModalOpen}
                onOpenChange={(open) => {
                    setIsFormModalOpen(open);
                    if (!open) {
                        setEditing(null);
                        reset();
                        clearErrors();
                    }
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editing
                                ? t('classes.edit', 'Sinfni tahrirlash')
                                : t('classes.add_new', 'Yangi sinf qo‘shish')}
                        </DialogTitle>
                    </DialogHeader>
                    <ClassForm
                        editing={editing}
                        formData={formData}
                        errors={errors}
                        shifts={shifts}
                        setData={setData}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setIsFormModalOpen(false);
                            setEditing(null);
                            reset();
                            clearErrors();
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmDialog
                open={deleteClassId !== null}
                onOpenChange={(open) => !open && setDeleteClassId(null)}
                onConfirm={handleConfirmDelete}
                title={t('classes.delete_confirm_title', 'Sinfni o‘chirish')}
                description={t(
                    'classes.delete_confirm',
                    'Ushbu sinfni o‘chirishni tasdiqlaysizmi? Barcha biriktirilgan o‘quvchilar va jurnallar ta’sirlanishi mumkin.',
                )}
            />
        </AppLayout>
    );
}
