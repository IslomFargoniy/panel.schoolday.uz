import { BookOpen, Check, Copy, HelpCircle, Network, ShieldCheck, Zap, Radio } from 'lucide-react';
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

export default function DeviceConnectionGuideModal({ branch }: DeviceConnectionGuideModalProps) {
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
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('device_guide', 'Qurilmani ulash yo‘riqnomasi')}</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                        <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        {t('device_guide_modal.title', 'Hikvision Qurilmasini Serverga Ulash Yo‘riqnomasi')}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground">
                        {t('branch', 'Filial')}: <strong className="text-foreground">{branch.name}</strong> (ID: {branch.id})
                    </p>
                </DialogHeader>

                {/* Tabs selection */}
                <div className="flex border-b border-border gap-2 mt-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('isup')}
                        className={`flex items-center gap-2 py-2 px-3.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                            activeTab === 'isup'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                        <Zap className="w-3.5 h-3.5 text-purple-500" />
                        <span>{t('device_guide_modal.tab_isup', '1-Usul: ISUP 5.0 (Tavsiya etiladi)')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('http')}
                        className={`flex items-center gap-2 py-2 px-3.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                            activeTab === 'http'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                    >
                        <Radio className="w-3.5 h-3.5 text-blue-500" />
                        <span>{t('device_guide_modal.tab_http', '2-Usul: HTTP Listening (An‘anaviy)')}</span>
                    </button>
                </div>

                {/* Tab 1: ISUP 5.0 */}
                {activeTab === 'isup' && (
                    <div className="space-y-4 text-xs sm:text-sm text-foreground mt-3">
                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs leading-relaxed space-y-1">
                            <strong className="text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                                <Zap className="w-4 h-4" />
                                {t('device_guide_modal.isup_intro_title', 'ISUP 5.0 (EHome 5.0) ning afzalliklari:')}
                            </strong>
                            <p className="text-muted-foreground">
                                1. <strong>Statik IP kerak emas:</strong> Terminal Wi-Fi, 4G yoki oddiy provayderda ishlayveradi.<br />
                                2. <strong>2 tomonlama to‘liq sinxronizatsiya:</strong> Davomat sekundiga keladi, internet uzilib qolsa terminal xotirada saqlab, keyin avtomatik yuklaydi.
                            </p>
                        </div>

                        <div className="space-y-3 text-xs">
                            <h4 className="font-semibold flex items-center gap-1.5 text-foreground">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px]">1</span>
                                {t('device_guide_modal.step1_title', 'Hikvision Web paneliga kiring va menyuni oching:')}
                            </h4>
                            <div className="p-2.5 bg-muted rounded-lg border border-border font-mono text-xs">
                                Configuration ➔ Network ➔ Advanced ➔ <strong className="text-indigo-600 dark:text-indigo-400">Platform Access (yoki Device Access)</strong>
                            </div>

                            <h4 className="font-semibold flex items-center gap-1.5 text-foreground">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px]">2</span>
                                {t('device_guide_modal.step2_title', 'Quyidagi parametrlarni kiriting:')}
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="p-2.5 bg-muted/60 rounded-lg border border-border">
                                    <div className="text-muted-foreground text-[11px]">Platform Access Mode:</div>
                                    <div className="font-semibold font-mono text-purple-600 dark:text-purple-400">ISUP 5.0 / EHome 5.0</div>
                                </div>

                                <div className="p-2.5 bg-muted/60 rounded-lg border border-border">
                                    <div className="text-muted-foreground text-[11px]">Server Address Type:</div>
                                    <div className="font-semibold font-mono">IP Address</div>
                                </div>

                                <div className="p-2.5 bg-muted/60 rounded-lg border border-border flex justify-between items-center">
                                    <div>
                                        <div className="text-muted-foreground text-[11px]">Server IP:</div>
                                        <div className="font-semibold font-mono text-indigo-600 dark:text-indigo-400">{serverIp}</div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(serverIp, 'Server IP', 'serverIp')}
                                        className="h-7 px-2"
                                    >
                                        {copiedKey === 'serverIp' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </Button>
                                </div>

                                <div className="p-2.5 bg-muted/60 rounded-lg border border-border flex justify-between items-center">
                                    <div>
                                        <div className="text-muted-foreground text-[11px]">Server Port:</div>
                                        <div className="font-semibold font-mono">7660</div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard('7660', 'Server Port', 'serverPort')}
                                        className="h-7 px-2"
                                    >
                                        {copiedKey === 'serverPort' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </Button>
                                </div>

                                <div className="p-2.5 bg-muted/60 rounded-lg border border-border flex justify-between items-center">
                                    <div>
                                        <div className="text-muted-foreground text-[11px]">Device ID:</div>
                                        <div className="font-semibold font-mono text-indigo-600 dark:text-indigo-400">{isupDeviceId}</div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(isupDeviceId, 'Device ID', 'isupDeviceId')}
                                        className="h-7 px-2"
                                    >
                                        {copiedKey === 'isupDeviceId' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </Button>
                                </div>

                                <div className="p-2.5 bg-muted/60 rounded-lg border border-border flex justify-between items-center">
                                    <div>
                                        <div className="text-muted-foreground text-[11px]">Encryption Key / Register Password:</div>
                                        <div className="font-semibold font-mono">{isupKey}</div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(isupKey, 'Encryption Key', 'isupKey')}
                                        className="h-7 px-2"
                                    >
                                        {copiedKey === 'isupKey' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </Button>
                                </div>
                            </div>

                            <h4 className="font-semibold flex items-center gap-1.5 text-foreground">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px]">3</span>
                                {t('device_guide_modal.step3_title', 'Saqlash:')}
                            </h4>
                            <p className="text-muted-foreground pl-6">
                                <strong>Save</strong> tugmasini bosing. 5-15 soniya ichida Register Status: <strong className="text-emerald-500">🟢 Online</strong> bo‘ladi.
                            </p>
                        </div>
                    </div>
                )}

                {/* Tab 2: HTTP Listening */}
                {activeTab === 'http' && (
                    <div className="space-y-4 text-xs sm:text-sm text-foreground mt-3">
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs leading-relaxed space-y-1">
                            <strong className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                <Radio className="w-4 h-4" />
                                {t('device_guide_modal.http_intro_title', 'HTTP Listening (An‘anaviy usul):')}
                            </strong>
                            <p className="text-muted-foreground">
                                Ushbu usulda terminal har safar o‘quvchi yuzini skaner qilganda serverga to‘g‘ridan-to‘g‘ri HTTP webhook POST yuboradi.
                            </p>
                        </div>

                        <div className="space-y-3 text-xs">
                            <h4 className="font-semibold flex items-center gap-1.5 text-foreground">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px]">1</span>
                                {t('device_guide_modal.step1_title', 'Hikvision Web paneliga kiring va menyuni oching:')}
                            </h4>
                            <div className="p-2.5 bg-muted rounded-lg border border-border font-mono text-xs">
                                Configuration ➔ Network ➔ Advanced ➔ <strong className="text-blue-600 dark:text-blue-400">HTTP Listening (yoki Alarm Center)</strong>
                            </div>

                            <h4 className="font-semibold flex items-center gap-1.5 text-foreground">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px]">2</span>
                                {t('device_guide_modal.step2_title', 'Quyidagi parametrlarni kiriting:')}
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="p-2.5 bg-muted/60 rounded-lg border border-border flex justify-between items-center">
                                    <div>
                                        <div className="text-muted-foreground text-[11px]">Destination IP / Domain:</div>
                                        <div className="font-semibold font-mono text-blue-600 dark:text-blue-400">{serverDomain}</div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(serverDomain, 'Domain', 'serverDomain')}
                                        className="h-7 px-2"
                                    >
                                        {copiedKey === 'serverDomain' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </Button>
                                </div>

                                <div className="p-2.5 bg-muted/60 rounded-lg border border-border flex justify-between items-center">
                                    <div>
                                        <div className="text-muted-foreground text-[11px]">URL:</div>
                                        <div className="font-semibold font-mono text-blue-600 dark:text-blue-400">/api/hikvision/events</div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard('/api/hikvision/events', 'URL', 'url')}
                                        className="h-7 px-2"
                                    >
                                        {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </Button>
                                </div>

                                <div className="p-2.5 bg-muted/60 rounded-lg border border-border">
                                    <div className="text-muted-foreground text-[11px]">Port:</div>
                                    <div className="font-semibold font-mono">80 (yoki 443)</div>
                                </div>

                                <div className="p-2.5 bg-muted/60 rounded-lg border border-border">
                                    <div className="text-muted-foreground text-[11px]">Protocol:</div>
                                    <div className="font-semibold font-mono">HTTP / HTTPS</div>
                                </div>
                            </div>

                            <h4 className="font-semibold flex items-center gap-1.5 text-foreground">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px]">3</span>
                                {t('device_guide_modal.step3_title', 'Saqlash:')}
                            </h4>
                            <p className="text-muted-foreground pl-6">
                                <strong>Save</strong> tugmasini bosing. Shundan so‘ng o‘quvchilar yuzini ko‘rsatganda davomat avtomatik serverga uzatiladi.
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-4 border-t border-border pt-3">
                    <DialogClose asChild>
                        <Button variant="outline" size="sm" className="h-8.5 text-xs">
                            {t('close', 'Yopish')}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
