import { Head, useForm, router } from '@inertiajs/react';
import { ScanFace } from 'lucide-react';
import type { FormEvent} from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BranchDeviceTable from '@/components/branch/branch-device-table';
import { BranchesTable } from '@/components/branches/BranchesTable';
import { BranchForm } from '@/components/branches/BranchForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Branch, PaginatedResponse } from '@/types';

interface BranchesPageProps {
    branches: PaginatedResponse<Branch>;
    filters?: {
        per_page?: string;
    };
}

export default function BranchesPage({ branches, filters }: BranchesPageProps) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [{ title: t('branches.title', 'Branches'), href: '/branches' }];

    const { data: filterData, setData: setFilterData } = useForm({
        per_page: filters?.per_page || '20',
    });

    const handleFilter = (val: string) => {
        setFilterData('per_page', val);
        router.get('/branches', { per_page: val }, { preserveState: true, replace: true });
    };

    const [editing, setEditing] = useState<Branch | null>(null);
    const [devicesBranch, setDevicesBranch] = useState<Branch | null>(null);

    const { data: formData, setData, post, put, delete: destroy, reset, errors, clearErrors } = useForm({
        name: '',
        description: '',
        mac_addresses: [] as string[],
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editing) {
            put(`/branches/${editing.id}`, {
                onSuccess: () => { setEditing(null); reset(); },
            });
        } else {
            post('/branches', { onSuccess: () => reset() });
        }
    };

    const handleEdit = (branch: Branch) => {
        setEditing(branch);
        clearErrors();
        setData({
            name: branch.name,
            description: branch.description || '',
            mac_addresses: branch.mac_address_list || [],
        });
    };

    const handleDelete = (id: number) => {
        if (confirm(t('branches.delete_confirm', 'Are you sure you want to delete this branch?'))) {
            destroy(`/branches/${id}`);
        }
    };

    // Reactively find the active branch from updated props
    const activeDeviceBranch = devicesBranch
        ? branches?.data?.find((b: Branch) => b.id === devicesBranch.id) || devicesBranch
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('branches.title', 'Branches')} />
            <div className="p-6 grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                <BranchForm
                    editing={editing}
                    formData={formData}
                    errors={errors}
                    setData={setData}
                    onSubmit={handleSubmit}
                    onCancel={() => { setEditing(null); reset(); clearErrors(); }}
                />
                <BranchesTable
                    branches={branches}
                    perPage={filterData.per_page}
                    onPerPageChange={handleFilter}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onManageDevices={(branch) => setDevicesBranch(branch)}
                />
            </div>

            {/* Hikvision Devices Management Dialog */}
            <Dialog open={!!devicesBranch} onOpenChange={(open) => !open && setDevicesBranch(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <ScanFace className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <span>
                                {activeDeviceBranch?.name} - {t('branches.device_management', 'Hikvision Qurilmalarini Boshqarish')}
                            </span>
                        </DialogTitle>
                        <DialogDescription>
                            {t('branches.device_management_desc', 'Filialga biriktirilgan ISUP 5.0 va HTTP Listening terminallarini sozlash, sinxronlash va holatini kuzatish.')}
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

