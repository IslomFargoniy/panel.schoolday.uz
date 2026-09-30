import { AlertTriangle, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    onConfirm: () => void;
    loading?: boolean;
}

export function DeleteConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    loading = false,
}: DeleteConfirmDialogProps) {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md sm:max-w-md rounded-2xl">
                <DialogHeader className="gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive dark:bg-destructive/20">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-lg font-bold">
                        {title || t('common.confirm_delete_title', 'O‘chirishni tasdiqlang')}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {description ||
                            t(
                                'common.confirm_delete_desc',
                                'Haqiqatan ham ushbu ma‘lumotni o‘chirib tashlamoqchimisiz? Ushbu amalni ortga qaytarib bo‘lmaydi.',
                            )}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="rounded-xl"
                    >
                        {t('cancel', 'Bekor qilish')}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                            onConfirm();
                        }}
                        disabled={loading}
                        className="gap-1.5 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span>{t('delete', 'O‘chirish')}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
