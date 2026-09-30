import { router } from '@inertiajs/react';
import {
    Pencil,
    Trash2,
    Copy,
    Check,
    ScanFace,
    Radio,
    Network,
    RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { formatDateTime } from '@/lib/utils';
import type { Branch, BranchDevice } from '@/types';
import CreateBranchDeviceModal from './create-branch-device-modal';
import DeviceConnectionGuideModal from './device-connection-guide-modal';

interface BranchDeviceTableProps {
    branch: Branch;
    layout?: 'grid' | 'stack';
}

export default function BranchDeviceTable({ branch, layout = 'grid' }: BranchDeviceTableProps) {
    const { t } = useTranslation();
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [syncingId, setSyncingId] = useState<number | null>(null);
    const [deleteDeviceId, setDeleteDeviceId] = useState<number | null>(null);
    const [deviceToEdit, setDeviceToEdit] = useState<BranchDevice | null>(null);
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

    const devices = branch.devices || [];

    const handleDelete = (id: number) => {
        setDeleteDeviceId(id);
    };

    const handleConfirmDelete = () => {
        if (!deleteDeviceId) return;

        router.delete(`/branch_device/${deleteDeviceId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t(
                        'deleted_successfully',
                        'Qurilma muvaffaqiyatli o‘chirildi',
                    ),
                );
                setDeleteDeviceId(null);
            },
            onError: (err: any) => {
                const errorMessage =
                    err?.error ||
                    t('delete_failed', 'O‘chirishda xatolik yuz berdi');
                toast.error(errorMessage);
            },
        });
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
                    t(
                        'sync_success',
                        `ISUP hodisalar muvaffaqiyatli sinxronlandi (${count} ta yangi hodisa)`,
                    ),
                );
                router.reload({ only: ['branch'] });
            } else {
                toast.error(
                    data.message || t('sync_failed', 'Sinxronizatsiyada xatolik yuz berdi'),
                );
            }
        } catch (err: any) {
            toast.error(
                err?.message || t('sync_failed', 'Sinxronizatsiyada xatolik yuz berdi'),
            );
        } finally {
            setSyncingId(null);
        }
    };

    const copyToClipboard = (text: string, deviceId: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(deviceId);
        toast.success(t('copied', 'Nusxalandi!'));
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatLastSeen = (dateStr?: string | null) => {
        if (!dateStr) return null;
        return formatDateTime(dateStr);
    };

    return (
        <div className="space-y-4">
            {/* Header bar */}
            <div className={`flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs min-w-0 max-w-full overflow-hidden ${layout === 'stack' ? '' : 'sm:flex-row sm:items-center'}`}>
                <div className="min-w-0 max-w-full">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-foreground sm:text-base">
                        <ScanFace className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                        <span className="truncate">
                            {t('connected_devices', 'Hikvision Qurilmalari')}
                        </span>
                        <span className="shrink-0 text-xs font-normal text-muted-foreground">
                            ({devices.length} {t('devices_count', 'ta')})
                        </span>
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {t(
                            'device_table_desc',
                            'Filialga biriktirilgan ISUP 5.0 va HTTP Listening terminallari',
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <DeviceConnectionGuideModal branch={branch} />
                    <CreateBranchDeviceModal branch={branch} />
                </div>
            </div>

            {/* Empty state */}
            {devices.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                        <ScanFace className="h-6 w-6" />
                    </div>
                    <h4 className="mb-1 text-sm font-semibold text-foreground">
                        {t('no_devices_title', 'Hozircha qurilma ulanmagan')}
                    </h4>
                    <p className="mx-auto mb-4 max-w-sm text-xs text-muted-foreground">
                        {t(
                            'no_devices_desc',
                            'Hikvision MinMoe yuz terminalini ISUP 5.0 yoki HTTP listening orqali ulang.',
                        )}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <DeviceConnectionGuideModal branch={branch} />
                        <CreateBranchDeviceModal branch={branch} />
                    </div>
                </div>
            ) : (
                /* Devices Container */
                <div className={layout === 'stack' ? 'flex flex-col gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
                    {devices.map((item, index) => {
                        const isIsup = item.connection_type === 'isup';
                        const isOnline = item.is_online;

                        return (
                            <div
                                key={item.id}
                                className="relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md min-w-0 max-w-full"
                            >
                                <div className="space-y-3 min-w-0">
                                    {/* Top Row: Device Name & Connection Pill */}
                                    <div className="flex items-start justify-between gap-2 min-w-0">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                                <ScanFace className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs leading-tight font-bold text-foreground sm:text-sm truncate" title={item.name || `Hikvision Terminal #${index + 1}`}>
                                                    {item.name ||
                                                        `Hikvision Terminal #${index + 1}`}
                                                </h4>
                                                <p className="font-mono text-[10px] text-muted-foreground truncate">
                                                    MinMoe Face Terminal
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            {isIsup ? (
                                                <span className="inline-flex items-center gap-1 rounded border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 shrink-0">
                                                    <Network className="h-3 w-3 shrink-0" />
                                                    <span>ISUP 5.0</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                                                    <Radio className="h-3 w-3 shrink-0" />
                                                    <span>HTTP</span>
                                                </span>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setDeviceToEdit(item);
                                                    setIsDeviceModalOpen(true);
                                                }}
                                                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                title={t('edit', 'Tahrirlash')}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleDelete(item.id)
                                                }
                                                className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                title={t('delete', 'O‘chirish')}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Specs / Properties Box */}
                                    <div className="space-y-1.5 rounded-lg border border-border bg-muted/60 p-2.5 font-mono text-xs">
                                        {/* Device ID */}
                                        {item.device_id && (
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="font-sans text-muted-foreground">
                                                    Device ID:
                                                </span>
                                                <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 font-semibold text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400">
                                                    {item.device_id}
                                                </span>
                                            </div>
                                        )}

                                        {/* MAC Address with copy */}
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-sans text-muted-foreground">
                                                MAC:
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-foreground">
                                                    {item.mac_address}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            item.mac_address,
                                                            item.id,
                                                        )
                                                    }
                                                    className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                                                    title={t(
                                                        'copy_mac',
                                                        'MAC manzilni nusxalash',
                                                    )}
                                                >
                                                    {copiedId === item.id ? (
                                                        <Check className="h-3 w-3 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Port & Protocol */}
                                        <div className="flex items-center justify-between border-t border-border pt-1 text-[11px]">
                                            <span className="font-sans text-muted-foreground">
                                                Port / Protocol:
                                            </span>
                                            <span className="font-sans text-[11px] text-foreground">
                                                {isIsup
                                                    ? 'Port 7660 (ISUP)'
                                                    : 'Port 80/443 (HTTP)'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Terminal Bottom Status Bar */}
                                    <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-1.5">
                                                {isOnline ? (
                                                    <>
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                                        </span>
                                                        <span className="font-sans font-semibold text-emerald-600 dark:text-emerald-400">
                                                            {t(
                                                                'online_active',
                                                                'Online • Faol',
                                                            )}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                                                        </span>
                                                        <span className="font-sans font-medium text-rose-500">
                                                            {t(
                                                                'offline_inactive',
                                                                'Offline • Aloqada emas',
                                                            )}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {isIsup && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={
                                                        syncingId === item.id
                                                    }
                                                    onClick={() =>
                                                        handleSync(item)
                                                    }
                                                    className="h-6 gap-1 px-2.5 text-[11px] font-medium"
                                                    title={t(
                                                        'sync_now',
                                                        'ISUP orqali hodisalarni tortib olish',
                                                    )}
                                                >
                                                    <RefreshCw
                                                        className={`h-3 w-3 ${syncingId === item.id ? 'animate-spin' : ''}`}
                                                    />
                                                    <span>
                                                        {t(
                                                            'sync',
                                                            'Sinxronlash',
                                                        )}
                                                    </span>
                                                </Button>
                                            )}
                                        </div>

                                        {item.last_seen_at && (
                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                {t('last_seen', 'Oxirgi aloqa')}: {formatLastSeen(item.last_seen_at)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <CreateBranchDeviceModal
                branch={branch}
                deviceToEdit={deviceToEdit}
                open={isDeviceModalOpen}
                onOpenChange={(open) => {
                    setIsDeviceModalOpen(open);
                    if (!open) setDeviceToEdit(null);
                }}
            />

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
        </div>
    );
}
