import { useForm } from '@inertiajs/react';
import { Plus, GraduationCap } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Branch, SchoolClass, Shift } from '@/types';

interface CreateBranchClassModalProps {
    branch: Branch;
    defaultShiftId?: number | string;
    classToEdit?: SchoolClass | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export default function CreateBranchClassModal({
    branch,
    defaultShiftId,
    classToEdit,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    trigger,
}: CreateBranchClassModalProps) {
    const { t } = useTranslation();
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

    const shifts: Shift[] = (branch as any).shifts || [];
    const initialShiftId = defaultShiftId
        ? String(defaultShiftId)
        : shifts[0]?.id
          ? String(shifts[0].id)
          : '';

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            shift_id: initialShiftId,
            telegram_group_id: '',
        });

    useEffect(() => {
        if (classToEdit) {
            setData({
                name: classToEdit.name || '',
                shift_id: classToEdit.shift_id
                    ? String(classToEdit.shift_id)
                    : initialShiftId,
                telegram_group_id: classToEdit.telegram_group_id || '',
            });
        } else {
            setData({
                name: '',
                shift_id: initialShiftId,
                telegram_group_id: '',
            });
        }
    }, [classToEdit, defaultShiftId, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.shift_id) {
            toast.error(
                t(
                    'select_shift_error',
                    'Iltimos, avval smenani tanlang yoki smena yarating!',
                ),
            );
            return;
        }

        if (classToEdit) {
            put(`/classes/${classToEdit.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'class_updated_success',
                            'Sinf muvaffaqiyatli yangilandi!',
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
            post('/classes', {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'class_created_success',
                            'Sinf muvaffaqiyatli qo‘shildi!',
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
                        <GraduationCap className="h-5 w-5 text-indigo-600" />
                        <span>
                            {classToEdit
                                ? t(
                                      'edit_class_modal_title',
                                      'Sinfni tahrirlash',
                                  )
                                : t(
                                      'add_class_to_branch',
                                      'Filialga yangi sinf qo‘shish',
                                  )}
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        {branch.name} filiali uchun sinf (masalan: 10-A, 11-B).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="class-shift"
                            className="text-xs font-semibold"
                        >
                            {t('shift', 'Smena')} *
                        </Label>
                        <Select
                            value={data.shift_id}
                            onValueChange={(val) => setData('shift_id', val)}
                        >
                            <SelectTrigger
                                id="class-shift"
                                className="h-9 text-xs"
                            >
                                <SelectValue
                                    placeholder={t(
                                        'select_shift',
                                        'Smenani tanlang',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {shifts.map((s) => (
                                    <SelectItem
                                        key={s.id}
                                        value={String(s.id)}
                                        className="text-xs"
                                    >
                                        {s.name} (
                                        {s.start_time?.substring(0, 5)} -{' '}
                                        {s.end_time?.substring(0, 5)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.shift_id && (
                            <p className="text-[11px] text-destructive">
                                {errors.shift_id}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="class-name"
                            className="text-xs font-semibold"
                        >
                            {t('class_name', 'Sinf nomi')} *
                        </Label>
                        <Input
                            id="class-name"
                            placeholder={t(
                                'classes.placeholder_name',
                                'Masalan: 10-A yoki 7-B',
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

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="class-tg-group"
                            className="text-xs font-semibold"
                        >
                            {t(
                                'telegram_group_id',
                                'Telegram guruh ID (ixtiyoriy)',
                            )}
                        </Label>
                        <Input
                            id="class-tg-group"
                            placeholder="-1001234567890"
                            value={data.telegram_group_id}
                            onChange={(e) =>
                                setData('telegram_group_id', e.target.value)
                            }
                            className="h-9 font-mono text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            {t(
                                'telegram_group_id_hint',
                                'Davomat xabarnomalarini jo‘natish uchun guruh ID raqami',
                            )}
                        </p>
                        {errors.telegram_group_id && (
                            <p className="text-[11px] text-destructive">
                                {errors.telegram_group_id}
                            </p>
                        )}
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
                                : classToEdit
                                  ? t('save', 'Saqlash')
                                  : t('add', 'Qo‘shish')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
