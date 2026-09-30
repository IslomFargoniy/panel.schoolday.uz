import React, { useState, useRef } from 'react';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { DatePicker } from '@/components/ui/date-picker';
import { Building2, Plus } from 'lucide-react';

export default function CreateSchoolModal() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const nameInput = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, reset, errors, clearErrors } =
        useForm({
            name: '',
            address: '',
            comment: '',
            branch_limit: '1',
            branch_price: '0',
            valid_date: '',
            status: 1,
        });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/school', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setOpen(false);
                toast.success(
                    t(
                        'school_modal.created',
                        'Maktab muvaffaqiyatli qo‘shildi',
                    ),
                );
            },
            onError: (err: any) => {
                const errorMessage =
                    err?.error || t('create_failed', 'Xatolik yuz berdi');
                toast.error(errorMessage);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-xs font-medium text-white shadow-xs hover:bg-indigo-700">
                    <Plus className="h-4 w-4 shrink-0" />
                    <span>Create</span>
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg rounded-2xl border-border bg-card p-6 shadow-xl">
                <DialogHeader className="space-y-1.5 pb-2">
                    <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-foreground">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                            <Building2 className="h-4 w-4" />
                        </div>
                        <span>
                            {t(
                                'modal.create_school_title',
                                'Yangi Maktab Qo‘shish',
                            )}
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {t(
                            'modal.create_school_desc',
                            'Yangi maktab yoki ta‘lim muassasasi ma‘lumotlarini kiriting',
                        )}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="name"
                            className="text-xs font-medium text-foreground"
                        >
                            {t('name', 'Maktab nomi')}{' '}
                            <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            ref={nameInput}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={t(
                                'name_placeholder',
                                'Masalan: Al-Xorazmiy nomidagi IT Maktabi',
                            )}
                            className="h-9.5 rounded-xl text-xs sm:text-sm"
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="address"
                            className="text-xs font-medium text-foreground"
                        >
                            {t('address', 'Manzil')}
                        </Label>
                        <Input
                            id="address"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            placeholder={t(
                                'address_placeholder',
                                'Toshkent sh., Chilonzor tumani...',
                            )}
                            className="h-9.5 rounded-xl text-xs sm:text-sm"
                        />
                        <InputError message={errors.address} />
                    </div>

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="comment"
                            className="text-xs font-medium text-foreground"
                        >
                            {t('comment', 'Izoh')}
                        </Label>
                        <Input
                            id="comment"
                            value={data.comment}
                            onChange={(e) => setData('comment', e.target.value)}
                            placeholder={t(
                                'comment_placeholder',
                                'Qo‘shimcha izoh (ixtiyoriy)',
                            )}
                            className="h-9.5 rounded-xl text-xs sm:text-sm"
                        />
                        <InputError message={errors.comment} />
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="branch_limit"
                                className="text-xs font-medium text-foreground"
                            >
                                {t('branch_limit', 'Filiallar limiti')}
                            </Label>
                            <Input
                                id="branch_limit"
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
                                htmlFor="branch_price"
                                className="text-xs font-medium text-foreground"
                            >
                                {t('branch_price', 'Filial narxi (oylik)')}
                            </Label>
                            <Input
                                id="branch_price"
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

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="valid_date"
                            className="text-xs font-medium text-foreground"
                        >
                            {t('valid_date', 'Amal qilish muddati')}
                        </Label>
                        <DatePicker
                            id="valid_date"
                            value={data.valid_date}
                            onChange={(val) => setData('valid_date', val)}
                            placeholder="2027-09-30"
                        />
                        <InputError message={errors.valid_date} />
                    </div>

                    <DialogFooter className="flex items-center justify-end gap-2 border-t border-border pt-3">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                type="button"
                                size="sm"
                                className="h-9 rounded-xl text-xs font-medium"
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
