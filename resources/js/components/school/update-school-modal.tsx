import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { DatePicker } from '@/components/ui/date-picker';
import { Building2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { School } from '@/types';

interface UpdateSchoolModalProps {
    school: School | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function UpdateSchoolModal({
    school,
    open,
    onOpenChange,
}: UpdateSchoolModalProps) {
    const { t } = useTranslation();

    const { data, setData, put, processing, reset, errors, clearErrors } =
        useForm({
            name: '',
            address: '',
            comment: '',
            branch_limit: '1',
            branch_price: '0',
            valid_date: '',
            status: 1,
        });

    useEffect(() => {
        if (school) {
            setData({
                name: school.name || '',
                address: school.address || '',
                comment: school.comment || '',
                branch_limit: String(school.branch_limit || 1),
                branch_price: String(school.branch_price || 0),
                valid_date: school.valid_date
                    ? formatDate(school.valid_date)
                    : '',
                status: school.status ?? 1,
            });
        }
    }, [school]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!school) return;

        put(`/school/${school.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                clearErrors();
                onOpenChange(false);
                toast.success(
                    t(
                        'school_modal.updated',
                        'Maktab muvaffaqiyatli yangilandi',
                    ),
                );
            },
            onError: (err: any) => {
                const errorMessage =
                    err?.error || t('update_failed', 'Xatolik yuz berdi');
                toast.error(errorMessage);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg rounded-2xl border-border bg-card p-6 shadow-xl">
                <DialogHeader className="space-y-1.5 pb-2">
                    <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-foreground">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                            <Building2 className="h-4 w-4" />
                        </div>
                        <span>
                            {t(
                                'modal.update_school_title',
                                'Maktabni Tahrirlash',
                            )}
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {school?.name} —{' '}
                        {t(
                            'modal.update_school_desc',
                            'parametrlarini yangilang',
                        )}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="edit_name"
                            className="text-xs font-medium text-foreground"
                        >
                            {t('name', 'Maktab nomi')}{' '}
                            <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="edit_name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="h-9.5 rounded-xl text-xs sm:text-sm"
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="edit_address"
                            className="text-xs font-medium text-foreground"
                        >
                            {t('address', 'Manzil')}
                        </Label>
                        <Input
                            id="edit_address"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            className="h-9.5 rounded-xl text-xs sm:text-sm"
                        />
                        <InputError message={errors.address} />
                    </div>

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="edit_comment"
                            className="text-xs font-medium text-foreground"
                        >
                            {t('comment', 'Izoh')}
                        </Label>
                        <Input
                            id="edit_comment"
                            value={data.comment}
                            onChange={(e) => setData('comment', e.target.value)}
                            className="h-9.5 rounded-xl text-xs sm:text-sm"
                        />
                        <InputError message={errors.comment} />
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="edit_branch_limit"
                                className="text-xs font-medium text-foreground"
                            >
                                {t('branch_limit', 'Filiallar limiti')}
                            </Label>
                            <Input
                                id="edit_branch_limit"
                                type="number"
                                min="1"
                                value={data.branch_limit}
                                onChange={(e) =>
                                    setData('branch_limit', e.target.value)
                                }
                                className="h-9.5 rounded-xl text-xs sm:text-sm"
                            />
                            <InputError message={errors.branch_limit} />
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="edit_branch_price"
                                className="text-xs font-medium text-foreground"
                            >
                                {t('branch_price', 'Filial narxi (oylik)')}
                            </Label>
                            <Input
                                id="edit_branch_price"
                                type="number"
                                min="0"
                                value={data.branch_price}
                                onChange={(e) =>
                                    setData('branch_price', e.target.value)
                                }
                                className="h-9.5 rounded-xl text-xs sm:text-sm"
                            />
                            <InputError message={errors.branch_price} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="edit_valid_date"
                                className="text-xs font-medium text-foreground"
                            >
                                {t('valid_date', 'Amal qilish muddati')}
                            </Label>
                            <DatePicker
                                id="edit_valid_date"
                                value={data.valid_date}
                                onChange={(val) => setData('valid_date', val)}
                                placeholder="2027-09-30"
                            />
                            <InputError message={errors.valid_date} />
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="edit_status"
                                className="text-xs font-medium text-foreground"
                            >
                                {t('status', 'Holati')}
                            </Label>
                            <select
                                id="edit_status"
                                value={data.status}
                                onChange={(e) =>
                                    setData('status', Number(e.target.value))
                                }
                                className="h-9.5 w-full rounded-xl border border-input bg-background px-3 text-xs sm:text-sm"
                            >
                                <option value={1}>{t('active', 'Faol')}</option>
                                <option value={0}>
                                    {t('inactive', 'Nofaol')}
                                </option>
                            </select>
                            <InputError message={errors.status} />
                        </div>
                    </div>

                    <DialogFooter className="flex items-center justify-end gap-2 border-t border-border pt-3">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                type="button"
                                size="sm"
                                className="h-9 rounded-xl text-xs font-medium"
                                onClick={() => {
                                    clearErrors();
                                    onOpenChange(false);
                                }}
                            >
                                {t('cancel', 'Bekor qilish')}
                            </Button>
                        </DialogClose>

                        <Button
                            type="submit"
                            size="sm"
                            disabled={processing}
                            className="h-9 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                        >
                            {t('save', 'Saqlash')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
