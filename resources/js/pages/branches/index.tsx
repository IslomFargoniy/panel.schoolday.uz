import { Head, useForm, router } from '@inertiajs/react';
import { ScanFace } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BranchDeviceTable from '@/components/branch/branch-device-table';
import { BranchesTable } from '@/components/branches/BranchesTable';
import { BranchForm } from '@/components/branches/BranchForm';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Branch, PaginatedResponse } from '@/types';

interface BranchesPageProps {
    branches: PaginatedResponse<Branch>;
    schools?: { id: number; name: string; branch_limit: number }[];
    filters?: {
        per_page?: string;
        school_id?: string;
        search?: string;
    };
}

export default function BranchesPage({ branches, schools = [], filters }: BranchesPageProps) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('branches.title', 'Branches'), href: '/branches' },
    ];

    const [filterData, setFilterData] = useState({
        per_page: filters?.per_page || '20',
        school_id: filters?.school_id || '',
        search: filters?.search || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        const next = { ...filterData, [key]: value };
        setFilterData(next);
        router.get('/branches', next, { preserveState: true, replace: true });
    };

    const handleResetFilters = () => {
        const resetData = { per_page: '20', school_id: '', search: '' };
        setFilterData(resetData);
        router.get('/branches', resetData, { preserveState: true, replace: true });
    };

    const [editing, setEditing] = useState<Branch | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [deleteBranchId, setDeleteBranchId] = useState<number | null>(null);
    const [devicesBranch, setDevicesBranch] = useState<Branch | null>(null);

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
        school_id: filters?.school_id || (schools.length > 0 ? String(schools[0].id) : ''),
        name: '',
        description: '',
        mac_addresses: [] as string[],
    });

    const handleOpenCreate = () => {
        setEditing(null);
        clearErrors();
        reset();
        setIsFormModalOpen(true);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editing) {
            put(`/branches/${editing.id}`, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    setEditing(null);
                    reset();
                },
            });
        } else {
            post('/branches', {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleEdit = (branch: Branch) => {
        setEditing(branch);
        clearErrors();
        setData({
            school_id: (branch as any).school_id ? String((branch as any).school_id) : '',
            name: branch.name,
            description: branch.description || '',
            mac_addresses: branch.mac_address_list || [],
        });
        setIsFormModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!deleteBranchId) return;
        destroy(`/branches/${deleteBranchId}`, {
            onSuccess: () => setDeleteBranchId(null),
        });
    };

    // Reactively find the active branch from updated props
    const activeDeviceBranch = devicesBranch
        ? branches?.data?.find((b: Branch) => b.id === devicesBranch.id) ||
          devicesBranch
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('branches.title', 'Branches')} />
            <div className="p-4 sm:p-6 w-full min-w-0 max-w-full">
                <BranchesTable
                    branches={branches}
                    schools={schools}
                    filterData={filterData}
                    onFilterChange={handleFilterChange}
                    onResetFilters={handleResetFilters}
                    onCreate={handleOpenCreate}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteBranchId(id)}
                    onManageDevices={(branch) => setDevicesBranch(branch)}
                />
            </div>

            {/* Create / Edit Branch Modal */}
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
                <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            {editing
                                ? t('branches.edit', 'Filialni tahrirlash')
                                : t('branches.add_new', 'Yangi filial qo‘shish')}
                        </DialogTitle>
                    </DialogHeader>
                    <BranchForm
                        editing={editing}
                        formData={formData}
                        errors={errors}
                        setData={setData}
                        onSubmit={handleSubmit}
                        schools={schools}
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
                open={!!deleteBranchId}
                onOpenChange={(open) => !open && setDeleteBranchId(null)}
                title={t('branches.delete_title', 'Filialni o‘chirish')}
                description={t(
                    'branches.delete_confirm',
                    'Haqiqatan ham bu filialni o‘chirib tashlamoqchimisiz? Ushbu filialga tegishli barcha smenalar va ma‘lumotlar ta‘sir ko‘rishi mumkin.',
                )}
                onConfirm={handleConfirmDelete}
            />

            {/* Hikvision Devices Management Dialog */}
            <Dialog
                open={!!devicesBranch}
                onOpenChange={(open) => !open && setDevicesBranch(null)}
            >
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <ScanFace className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            <span>
                                {activeDeviceBranch?.name} -{' '}
                                {t(
                                    'branches.device_management',
                                    'Hikvision Qurilmalarini Boshqarish',
                                )}
                            </span>
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'branches.device_management_desc',
                                'Filialga biriktirilgan ISUP 5.0 va HTTP Listening terminallarini sozlash, sinxronlash va holatini kuzatish.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {activeDeviceBranch && (
                        <div className="mt-2">
                            <BranchDeviceTable branch={activeDeviceBranch} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
