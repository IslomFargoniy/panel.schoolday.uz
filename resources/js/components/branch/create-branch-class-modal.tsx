import { useForm } from '@inertiajs/react';
import { Plus, GraduationCap } from 'lucide-react';
import React, { useState } from 'react';
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
import type { Branch, Shift } from '@/types';

interface CreateBranchClassModalProps {
    branch: Branch;
    defaultShiftId?: number | string;
    trigger?: React.ReactNode;
}

export default function CreateBranchClassModal({
    branch,
    defaultShiftId,
    trigger,
}: CreateBranchClassModalProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const shifts: Shift[] = (branch as any).shifts || [];
    const initialShiftId = defaultShiftId
        ? String(defaultShiftId)
        : shifts[0]?.id
          ? String(shifts[0].id)
          : '';

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        shift_id: initialShiftId,
        telegram_group_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.shift_id) {
            toast.error(t('select_shift_error', 'Iltimos, avval smenani tanlang yoki smena yarating!'));
            return;
        }

        post('/classes', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('class_created_success', 'Sinf muvaffaqiyatli qo‘shildi!'));
                reset();
                clearErrors();
                setOpen(false);
            },
            onError: (err) => {
                const msg = Object.values(err)[0] as string || t('error_occurred', 'Xatolik yuz berdi');
                toast.error(msg);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs font-medium">
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('add_class', 'Sinf qo‘shish')}</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                        <span>{t('add_class_to_branch', 'Filialga yangi sinf qo‘shish')}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        {branch.name} filiali smenasiga yangi o‘quv sinfini biriktirish.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="class-shift" className="text-xs font-semibold">
                            {t('shift', 'Smena')} *
                        </Label>
                        {shifts.length === 0 ? (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                {t('no_shifts_warning', 'Avval kamida bitta smena qo‘shishingiz kerak!')}
                            </p>
                        ) : (
                            <Select
                                value={data.shift_id}
                                onValueChange={(val) => setData('shift_id', val)}
                            >
                                <SelectTrigger id="class-shift" className="h-9 text-xs">
                                    <SelectValue placeholder={t('select_shift', 'Smenani tanlang')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {shifts.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)} className="text-xs">
                                            {s.name} ({s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {errors.shift_id && <p className="text-[11px] text-destructive">{errors.shift_id}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="class-name" className="text-xs font-semibold">
                            {t('class_name', 'Sinf nomi')} *
                        </Label>
                        <Input
                            id="class-name"
                            placeholder="Masalan: 5-A yoki 10-B"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            className="text-xs h-9"
                        />
                        {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="telegram-group" className="text-xs font-semibold">
                            {t('telegram_group_id', 'Telegram guruh ID')} ({t('optional', 'ixtiyoriy')})
                        </Label>
                        <Input
                            id="telegram-group"
                            placeholder="-100xxxxxxxxxx"
                            value={data.telegram_group_id}
                            onChange={(e) => setData('telegram_group_id', e.target.value)}
                            className="text-xs h-9 font-mono"
                        />
                        {errors.telegram_group_id && (
                            <p className="text-[11px] text-destructive">{errors.telegram_group_id}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpen(false)}
                            className="text-xs h-8"
                        >
                            {t('cancel', 'Bekor qilish')}
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={processing || shifts.length === 0}
                            className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                        >
                            {processing ? t('saving', 'Saqlanmoqda...') : t('save', 'Saqlash')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
