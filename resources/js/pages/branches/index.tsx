import { Head, useForm, router } from '@inertiajs/react';
import { ScanFace } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BranchDeviceTable from '@/components/branch/branch-device-table';
import { BranchesTable } from '@/components/branches/BranchesTable';
import { BranchForm } from '@/components/branches/BranchForm';
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

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editing) {
            put(`/branches/${editing.id}`, {
                onSuccess: () => {
                    setEditing(null);
                    reset();
                },
            });
        } else {
            post('/branches', { onSuccess: () => reset() });
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
    };

    const handleDelete = (id: number) => {
        if (
            confirm(
                t(
                    'branches.delete_confirm',
                    'Are you sure you want to delete this branch?',
                ),
            )
        ) {
            destroy(`/branches/${id}`);
        }
    };

    // Reactively find the active branch from updated props
    const activeDeviceBranch = devicesBranch
        ? branches?.data?.find((b: Branch) => b.id === devicesBranch.id) ||
          devicesBranch
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('branches.title', 'Branches')} />
            <div className="grid grid-cols-1 items-start gap-6 p-6 xl:grid-cols-4">
                <BranchForm
                    editing={editing}
                    formData={formData}
                    errors={errors}
                    setData={setData}
                    onSubmit={handleSubmit}
                    schools={schools}
                    onCancel={() => {
                        setEditing(null);
                        reset();
                        clearErrors();
                    }}
                />
                <BranchesTable
                    branches={branches}
                    schools={schools}
                    filterData={filterData}
                    onFilterChange={handleFilterChange}
                    onResetFilters={handleResetFilters}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onManageDevices={(branch) => setDevicesBranch(branch)}
                />
            </div>

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
