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
import { Settings, Sliders } from 'lucide-react';
import type { School } from '@/types';

interface SchoolSettingModalProps {
    school: School | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SchoolSettingModal({
    school,
    open,
    onOpenChange,
}: SchoolSettingModalProps) {
    const { t } = useTranslation();

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        school_id: 0,
        webhook_url: '',
        sms_sender: '',
        telegram_bot_token: '',
        telegram_channel_id: '',
        timezone: 'Asia/Tashkent',
    });

    useEffect(() => {
        if (school) {
            setData({
                school_id: school.id,
                webhook_url: school.school_setting?.webhook_url || '',
                sms_sender: school.school_setting?.sms_sender || '',
                telegram_bot_token:
                    school.school_setting?.telegram_bot_token || '',
                telegram_channel_id:
                    school.school_setting?.telegram_channel_id || '',
                timezone: school.school_setting?.timezone || 'Asia/Tashkent',
            });
        }
    }, [school, setData]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!school) return;

        post('/school_setting', {
            preserveScroll: true,
            onSuccess: () => {
                clearErrors();
                onOpenChange(false);
                toast.success(
                    t('settings_saved', 'Maktab sozlamalari saqlandi'),
                );
            },
            onError: (err: any) => {
                const errorMessage =
                    err?.error || t('save_failed', 'Xatolik yuz berdi');
                toast.error(errorMessage);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6 shadow-xl">
                <DialogHeader className="space-y-1.5 pb-2">
                    <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-foreground">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                            <Sliders className="h-4 w-4" />
                        </div>
                        <span>
                            {t(
                                'modal.school_setting_title',
                                'Maktab Sozlamalari',
                            )}
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        <strong className="text-foreground">
                            {school?.name}
                        </strong>{' '}
                        {t(
                            'modal.school_setting_desc',
                            'uchun bildirishnomalar va integratsiyalar',
                        )}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="sms_sender"
                            className="text-xs font-medium text-foreground"
                        >
                            {t('sms_sender', 'SMS Jo‘natuvchi nomi (Header)')}
                        </Label>
                        <Input
                            id="sms_sender"
                            value={data.sms_sender}
                            onChange={(e) =>
                                setData('sms_sender', e.target.value)
                            }
                            placeholder="Masalan: SchoolDay"
                            className="h-9.5 rounded-xl text-xs sm:text-sm"
                        />
                        <InputError message={errors.sms_sender} />
                    </div>

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="telegram_bot_token"
                            className="text-xs font-medium text-foreground"
                        >
                            {t('telegram_bot_token', 'Telegram Bot Token')}
                        </Label>
                        <Input
                            id="telegram_bot_token"
                            value={data.telegram_bot_token}
                            onChange={(e) =>
                                setData('telegram_bot_token', e.target.value)
                            }
                            placeholder="123456789:ABCdefGhIJKlmNoP..."
                            className="h-9.5 rounded-xl font-mono text-xs sm:text-sm"
                        />
                        <InputError message={errors.telegram_bot_token} />
                    </div>

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="telegram_channel_id"
                            className="text-xs font-medium text-foreground"
                        >
                            {t('telegram_channel_id', 'Telegram Kanal ID')}
                        </Label>
                        <Input
                            id="telegram_channel_id"
                            value={data.telegram_channel_id}
                            onChange={(e) =>
                                setData('telegram_channel_id', e.target.value)
                            }
                            placeholder="-100123456789"
                            className="h-9.5 rounded-xl font-mono text-xs sm:text-sm"
                        />
                        <InputError message={errors.telegram_channel_id} />
                    </div>

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="webhook_url"
                            className="text-xs font-medium text-foreground"
                        >
                            {t('webhook_url', 'Webhook URL')}
                        </Label>
                        <Input
                            id="webhook_url"
                            value={data.webhook_url}
                            onChange={(e) =>
                                setData('webhook_url', e.target.value)
                            }
                            placeholder="https://example.com/api/attendance-webhook"
                            className="h-9.5 rounded-xl font-mono text-xs sm:text-sm"
                        />
                        <InputError message={errors.webhook_url} />
                    </div>

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="timezone"
                            className="text-xs font-medium text-foreground"
                        >
                            {t('timezone', 'Vaqt mintaqasi (Timezone)')}
                        </Label>
                        <Input
                            id="timezone"
                            value={data.timezone}
                            onChange={(e) =>
                                setData('timezone', e.target.value)
                            }
                            className="h-9.5 rounded-xl text-xs sm:text-sm"
                        />
                        <InputError message={errors.timezone} />
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
