import {
    BookOpen,
    Check,
    Copy,
    HelpCircle,
    Network,
    ShieldCheck,
    Zap,
    Radio,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import type { Branch } from '@/types';

interface DeviceConnectionGuideModalProps {
    branch: Branch;
}

export default function DeviceConnectionGuideModal({
    branch,
}: DeviceConnectionGuideModalProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'isup' | 'http'>('isup');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const copyToClipboard = (text: string, label: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success(`${label} ${t('copied', 'nusxalandi!')}`);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const isupDeviceId = `branch${branch.id}`;
    const isupKey = `SchoolDay${branch.id}2026`;
    const serverIp = '193.180.213.188';
    const serverDomain = 'panel.schoolday.uz';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="flex items-center gap-1.5 border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0"
                >
                    <BookOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                        {t('guide', 'Yo‘riqnoma')}
                    </span>
                </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-card text-card-foreground shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                        <HelpCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        {t(
                            'device_guide_modal.title',
                            'Hikvision Qurilmasini Serverga Ulash Yo‘riqnomasi',
                        )}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground">
                        {t('branch', 'Filial')}:{' '}
                        <strong className="text-foreground">
                            {branch.name}
                        </strong>{' '}
                        (ID: {branch.id})
                    </p>
                </DialogHeader>

                {/* Tabs selection */}
                <div className="mt-2 flex gap-2 border-b border-border">
                    <button
                        type="button"
                        onClick={() => setActiveTab('isup')}
                        className={`flex items-center gap-2 rounded-t-lg border-b-2 px-3.5 py-2 text-xs font-semibold transition-all ${
                            activeTab === 'isup'
                                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
                                : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                    >
                        <Zap className="h-3.5 w-3.5 text-purple-500" />
                        <span>
                            {t(
                                'device_guide_modal.tab_isup',
                                '1-Usul: ISUP 5.0 (Tavsiya etiladi)',
                            )}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('http')}
                        className={`flex items-center gap-2 rounded-t-lg border-b-2 px-3.5 py-2 text-xs font-semibold transition-all ${
                            activeTab === 'http'
                                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
                                : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                    >
                        <Radio className="h-3.5 w-3.5 text-blue-500" />
                        <span>
                            {t(
                                'device_guide_modal.tab_http',
                                '2-Usul: HTTP Listening (An‘anaviy)',
                            )}
                        </span>
                    </button>
                </div>

                {/* Tab 1: ISUP 5.0 */}
                {activeTab === 'isup' && (
                    <div className="mt-3 space-y-4 text-xs text-foreground sm:text-sm">
                        <div className="space-y-1 rounded-xl border border-purple-500/20 bg-purple-500/10 p-3 text-xs leading-relaxed">
                            <strong className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                                <Zap className="h-4 w-4" />
                                {t(
                                    'device_guide_modal.isup_intro_title',
                                    'ISUP 5.0 (EHome 5.0) ning afzalliklari:',
                                )}
                            </strong>
                            <p className="text-muted-foreground">
                                1. <strong>Statik IP kerak emas:</strong>{' '}
                                Terminal Wi-Fi, 4G yoki oddiy provayderda
                                ishlayveradi.
                                <br />
                                2.{' '}
                                <strong>
                                    2 tomonlama to‘liq sinxronizatsiya:
                                </strong>{' '}
                                Davomat sekundiga keladi, internet uzilib qolsa
                                terminal xotirada saqlab, keyin avtomatik
                                yuklaydi.
                            </p>
                        </div>

                        <div className="space-y-3 text-xs">
                            <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                                    1
                                </span>
                                {t(
                                    'device_guide_modal.step1_title',
                                    'Hikvision Web paneliga kiring va menyuni oching:',
                                )}
                            </h4>
                            <div className="rounded-lg border border-border bg-muted p-2.5 font-mono text-xs">
                                Configuration ➔ Network ➔ Advanced ➔{' '}
                                <strong className="text-indigo-600 dark:text-indigo-400">
                                    Platform Access (yoki Device Access)
                                </strong>
                            </div>

                            <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                                    2
                                </span>
                                {t(
                                    'device_guide_modal.step2_title',
                                    'Quyidagi parametrlarni kiriting:',
                                )}
                            </h4>

                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                <div className="rounded-lg border border-border bg-muted/60 p-2.5">
                                    <div className="text-[11px] text-muted-foreground">
                                        Platform Access Mode:
                                    </div>
                                    <div className="font-mono font-semibold text-purple-600 dark:text-purple-400">
                                        ISUP 5.0 / EHome 5.0
                                    </div>
                                </div>

                                <div className="rounded-lg border border-border bg-muted/60 p-2.5">
                                    <div className="text-[11px] text-muted-foreground">
                                        Server Address Type:
                                    </div>
                                    <div className="font-mono font-semibold">
                                        IP Address
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/60 p-2.5">
                                    <div>
                                        <div className="text-[11px] text-muted-foreground">
                                            Server IP:
                                        </div>
                                        <div className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                                            {serverIp}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            copyToClipboard(
                                                serverIp,
                                                'Server IP',
                                                'serverIp',
                                            )
                                        }
                                        className="h-7 px-2"
                                    >
                                        {copiedKey === 'serverIp' ? (
                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/60 p-2.5">
                                    <div>
                                        <div className="text-[11px] text-muted-foreground">
                                            Server Port:
                                        </div>
                                        <div className="font-mono font-semibold">
                                            7660
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            copyToClipboard(
                                                '7660',
                                                'Server Port',
                                                'serverPort',
                                            )
                                        }
                                        className="h-7 px-2"
                                    >
                                        {copiedKey === 'serverPort' ? (
                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/60 p-2.5">
                                    <div>
                                        <div className="text-[11px] text-muted-foreground">
                                            Device ID:
                                        </div>
                                        <div className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                                            {isupDeviceId}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            copyToClipboard(
                                                isupDeviceId,
                                                'Device ID',
                                                'isupDeviceId',
                                            )
                                        }
                                        className="h-7 px-2"
                                    >
                                        {copiedKey === 'isupDeviceId' ? (
                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/60 p-2.5">
                                    <div>
                                        <div className="text-[11px] text-muted-foreground">
                                            Encryption Key / Register Password:
                                        </div>
                                        <div className="font-mono font-semibold">
                                            {isupKey}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            copyToClipboard(
                                                isupKey,
                                                'Encryption Key',
                                                'isupKey',
                                            )
                                        }
                                        className="h-7 px-2"
                                    >
                                        {copiedKey === 'isupKey' ? (
                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                                    3
                                </span>
                                {t(
                                    'device_guide_modal.step3_title',
                                    'Saqlash:',
                                )}
                            </h4>
                            <p className="pl-6 text-muted-foreground">
                                <strong>Save</strong> tugmasini bosing. 5-15
                                soniya ichida Register Status:{' '}
                                <strong className="text-emerald-500">
                                    🟢 Online
                                </strong>{' '}
                                bo‘ladi.
                            </p>
                        </div>
                    </div>
                )}

                {/* Tab 2: HTTP Listening */}
                {activeTab === 'http' && (
                    <div className="mt-3 space-y-4 text-xs text-foreground sm:text-sm">
                        <div className="space-y-1 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs leading-relaxed">
                            <strong className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                <Radio className="h-4 w-4" />
                                {t(
                                    'device_guide_modal.http_intro_title',
                                    'HTTP Listening (An‘anaviy usul):',
                                )}
                            </strong>
                            <p className="text-muted-foreground">
                                Ushbu usulda terminal har safar o‘quvchi yuzini
                                skaner qilganda serverga to‘g‘ridan-to‘g‘ri HTTP
                                webhook POST yuboradi.
                            </p>
                        </div>

                        <div className="space-y-3 text-xs">
                            <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                                    1
                                </span>
                                {t(
                                    'device_guide_modal.step1_title',
                                    'Hikvision Web paneliga kiring va menyuni oching:',
                                )}
                            </h4>
                            <div className="rounded-lg border border-border bg-muted p-2.5 font-mono text-xs">
                                Configuration ➔ Network ➔ Advanced ➔{' '}
                                <strong className="text-blue-600 dark:text-blue-400">
                                    HTTP Listening (yoki Alarm Center)
                                </strong>
                            </div>

                            <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                                    2
                                </span>
                                {t(
                                    'device_guide_modal.step2_title',
                                    'Quyidagi parametrlarni kiriting:',
                                )}
                            </h4>

                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/60 p-2.5">
                                    <div>
                                        <div className="text-[11px] text-muted-foreground">
                                            Destination IP / Domain:
                                        </div>
                                        <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                                            {serverDomain}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            copyToClipboard(
                                                serverDomain,
                                                'Domain',
                                                'serverDomain',
                                            )
                                        }
                                        className="h-7 px-2"
                                    >
                                        {copiedKey === 'serverDomain' ? (
                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/60 p-2.5">
                                    <div>
                                        <div className="text-[11px] text-muted-foreground">
                                            URL:
                                        </div>
                                        <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                                            /api/hikvision/events
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            copyToClipboard(
                                                '/api/hikvision/events',
                                                'URL',
                                                'url',
                                            )
                                        }
                                        className="h-7 px-2"
                                    >
                                        {copiedKey === 'url' ? (
                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>

                                <div className="rounded-lg border border-border bg-muted/60 p-2.5">
                                    <div className="text-[11px] text-muted-foreground">
                                        Port:
                                    </div>
                                    <div className="font-mono font-semibold">
                                        80 (yoki 443)
                                    </div>
                                </div>

                                <div className="rounded-lg border border-border bg-muted/60 p-2.5">
                                    <div className="text-[11px] text-muted-foreground">
                                        Protocol:
                                    </div>
                                    <div className="font-mono font-semibold">
                                        HTTP / HTTPS
                                    </div>
                                </div>
                            </div>

                            <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                                    3
                                </span>
                                {t(
                                    'device_guide_modal.step3_title',
                                    'Saqlash:',
                                )}
                            </h4>
                            <p className="pl-6 text-muted-foreground">
                                <strong>Save</strong> tugmasini bosing. Shundan
                                so‘ng o‘quvchilar yuzini ko‘rsatganda davomat
                                avtomatik serverga uzatiladi.
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-4 border-t border-border pt-3">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8.5 text-xs"
                        >
                            {t('close', 'Yopish')}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
