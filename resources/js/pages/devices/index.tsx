import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    ScanFace,
    Plus,
    Building2,
    Building,
    BookOpen,
    Search,
    RefreshCw,
    Trash2,
    Check,
    Copy,
    Radio,
    ShieldCheck,
    Network,
    ArrowUpRight,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import CreateBranchDeviceModal from '@/components/branch/create-branch-device-modal';
import DeviceConnectionGuideModal from '@/components/branch/device-connection-guide-modal';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/pagination';
import { formatDateTime } from '@/lib/utils';
import type { Branch, BranchDevice, BreadcrumbItem, PaginatedResponse } from '@/types';

interface DevicesPageProps {
    devices: PaginatedResponse<BranchDevice>;
    schools?: { id: number; name: string }[];
    branches: (Branch & { school_id?: number })[];
    filters?: {
        search?: string;
        school_id?: string;
        branch_id?: string;
        connection_type?: string;
        is_online?: string;
        per_page?: string | number;
    };
}

export default function DevicesPage({ devices, schools = [], branches, filters }: DevicesPageProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [syncingId, setSyncingId] = useState<number | null>(null);
    const [deleteDeviceId, setDeleteDeviceId] = useState<number | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('sidebar.devices', 'Qurilmalar'), href: '/devices' },
    ];

    const handleFilterChange = (key: string, value: string) => {
        const nextFilters: any = { ...filters, [key]: value, search: searchTerm };
        if (key === 'school_id' && value && nextFilters.branch_id) {
            const valid = branches.some(
                (b) => String(b.id) === String(nextFilters.branch_id) && String(b.school_id) === value
            );
            if (!valid) {
                delete nextFilters.branch_id;
            }
        }
        router.get(
            '/devices',
            nextFilters,
            { preserveState: true, replace: true },
        );
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        router.get('/devices', {}, { preserveState: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/devices',
            { ...filters, search: searchTerm },
            { preserveState: true, replace: true },
        );
    };

    const copyToClipboard = (text: string, deviceId: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(deviceId);
        toast.success(t('copied', 'Nusxalandi!'));
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSync = async (device: BranchDevice) => {
        setSyncingId(device.id);
        try {
            const xsrfToken = document.cookie
                .split('; ')
                .find((row) => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];

            const response = await fetch(`/branch_device/${device.id}/sync`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
                },
            });

            const data = await response.json();
            if (response.ok && data.success !== false) {
                const count = data.synced_count ?? 0;
                toast.success(
                    t('sync_success', `ISUP hodisalar muvaffaqiyatli sinxronlandi (${count} ta)`),
                );
                router.reload({ only: ['devices'] });
            } else {
                toast.error(data.message || t('sync_failed', 'Sinxronizatsiyada xatolik'));
            }
        } catch (err: any) {
            toast.error(err?.message || t('sync_failed', 'Sinxronizatsiyada xatolik'));
        } finally {
            setSyncingId(null);
        }
    };

    const handleDelete = (id: number) => {
        setDeleteDeviceId(id);
    };

    const handleConfirmDelete = () => {
        if (!deleteDeviceId) return;

        router.delete(`/branch_device/${deleteDeviceId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('deleted_successfully', 'Qurilma muvaffaqiyatli o‘chirildi'));
                setDeleteDeviceId(null);
            },
            onError: (err: any) => {
                toast.error(err?.error || t('delete_failed', 'O‘chirishda xatolik yuz berdi'));
            },
        });
    };

    const isupCount = devices.data.filter(d => d.connection_type === 'isup').length;
    const onlineCount = devices.data.filter(d => d.is_online).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('sidebar.devices', 'Qurilmalar')} />

            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 max-w-full">
                {/* Header Banner */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                            <ScanFace className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                {t('devices_title', 'Hikvision Qurilmalari')}
                            </h1>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {t('devices_subtitle', 'Filiallarga ulangan ISUP 5.0 va HTTP Listening terminallarini boshqarish')}
                            </p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {branches.length > 0 && (
                            <DeviceConnectionGuideModal
                                branch={branches[0]}
                                branches={branches}
                            />
                        )}
                        <CreateBranchDeviceModal
                            branches={branches}
                        />
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                        {/* School filter (Foreign key: school_id) */}
                        {schools.length > 0 && (
                            <div className="w-full sm:w-44">
                                <Select
                                    value={filters?.school_id || 'all'}
                                    onValueChange={(val) => handleFilterChange('school_id', val === 'all' ? '' : val)}
                                >
                                    <SelectTrigger className="h-9 rounded-xl text-xs">
                                        <SelectValue placeholder={t('select_school', 'Barcha maktablar')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('select_school', 'Barcha maktablar')}</SelectItem>
                                        {schools.map(s => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Branch filter (Foreign key: branch_id) */}
                        <div className="w-full sm:w-44">
                            <Select
                                value={filters?.branch_id || 'all'}
                                onValueChange={(val) => handleFilterChange('branch_id', val === 'all' ? '' : val)}
                            >
                                <SelectTrigger className="h-9 rounded-xl text-xs">
                                    <SelectValue placeholder={t('all_branches', 'Barcha filiallar')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('all_branches', 'Barcha filiallar')}</SelectItem>
                                    {(filters?.school_id
                                        ? branches.filter(b => String(b.school_id) === String(filters.school_id))
                                        : branches
                                    ).map(b => (
                                        <SelectItem key={b.id} value={String(b.id)}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Connection type filter */}
                        <div className="w-full sm:w-36">
                            <Select
                                value={filters?.connection_type || 'all'}
                                onValueChange={(val) => handleFilterChange('connection_type', val === 'all' ? '' : val)}
                            >
                                <SelectTrigger className="h-9 rounded-xl text-xs">
                                    <SelectValue placeholder={t('all_protocols', 'Barcha turlar')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('all_protocols', 'Barcha turlar')}</SelectItem>
                                    <SelectItem value="isup">ISUP 5.0</SelectItem>
                                    <SelectItem value="http_listening">HTTP Listening</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Online status filter */}
                        <div className="w-full sm:w-36">
                            <Select
                                value={filters?.is_online || 'all'}
                                onValueChange={(val) => handleFilterChange('is_online', val === 'all' ? '' : val)}
                            >
                                <SelectTrigger className="h-9 rounded-xl text-xs">
                                    <SelectValue placeholder={t('all_status', 'Barcha holatlar')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('all_status', 'Barcha holatlar')}</SelectItem>
                                    <SelectItem value="1">{t('online', 'Online')}</SelectItem>
                                    <SelectItem value="0">{t('offline', 'Offline')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Search box & Pagination limit & Reset */}
                    <div className="flex items-center gap-2">
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <div className="relative w-48 sm:w-56">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('search_devices_ph', 'Nomi, MAC yoki ID...')}
                                    className="h-9 pl-8 text-xs rounded-xl"
                                />
                            </div>
                        </form>

                        {Boolean(
                            filters?.school_id ||
                            filters?.branch_id ||
                            filters?.connection_type ||
                            filters?.is_online ||
                            filters?.search ||
                            (filters?.per_page && String(filters?.per_page) !== '20')
                        ) && (
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

                        <Select
                            value={String(filters?.per_page || '20')}
                            onValueChange={(val) => handleFilterChange('per_page', val)}
                        >
                            <SelectTrigger className="w-[100px] h-9 text-xs rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="20">20 {t('common.items', 'ta')}</SelectItem>
                                <SelectItem value="50">50 {t('common.items', 'ta')}</SelectItem>
                                <SelectItem value="100">100 {t('common.items', 'ta')}</SelectItem>
                                <SelectItem value="all">{t('common.all', 'Barchasi')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Devices Table Card */}
                <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[950px] text-left text-xs text-foreground">
                            <thead className="border-b border-border bg-muted/60 font-semibold text-muted-foreground uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">{t('device_name', 'Qurilma nomi')}</th>
                                    <th className="px-4 py-3">{t('branch', 'Filial')}</th>
                                    <th className="px-4 py-3">{t('connection_type', 'Protokol')}</th>
                                    <th className="px-4 py-3">{t('device_id', 'Device ID')}</th>
                                    <th className="px-4 py-3">{t('mac_address', 'MAC manzil')}</th>
                                    <th className="px-4 py-3 text-center">{t('status', 'Holat')}</th>
                                    <th className="px-4 py-3">{t('last_seen', 'Oxirgi aloqa')}</th>
                                    <th className="px-4 py-3 text-right">{t('actions', 'Amallar')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                                {devices.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                            <ScanFace className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm font-medium">{t('no_devices', 'Hozircha qurilmalar mavjud emas')}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {t('add_device_hint', 'Yuqoridagi "+ Qurilma qo‘shish" tugmasi orqali ISUP 5.0 yoki HTTP terminal ulang')}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    devices.data.map((item) => {
                                        const isIsup = item.connection_type === 'isup';
                                        const isOnline = item.is_online;

                                        return (
                                            <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                                                <td className="px-4 py-3 font-semibold text-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                        <span>{item.name || 'Hikvision Terminal'}</span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    {item.branch ? (
                                                        <Link
                                                            href={`/branches/${item.branch.id}`}
                                                            className="inline-flex items-center gap-1 font-medium text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                        >
                                                            <Building className="w-3.5 h-3.5 text-muted-foreground" />
                                                            <span>{item.branch.name}</span>
                                                            {(item.branch as any).school && (
                                                                <span className="text-[11px] text-muted-foreground">
                                                                    ({((item.branch as any).school.name)})
                                                                </span>
                                                            )}
                                                            <ArrowUpRight className="w-3 h-3 opacity-50" />
                                                        </Link>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                                        isIsup
                                                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                                                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                                    }`}>
                                                        {isIsup ? 'ISUP 5.0' : 'HTTP Listening'}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 font-mono text-xs">
                                                    <span className="px-1.5 py-0.5 rounded bg-muted text-foreground">
                                                        {item.device_id || `branch${item.branch_id}`}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 font-mono text-xs text-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{item.mac_address}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => copyToClipboard(item.mac_address, item.id)}
                                                            className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                                                            title={t('copy_mac', 'MAC manzilni nusxalash')}
                                                        >
                                                            {copiedId === item.id ? (
                                                                <Check className="w-3 h-3 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    {isOnline ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            <span>{t('online', 'Online')}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                            <span>{t('offline', 'Offline')}</span>
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                                                    {item.last_seen_at ? formatDateTime(item.last_seen_at) : '—'}
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {isIsup && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                disabled={syncingId === item.id}
                                                                onClick={() => handleSync(item)}
                                                                className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                                                                title={t('sync_now', 'ISUP hodisalarini sinxronlash')}
                                                            >
                                                                <RefreshCw className={`w-3.5 h-3.5 ${syncingId === item.id ? 'animate-spin text-indigo-600' : ''}`} />
                                                                <span className="hidden sm:inline">{t('sync', 'Sinxron')}</span>
                                                            </Button>
                                                        )}

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(item.id)}
                                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                                                            title={t('delete', 'O‘chirish')}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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

                    {devices.links && devices.links.length > 3 && (
                        <div className="p-4 border-t border-border">
                            <Pagination links={devices.links} />
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmDialog
                open={deleteDeviceId !== null}
                onOpenChange={(open) => !open && setDeleteDeviceId(null)}
                onConfirm={handleConfirmDelete}
                title={t('confirm_delete_device_title', 'Qurilmani o‘chirish')}
                description={t(
                    'confirm_delete_device',
                    'Haqiqatan ham bu qurilmani o‘chirmoqchimisiz?',
                )}
            />
        </AppLayout>
    );
}
