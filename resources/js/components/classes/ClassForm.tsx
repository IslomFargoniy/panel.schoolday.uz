import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ClassFormProps {
    editing: any;
    formData: { name: string; shift_id: string; telegram_group_id?: string };
    errors: Record<string, string>;
    shifts: any[];
    setData: (key: string, value: any) => void;
    onSubmit: (e: FormEvent) => void;
    onCancel: () => void;
}

export function ClassForm({
    editing,
    formData,
    errors,
    shifts,
    setData,
    onSubmit,
    onCancel,
}: ClassFormProps) {
    const { t } = useTranslation();

    return (
        <div>
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">
                        {t('classes.name', 'Class Name')}
                    </Label>
                    <Input
                        id="name"
                        placeholder={t('classes.placeholder_name', 'e.g. 10-A')}
                        value={formData.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />
                    {errors.name && (
                        <p className="mt-1 text-xs text-destructive">
                            {errors.name}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="shift_id">
                        {t('classes.shift', 'Shift')}{' '}
                        <span className="text-destructive">*</span>
                    </Label>
                    <Combobox
                        value={formData.shift_id}
                        onChange={(val) => setData('shift_id', val)}
                        placeholder={t(
                            'classes.select_shift',
                            'Select a shift',
                        )}
                        searchPlaceholder={t('classes.search', 'Qidirish...')}
                        emptyText={t('classes.not_found', 'Topilmadi')}
                        options={shifts.map((shift) => ({
                            value: String(shift.id),
                            label: `${shift.name} (${shift.start_time.substring(0, 5)} - ${shift.end_time.substring(0, 5)})${shift.branch ? ` - ${shift.branch.name}` : ''}`,
                        }))}
                    />
                    {errors.shift_id && (
                        <p className="mt-1 text-xs text-destructive">
                            {errors.shift_id}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="telegram_group_id">
                        {t('classes.telegram_group_id', 'Telegram guruh ID')}{' '}
                        <span className="text-xs text-muted-foreground">
                            (ixtiyoriy)
                        </span>
                    </Label>
                    <Input
                        id="telegram_group_id"
                        placeholder={t(
                            'classes.placeholder_telegram_group_id',
                            'Masalan: -1001234567890',
                        )}
                        value={formData.telegram_group_id || ''}
                        onChange={(e) =>
                            setData('telegram_group_id', e.target.value)
                        }
                    />
                    {errors.telegram_group_id && (
                        <p className="mt-1 text-xs text-destructive">
                            {errors.telegram_group_id}
                        </p>
                    )}
                </div>
                <div className="flex flex-col-reverse items-stretch justify-end gap-2 border-t border-border/50 pt-4 sm:flex-row sm:items-center">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {t('common.cancel', 'Bekor qilish')}
                    </Button>
                    <Button type="submit">
                        {editing
                            ? t('classes.update', 'Saqlash')
                            : t('classes.save', 'Qo‘shish')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
