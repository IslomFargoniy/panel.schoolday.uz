import { Head, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ShiftForm } from '@/components/shifts/ShiftForm';
import { ShiftsTable } from '@/components/shifts/ShiftsTable';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Shift, Branch, PaginatedResponse } from '@/types';

interface ShiftsPageProps {
    shifts: PaginatedResponse<Shift>;
    schools?: { id: number; name: string }[];
    branches: Branch[];
    filters?: {
        per_page?: string;
        school_id?: string;
        branch_id?: string;
        search?: string;
    };
}

export default function ShiftsPage({
    shifts,
    schools = [],
    branches,
    filters,
}: ShiftsPageProps) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('shifts.title', 'Shifts'), href: '/shifts' },
    ];

    const [filterData, setFilterData] = useState({
        per_page: filters?.per_page || '20',
        school_id: filters?.school_id || '',
        branch_id: filters?.branch_id || '',
        search: filters?.search || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        const next = { ...filterData, [key]: value };
        setFilterData(next);
        router.get('/shifts', next, { preserveState: true, replace: true });
    };

    const handleResetFilters = () => {
        const resetData = { per_page: '20', school_id: '', branch_id: '', search: '' };
        setFilterData(resetData);
        router.get('/shifts', resetData, { preserveState: true, replace: true });
    };

    const [editing, setEditing] = useState<Shift | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [deleteShiftId, setDeleteShiftId] = useState<number | null>(null);

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
        start_time: '',
        end_time: '',
        branch_id: '',
    });

    const handleTimeChange = (
        field: 'start_time' | 'end_time',
        val: string,
    ) => {
        if (val.length < formData[field].length) {
            setData(field, val);
            return;
        }
        let v = val.replace(/\D/g, '');
        if (v.length > 4) v = v.substring(0, 4);
        let hrs = v.substring(0, 2);
        let mins = v.substring(2, 4);
        if (hrs.length === 2 && parseInt(hrs) > 23) hrs = '23';
        if (mins.length === 2 && parseInt(mins) > 59) mins = '59';
        let formatted = hrs;
        if (v.length > 2) formatted += ':' + mins;
        setData(field, formatted);
    };

    const handleOpenCreate = () => {
        setEditing(null);
        reset();
        clearErrors();
        setIsFormModalOpen(true);
    };

    const handleEdit = (shift: Shift) => {
        setEditing(shift);
        clearErrors();
        setData({
            name: shift.name,
            start_time: shift.start_time
                ? shift.start_time.substring(0, 5)
                : '',
            end_time: shift.end_time ? shift.end_time.substring(0, 5) : '',
            branch_id: shift.branch_id ? String(shift.branch_id) : '',
        });
        setIsFormModalOpen(true);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!formData.branch_id) {
            toast.error(t('shifts.branch_required', 'Filialni tanlash majburiy!'));
            return;
        }
        if (editing) {
            put(`/shifts/${editing.id}`, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setEditing(null);
                    reset();
                },
            });
        } else {
            post('/shifts', {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleConfirmDelete = () => {
        if (!deleteShiftId) return;
        destroy(`/shifts/${deleteShiftId}`, {
            onSuccess: () => setDeleteShiftId(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('shifts.title', 'Shifts Management')} />
            <div className="p-4 sm:p-6 w-full min-w-0 max-w-full">
                <ShiftsTable
                    shifts={shifts}
                    schools={schools}
                    branches={branches}
                    filterData={filterData}
                    onFilterChange={handleFilterChange}
                    onResetFilters={handleResetFilters}
                    onCreate={handleOpenCreate}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteShiftId(id)}
                />
            </div>

            {/* Create / Edit Shift Modal */}
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
                                ? t('shifts.edit', 'Smenani tahrirlash')
                                : t('shifts.add_new', 'Yangi smena qo‘shish')}
                        </DialogTitle>
                    </DialogHeader>
                    <ShiftForm
                        editing={editing}
                        formData={formData}
                        errors={errors}
                        branches={branches}
                        setData={setData}
                        onTimeChange={handleTimeChange}
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
                open={deleteShiftId !== null}
                onOpenChange={(open) => !open && setDeleteShiftId(null)}
                onConfirm={handleConfirmDelete}
                title={t('shifts.delete_confirm_title', 'Smenani o‘chirish')}
                description={t(
                    'shifts.delete_confirm',
                    'Ushbu smenani o‘chirishni tasdiqlaysizmi? Unga bog‘langan ma’lumotlar ta’sirlanishi mumkin.',
                )}
            />
        </AppLayout>
    );
}
