import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';

interface ClassesTableProps {
    classes: any;
    onEdit: (cls: any) => void;
    onDelete: (id: number) => void;
}

export function ClassesTable({ classes, onEdit, onDelete }: ClassesTableProps) {
    const { t } = useTranslation();

    return (
        <div className="relative overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-sidebar-border/70">
            <div className="overflow-x-auto min-w-0 max-w-full">
                <table className="w-full min-w-[600px] text-left text-sm">
                    <thead className="border-b bg-muted/50 text-xs text-muted-foreground uppercase">
                        <tr>
                            <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-medium">
                                {t('classes.details', 'Class Details')}
                            </th>
                            <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-medium">
                                {t('classes.students', 'Students')}
                            </th>
                            <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-medium">
                                {t(
                                    'classes.today_attendance',
                                    "Today's Attendance",
                                )}
                            </th>
                            <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-right font-medium">
                                {t('classes.actions', 'Actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-card-foreground">
                        {classes.data.map((cls: any) => (
                            <tr
                                key={cls.id}
                                className="transition-colors hover:bg-muted/30"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="text-base font-medium">
                                            {cls.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {cls.shift ? (
                                                <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 ring-1 ring-blue-500/20 ring-inset dark:text-blue-400">
                                                    {cls.shift.name}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                            {cls.telegram_group_id && (
                                                <span
                                                    className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 ring-1 ring-indigo-500/20 ring-inset dark:text-indigo-400"
                                                    title="Telegram Group"
                                                >
                                                    {cls.telegram_group_id}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <strong className="text-foreground">
                                        {cls.total_students || 0}
                                    </strong>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        <span
                                            className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 ring-1 ring-emerald-500/20 ring-inset"
                                            title="Present Today"
                                        >
                                            {t('classes.present_today', 'P')}:{' '}
                                            {cls.present_students || 0}
                                        </span>
                                        <span
                                            className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600 ring-1 ring-blue-500/20 ring-inset"
                                            title="On Time"
                                        >
                                            {t('classes.on_time', 'T')}:{' '}
                                            {cls.on_time_students || 0}
                                        </span>
                                        <span
                                            className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600 ring-1 ring-amber-500/20 ring-inset"
                                            title="Late"
                                        >
                                            {t('classes.late', 'L')}:{' '}
                                            {cls.late_students || 0}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => onEdit(cls)}
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            title={t('classes.edit', 'Edit')}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => onDelete(cls.id)}
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                            title={t('classes.delete', 'Delete')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {classes.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-6 py-8 text-center text-muted-foreground"
                                >
                                    {t(
                                        'classes.no_results',
                                        'No classes found. Add one.',
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="border-t p-4">
                <Pagination links={classes.links} />
            </div>
        </div>
    );
}
