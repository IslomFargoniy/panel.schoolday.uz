import { useForm } from '@inertiajs/react';
import { Plus, Cpu, Network, Radio } from 'lucide-react';
import type { FormEventHandler} from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Branch } from '@/types';

interface CreateBranchDeviceModalProps {
    branch: Branch;
    onCreated?: () => void;
}

type FormData = {
    branch_id: number;
    name: string;
    mac_address: string;
    device_id: string;
    connection_type: 'isup' | 'http_listening';
    encryption_key: string;
};

export default function CreateBranchDeviceModal({ branch, onCreated }: CreateBranchDeviceModalProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm<FormData>({
        branch_id: branch.id,
        name: '',
        mac_address: '',
        device_id: `branch${branch.id}`,
        connection_type: 'isup',
        encryption_key: `SchoolDay${branch.id}2026`,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post('/branch_device', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setOpen(false);
                toast.success(t('device_created', 'Hikvision qurilmasi muvaffaqiyatli qo‘shildi!'));
                if (onCreated) {
                    onCreated();
                }
            },
            onError: (err: any) => {
                const errorMessage = err?.error || err?.mac_address || t('create_failed', 'Xatolik yuz berdi');
                toast.error(errorMessage);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-8 px-3 rounded-lg shadow-sm flex items-center gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('create_device', 'Qurilma qo‘shish')}</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 max-w-md p-6 bg-card text-card-foreground shadow-xl">
                <DialogHeader className="space-y-1.5 pb-2">
                    <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-foreground">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                            <Cpu className="w-4 h-4" />
                        </div>
                        <span>{t('modal.create_device_title', 'Yangi Hikvision Qurilmasi Qo‘shish')}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {t('branch', 'Filial')}: <strong className="font-semibold text-foreground">{branch.name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-medium">
                            {t('device_name', 'Qurilma nomi')}
                        </Label>
                        <Input
                            id="name"
                            placeholder={t('device_name_placeholder', 'Masalan: Bosh kirish turniketi')}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="h-9 rounded-lg border-input text-xs sm:text-sm"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="mac_address" className="text-xs font-medium">
                            {t('mac_address', 'MAC manzil')} <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="mac_address"
                            placeholder="88:de:39:32:d8:0f"
                            value={data.mac_address}
                            onChange={(e) => setData('mac_address', e.target.value)}
                            className="h-9 rounded-lg border-input text-xs sm:text-sm font-mono"
                            required
                        />
                        <InputError message={errors.mac_address} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="connection_type" className="text-xs font-medium">
                            {t('connection_type', 'Ulanish turi')}
                        </Label>
                        <Select
                            value={data.connection_type}
                            onValueChange={(val: 'isup' | 'http_listening') => setData('connection_type', val)}
                        >
                            <SelectTrigger className="h-9 rounded-lg border-input text-xs sm:text-sm">
                                <SelectValue placeholder={t('select_connection_type', 'Ulanish turini tanlang')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="isup">
                                    <div className="flex items-center gap-2">
                                        <Network className="w-3.5 h-3.5 text-purple-500" />
                                        <span>ISUP 5.0 (2 tomonlama avtomatik sinxronizatsiya)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="http_listening">
                                    <div className="flex items-center gap-2">
                                        <Radio className="w-3.5 h-3.5 text-blue-500" />
                                        <span>HTTP Listening (1 tomonlama klassik)</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.connection_type} />
                    </div>

                    {data.connection_type === 'isup' && (
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 dark:border-indigo-950 dark:bg-indigo-950/30 space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="device_id" className="text-xs font-medium text-foreground">
                                    {t('device_id', 'ISUP Device ID')}
                                </Label>
                                <Input
                                    id="device_id"
                                    value={data.device_id}
                                    onChange={(e) => setData('device_id', e.target.value)}
                                    className="h-8.5 rounded-lg border-input text-xs sm:text-sm font-mono bg-background"
                                />
                                <InputError message={errors.device_id} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="encryption_key" className="text-xs font-medium text-foreground">
                                    {t('encryption_key', 'Xavfsizlik kaliti (Register Password / Key)')}
                                </Label>
                                <Input
                                    id="encryption_key"
                                    value={data.encryption_key}
                                    onChange={(e) => setData('encryption_key', e.target.value)}
                                    className="h-8.5 rounded-lg border-input text-xs sm:text-sm font-mono bg-background"
                                />
                                <InputError message={errors.encryption_key} />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 pt-3 border-t border-border flex items-center justify-end">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                type="button"
                                size="sm"
                                className="h-8.5 rounded-lg text-xs"
                                onClick={() => {
                                    reset();
                                    clearErrors();
                                    setOpen(false);
                                }}
                            >
                                {t('cancel', 'Bekor qilish')}
                            </Button>
                        </DialogClose>

                        <Button
                            type="submit"
                            size="sm"
                            disabled={processing}
                            className="h-8.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 text-xs font-semibold text-white shadow-sm"
                        >
                            {t('save', 'Saqlash')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
