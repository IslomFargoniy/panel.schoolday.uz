import { useForm } from '@inertiajs/react';
import { Plus, Cpu, Network, Radio } from 'lucide-react';
import type { FormEventHandler } from 'react';
import { useState, useEffect } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Branch, BranchDevice } from '@/types';

interface CreateBranchDeviceModalProps {
    branch?: Branch;
    branches?: Branch[];
    deviceToEdit?: BranchDevice | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onCreated?: () => void;
    trigger?: React.ReactNode;
}

type FormData = {
    branch_id: number;
    name: string;
    mac_address: string;
    device_id: string;
    connection_type: 'isup' | 'http_listening';
    encryption_key: string;
};

export default function CreateBranchDeviceModal({
    branch,
    branches = [],
    deviceToEdit,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    onCreated,
    trigger,
}: CreateBranchDeviceModalProps) {
    const { t } = useTranslation();
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

    const initialBranchId =
        deviceToEdit?.branch_id ||
        branch?.id ||
        (branches.length > 0 ? branches[0].id : 1);

    const { data, setData, post, put, processing, reset, errors, clearErrors } =
        useForm<FormData>({
            branch_id: initialBranchId,
            name: '',
            mac_address: '',
            device_id: `branch${initialBranchId}`,
            connection_type: 'isup',
            encryption_key: `SchoolDay${initialBranchId}2026`,
        });

    useEffect(() => {
        if (deviceToEdit) {
            setData({
                branch_id: deviceToEdit.branch_id,
                name: deviceToEdit.name || '',
                mac_address: deviceToEdit.mac_address || '',
                device_id:
                    deviceToEdit.device_id || `branch${deviceToEdit.branch_id}`,
                connection_type:
                    (deviceToEdit.connection_type as
                        | 'isup'
                        | 'http_listening') || 'isup',
                encryption_key:
                    (deviceToEdit as any).encryption_key ||
                    `SchoolDay${deviceToEdit.branch_id}2026`,
            });
        } else {
            const bId =
                branch?.id || (branches.length > 0 ? branches[0].id : 1);
            setData({
                branch_id: bId,
                name: '',
                mac_address: '',
                device_id: `branch${bId}`,
                connection_type: 'isup',
                encryption_key: `SchoolDay${bId}2026`,
            });
        }
    }, [deviceToEdit, open, branch?.id, branches, setData]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (deviceToEdit) {
            put(`/branch_device/${deviceToEdit.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    clearErrors();
                    setOpen(false);
                    toast.success(
                        t(
                            'device_updated',
                            'Hikvision qurilmasi muvaffaqiyatli yangilandi!',
                        ),
                    );
                    if (onCreated) {
                        onCreated();
                    }
                },
                onError: (err: any) => {
                    const errorMessage =
                        err?.error ||
                        err?.mac_address ||
                        (Object.values(err)[0] as string) ||
                        t('update_failed', 'Xatolik yuz berdi');
                    toast.error(errorMessage);
                },
            });
        } else {
            post('/branch_device', {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    clearErrors();
                    setOpen(false);
                    toast.success(
                        t(
                            'device_created',
                            'Hikvision qurilmasi muvaffaqiyatli qo‘shildi!',
                        ),
                    );
                    if (onCreated) {
                        onCreated();
                    }
                },
                onError: (err: any) => {
                    const errorMessage =
                        err?.error ||
                        err?.mac_address ||
                        (Object.values(err)[0] as string) ||
                        t('create_failed', 'Xatolik yuz berdi');
                    toast.error(errorMessage);
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    {trigger ? (
                        trigger
                    ) : (
                        <Button className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white shadow-sm hover:bg-indigo-700">
                            <Plus className="h-3.5 w-3.5 shrink-0" />
                            <span>{t('create', 'Yaratish')}</span>
                        </Button>
                    )}
                </DialogTrigger>
            )}

            <DialogContent className="max-w-md rounded-2xl border-slate-200 bg-card p-6 text-card-foreground shadow-xl dark:border-slate-800">
                <DialogHeader className="space-y-1.5 pb-2">
                    <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-foreground">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                            <Cpu className="h-4 w-4" />
                        </div>
                        <span>
                            {deviceToEdit
                                ? t(
                                      'edit_device_title',
                                      'Qurilma Ma’lumotlarini Tahrirlash',
                                  )
                                : t(
                                      'modal.create_device_title',
                                      'Yangi Hikvision Qurilmasi Qo‘shish',
                                  )}
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {branch ? (
                            <>
                                {t('branch', 'Filial')}:{' '}
                                <strong className="font-semibold text-foreground">
                                    {branch.name}
                                </strong>
                            </>
                        ) : (
                            t(
                                'modal.create_device_desc',
                                'Hikvision ISUP 5.0 yoki HTTP Listening terminal parametrlarini kiriting',
                            )
                        )}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4 pt-1">
                    {!branch && branches.length > 0 && (
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="branch_id"
                                className="text-xs font-medium"
                            >
                                {t('branch', 'Filial')}{' '}
                                <span className="text-rose-500">*</span>
                            </Label>
                            <Select
                                value={String(data.branch_id)}
                                onValueChange={(val) => {
                                    const bId = Number(val);
                                    setData((prev) => ({
                                        ...prev,
                                        branch_id: bId,
                                        device_id: `branch${bId}`,
                                        encryption_key: `SchoolDay${bId}2026`,
                                    }));
                                }}
                            >
                                <SelectTrigger className="h-9 rounded-lg border-input text-xs sm:text-sm">
                                    <SelectValue
                                        placeholder={t(
                                            'select_branch',
                                            'Filialni tanlang',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((b) => (
                                        <SelectItem
                                            key={b.id}
                                            value={String(b.id)}
                                        >
                                            {b.name}{' '}
                                            {(b as any).school
                                                ? `(${(b as any).school.name})`
                                                : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.branch_id} />
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-medium">
                            {t('device_name', 'Qurilma nomi')}
                        </Label>
                        <Input
                            id="name"
                            placeholder={t(
                                'device_name_placeholder',
                                'Masalan: Bosh kirish turniketi',
                            )}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="h-9 rounded-lg border-input text-xs sm:text-sm"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="mac_address"
                            className="text-xs font-medium"
                        >
                            {t('mac_address', 'MAC manzil')}{' '}
                            <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="mac_address"
                            placeholder="88:de:39:32:d8:0f"
                            value={data.mac_address}
                            onChange={(e) =>
                                setData('mac_address', e.target.value)
                            }
                            className="h-9 rounded-lg border-input font-mono text-xs sm:text-sm"
                            required
                        />
                        <InputError message={errors.mac_address} />
                    </div>

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="connection_type"
                            className="text-xs font-medium"
                        >
                            {t('connection_type', 'Ulanish turi')}
                        </Label>
                        <Select
                            value={data.connection_type}
                            onValueChange={(val: 'isup' | 'http_listening') =>
                                setData('connection_type', val)
                            }
                        >
                            <SelectTrigger className="h-9 rounded-lg border-input text-xs sm:text-sm">
                                <SelectValue
                                    placeholder={t(
                                        'select_connection_type',
                                        'Ulanish turini tanlang',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="isup">
                                    <div className="flex items-center gap-2">
                                        <Network className="h-3.5 w-3.5 text-purple-500" />
                                        <span>
                                            ISUP 5.0 (2 tomonlama avtomatik
                                            sinxronizatsiya)
                                        </span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="http_listening">
                                    <div className="flex items-center gap-2">
                                        <Radio className="h-3.5 w-3.5 text-blue-500" />
                                        <span>
                                            HTTP Listening (1 tomonlama klassik)
                                        </span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.connection_type} />
                    </div>

                    {data.connection_type === 'isup' && (
                        <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 dark:border-indigo-950 dark:bg-indigo-950/30">
                            <div className="space-y-1">
                                <Label
                                    htmlFor="device_id"
                                    className="text-xs font-medium text-foreground"
                                >
                                    {t('device_id', 'ISUP Device ID')}
                                </Label>
                                <Input
                                    id="device_id"
                                    value={data.device_id}
                                    onChange={(e) =>
                                        setData('device_id', e.target.value)
                                    }
                                    className="h-8.5 rounded-lg border-input bg-background font-mono text-xs sm:text-sm"
                                />
                                <InputError message={errors.device_id} />
                            </div>

                            <div className="space-y-1">
                                <Label
                                    htmlFor="encryption_key"
                                    className="text-xs font-medium text-foreground"
                                >
                                    {t(
                                        'encryption_key',
                                        'Xavfsizlik kaliti (Register Password / Key)',
                                    )}
                                </Label>
                                <Input
                                    id="encryption_key"
                                    value={data.encryption_key}
                                    onChange={(e) =>
                                        setData(
                                            'encryption_key',
                                            e.target.value,
                                        )
                                    }
                                    className="h-8.5 rounded-lg border-input bg-background font-mono text-xs sm:text-sm"
                                />
                                <InputError message={errors.encryption_key} />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex items-center justify-end gap-2 border-t border-border pt-3">
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
                            className="h-8.5 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                        >
                            {t('save', 'Saqlash')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
