import { useForm } from '@inertiajs/react';
import { Plus, Clock } from 'lucide-react';
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
import type { Branch } from '@/types';

interface CreateBranchShiftModalProps {
    branch: Branch;
    trigger?: React.ReactNode;
}

export default function CreateBranchShiftModal({ branch, trigger }: CreateBranchShiftModalProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        start_time: '08:00',
        end_time: '13:00',
        branch_id: String(branch.id),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/shifts', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('shift_created_success', 'Smena muvaffaqiyatli qo‘shildi!'));
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
                        <span>{t('add_shift', 'Smena qo‘shish')}</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        <span>{t('add_shift_to_branch', 'Filialga yangi smena qo‘shish')}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        {branch.name} filiali uchun o‘qish smenasi (boshlanish va tugash vaqti).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="shift-name" className="text-xs font-semibold">
                            {t('shift_name', 'Smena nomi')} *
                        </Label>
                        <Input
                            id="shift-name"
                            placeholder="Masalan: 1-smena (Ertalabki)"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            className="text-xs h-9"
                        />
                        {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="start-time" className="text-xs font-semibold">
                                {t('start_time', 'Boshlanish vaqti')} *
                            </Label>
                            <Input
                                id="start-time"
                                type="time"
                                value={data.start_time}
                                onChange={(e) => setData('start_time', e.target.value)}
                                required
                                className="text-xs h-9 font-mono"
                            />
                            {errors.start_time && <p className="text-[11px] text-destructive">{errors.start_time}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="end-time" className="text-xs font-semibold">
                                {t('end_time', 'Tugash vaqti')} *
                            </Label>
                            <Input
                                id="end-time"
                                type="time"
                                value={data.end_time}
                                onChange={(e) => setData('end_time', e.target.value)}
                                required
                                className="text-xs h-9 font-mono"
                            />
                            {errors.end_time && <p className="text-[11px] text-destructive">{errors.end_time}</p>}
                        </div>
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
                            disabled={processing}
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
