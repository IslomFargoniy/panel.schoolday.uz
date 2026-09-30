import { useForm } from '@inertiajs/react';
import { Plus, Clock } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Branch, Shift } from '@/types';

interface CreateBranchShiftModalProps {
    branch: Branch;
    shiftToEdit?: Shift | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export default function CreateBranchShiftModal({
    branch,
    shiftToEdit,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    trigger,
}: CreateBranchShiftModalProps) {
    const { t } = useTranslation();
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            start_time: '08:00',
            end_time: '13:00',
            branch_id: String(branch.id),
        });

    useEffect(() => {
        if (shiftToEdit) {
            setData({
                name: shiftToEdit.name || '',
                start_time: shiftToEdit.start_time
                    ? shiftToEdit.start_time.substring(0, 5)
                    : '08:00',
                end_time: shiftToEdit.end_time
                    ? shiftToEdit.end_time.substring(0, 5)
                    : '13:00',
                branch_id: String(branch.id),
            });
        } else {
            setData({
                name: '',
                start_time: '08:00',
                end_time: '13:00',
                branch_id: String(branch.id),
            });
        }
    }, [shiftToEdit, open, branch.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (shiftToEdit) {
            put(`/shifts/${shiftToEdit.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'shift_updated_success',
                            'Smena muvaffaqiyatli yangilandi!',
                        ),
                    );
                    reset();
                    clearErrors();
                    setOpen(false);
                },
                onError: (err) => {
                    const msg =
                        (Object.values(err)[0] as string) ||
                        t('error_occurred', 'Xatolik yuz berdi');
                    toast.error(msg);
                },
            });
        } else {
            post('/shifts', {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'shift_created_success',
                            'Smena muvaffaqiyatli qo‘shildi!',
                        ),
                    );
                    reset();
                    clearErrors();
                    setOpen(false);
                },
                onError: (err) => {
                    const msg =
                        (Object.values(err)[0] as string) ||
                        t('error_occurred', 'Xatolik yuz berdi');
                    toast.error(msg);
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            {!trigger && !isControlled && (
                <DialogTrigger asChild>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 shrink-0 gap-1.5 text-xs font-medium"
                    >
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        <span>Create</span>
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold">
                        <Clock className="h-5 w-5 text-indigo-600" />
                        <span>
                            {shiftToEdit
                                ? t(
                                      'edit_shift_modal_title',
                                      'Smenani tahrirlash',
                                  )
                                : t(
                                      'add_shift_to_branch',
                                      'Filialga yangi smena qo‘shish',
                                  )}
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        {branch.name} filiali uchun o‘qish smenasi (boshlanish
                        va tugash vaqti).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="shift-name"
                            className="text-xs font-semibold"
                        >
                            {t('shift_name', 'Smena nomi')} *
                        </Label>
                        <Input
                            id="shift-name"
                            placeholder={t(
                                'shifts.placeholder_name',
                                'Masalan: 1-smena (Ertalabki)',
                            )}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            className="h-9 text-xs"
                        />
                        {errors.name && (
                            <p className="text-[11px] text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="start-time"
                                className="text-xs font-semibold"
                            >
                                {t('start_time', 'Boshlanish vaqti')} *
                            </Label>
                            <Input
                                id="start-time"
                                type="time"
                                value={data.start_time}
                                onChange={(e) =>
                                    setData('start_time', e.target.value)
                                }
                                required
                                className="h-9 font-mono text-xs"
                            />
                            {errors.start_time && (
                                <p className="text-[11px] text-destructive">
                                    {errors.start_time}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="end-time"
                                className="text-xs font-semibold"
                            >
                                {t('end_time', 'Tugash vaqti')} *
                            </Label>
                            <Input
                                id="end-time"
                                type="time"
                                value={data.end_time}
                                onChange={(e) =>
                                    setData('end_time', e.target.value)
                                }
                                required
                                className="h-9 font-mono text-xs"
                            />
                            {errors.end_time && (
                                <p className="text-[11px] text-destructive">
                                    {errors.end_time}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpen(false)}
                            className="h-8 text-xs"
                        >
                            {t('cancel', 'Bekor qilish')}
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={processing}
                            className="h-8 bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                            {processing
                                ? t('saving', 'Saqlanmoqda...')
                                : shiftToEdit
                                  ? t('save', 'Saqlash')
                                  : t('add', 'Qo‘shish')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
