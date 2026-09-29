import { router } from '@inertiajs/react';
import { Trash2, Copy, Check, ScanFace, Radio, Network, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { Branch, BranchDevice } from '@/types';
import CreateBranchDeviceModal from './create-branch-device-modal';
import DeviceConnectionGuideModal from './device-connection-guide-modal';

interface BranchDeviceTableProps {
    branch: Branch;
}

export default function BranchDeviceTable({ branch }: BranchDeviceTableProps) {
    const { t } = useTranslation();
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [syncingId, setSyncingId] = useState<number | null>(null);

    const devices = branch.devices || [];

    const handleDelete = (id: number) => {
        if (!confirm(t('confirm_delete_device', 'Haqiqatan ham bu qurilmani o‘chirmoqchimisiz?'))) {
            return;
        }

        router.delete(`/branch_device/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('deleted_successfully', 'Qurilma muvaffaqiyatli o‘chirildi'));
            },
            onError: (err: any) => {
                const errorMessage = err?.error || t('delete_failed', 'O‘chirishda xatolik yuz berdi');
                toast.error(errorMessage);
            },
        });
    };

    const handleSync = (device: BranchDevice) => {
        setSyncingId(device.id);
        router.post(`/branch_device/${device.id}/sync`, {}, {
            preserveScroll: true,
            onSuccess: (page: any) => {
                setSyncingId(null);
                toast.success(t('sync_success', 'ISUP hodisalar muvaffaqiyatli sinxronlandi'));
            },
            onError: (err: any) => {
                setSyncingId(null);
                toast.error(err?.message || t('sync_failed', 'Sinxronizatsiyada xatolik'));
            },
        });
    };

    const copyToClipboard = (text: string, deviceId: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(deviceId);
        toast.success(t('copied', 'Nusxalandi!'));
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatLastSeen = (dateStr?: string | null) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;

        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');

        return `${day}.${month} ${hours}:${minutes}`;
    };

    return (
        <div className="space-y-4">
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-xs">
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                        <ScanFace className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>{t('connected_devices', 'Hikvision Qurilmalari')}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                            ({devices.length} {t('devices_count', 'ta qurilma')})
                        </span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {t('device_table_desc', 'Filialga biriktirilgan ISUP 5.0 va HTTP Listening terminallari')}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <DeviceConnectionGuideModal branch={branch} />
                    <CreateBranchDeviceModal branch={branch} />
                </div>
            </div>

            {/* Empty state */}
            {devices.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center bg-card/50">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-3">
                        <ScanFace className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                        {t('no_devices_title', 'Hozircha qurilma ulanmagan')}
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                        {t('no_devices_desc', 'Hikvision MinMoe yuz terminalini ISUP 5.0 yoki HTTP listening orqali ulang.')}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <DeviceConnectionGuideModal branch={branch} />
                        <CreateBranchDeviceModal branch={branch} />
                    </div>
                </div>
            ) : (
                /* Devices Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {devices.map((item, index) => {
                        const isIsup = item.connection_type === 'isup';
                        const isOnline = item.is_online;

                        return (
                            <div
                                key={item.id}
                                className="relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md"
                            >
                                <div className="space-y-3">
                                    {/* Top Row: Device Name & Connection Pill */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                                <ScanFace className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                                                    {item.name || `Hikvision Terminal #${index + 1}`}
                                                </h4>
                                                <p className="text-[10px] text-muted-foreground font-mono">
                                                    MinMoe Face Terminal
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {isIsup ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                                    <Network className="w-3 h-3" />
                                                    <span>ISUP 5.0</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                    <Radio className="w-3 h-3" />
                                                    <span>HTTP</span>
                                                </span>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(item.id)}
                                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                title={t('delete', 'O‘chirish')}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Specs / Properties Box */}
                                    <div className="rounded-lg bg-muted/60 border border-border p-2.5 space-y-1.5 text-xs font-mono">
                                        {/* Device ID */}
                                        {item.device_id && (
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-muted-foreground font-sans">Device ID:</span>
                                                <span className="text-indigo-600 dark:text-indigo-400 font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                                                    {item.device_id}
                                                </span>
                                            </div>
                                        )}

                                        {/* MAC Address with copy */}
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-muted-foreground font-sans">MAC:</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-foreground">{item.mac_address}</span>
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
                                        </div>

                                        {/* Port & Protocol */}
                                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border">
                                            <span className="text-muted-foreground font-sans">Port / Protocol:</span>
                                            <span className="text-foreground font-sans text-[11px]">
                                                {isIsup ? 'Port 7660 (ISUP)' : 'Port 80/443 (HTTP)'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Terminal Bottom Status Bar */}
                                    <div className="flex items-center justify-between pt-1 text-[11px]">
                                        <div className="flex items-center gap-1.5">
                                            {isOnline ? (
                                                <>
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                                    </span>
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-sans">
                                                        {t('online_active', 'Online • Faol')}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                                                    </span>
                                                    <span className="text-rose-500 font-medium font-sans">
                                                        {t('offline_inactive', 'Offline • Aloqada emas')}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isIsup && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={syncingId === item.id}
                                                    onClick={() => handleSync(item)}
                                                    className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                                                    title={t('sync_now', 'ISUP orqali hodisalarni tortib olish')}
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${syncingId === item.id ? 'animate-spin' : ''}`} />
                                                    <span>{t('sync', 'Sinxronlash')}</span>
                                                </Button>
                                            )}

                                            {item.last_seen_at ? (
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {t('last_seen', 'Oxirgi aloqa')}: {formatLastSeen(item.last_seen_at)}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {t('biometric_sync', 'Biometric Sync')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
