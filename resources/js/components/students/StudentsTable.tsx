import { Plus, Upload, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';

interface StudentsTableProps {
    students: any;
    onEdit: (student: any) => void;
    onDelete: (student: any) => void;
    onImageClick: (url: string) => void;
    onImportClick?: () => void;
    onCreate?: () => void;
}

export function StudentsTable({
    students,
    onEdit,
    onDelete,
    onImageClick,
    onImportClick,
    onCreate,
}: StudentsTableProps) {
    const { t } = useTranslation();

    return (
        <div className="relative overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-sidebar-border/70">
            <div className="flex items-center justify-between gap-4 border-b p-4">
                <h3 className="flex-1 font-semibold">
                    {t('students.list', "O'quvchilar ro'yxati")}
                </h3>
                <div className="flex items-center gap-2">
                    {onImportClick && (
                        <Button
                            onClick={onImportClick}
                            size="sm"
                            variant="outline"
                            className="gap-2 rounded-xl"
                        >
                            <Upload className="h-4 w-4" />
                            <span className="hidden sm:inline">
                                {t('students.import_excel', 'Excel orqali yuklash')}
                            </span>
                        </Button>
                    )}
                    {onCreate && (
                        <Button
                            onClick={onCreate}
                            size="sm"
                            className="gap-1.5 rounded-xl font-medium shadow-xs shrink-0"
                        >
                            <Plus className="h-4 w-4 shrink-0" />
                            <span>Create</span>
                        </Button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto min-w-0 max-w-full">
                <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="border-b bg-muted/50 text-xs text-muted-foreground uppercase">
                        <tr>
                            <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-medium">
                                {t('students.name', 'Name')} &amp;{' '}
                                {t('students.status', 'Status')}
                            </th>
                            <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-medium">
                                {t('students.class', 'Class')}
                            </th>
                            <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-medium">
                                {t('students.hikvision_id', 'Hikvision ID')}
                            </th>
                            <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-medium">
                                {t('students.telegram_id', 'Telegram ID')}
                            </th>
                            <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-right font-medium">
                                {t('students.edit', 'Actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-card-foreground">
                        {students.data.map((student: any) => (
                            <tr
                                key={student.id}
                                className="transition-colors hover:bg-muted/30"
                            >
                                {/* Name + Status */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {student.face_image ? (
                                            <img
                                                src={student.face_image}
                                                className="h-10 w-10 cursor-pointer rounded-full border bg-muted object-cover transition-opacity hover:opacity-80"
                                                alt=""
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onImageClick(
                                                        student.face_image,
                                                    );
                                                }}
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted text-xs text-muted-foreground">
                                                N/A
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-base font-medium">
                                                {student.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {student.phone}
                                            </span>
                                        </div>
                                        {student.status === 'active' ? (
                                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 ring-1 ring-emerald-500/20 ring-inset">
                                                {t('students.active', 'Active')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-500/20 ring-inset">
                                                {t(
                                                    'students.inactive',
                                                    'Inactive',
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Class */}
                                <td className="px-6 py-4">
                                    {student.school_class ? (
                                        <span className="font-medium text-secondary-foreground">
                                            {student.school_class.name}
                                        </span>
                                    ) : (
                                        '-'
                                    )}
                                </td>

                                {/* Hikvision ID */}
                                <td className="px-6 py-4">
                                    {student.employeeNoString || '-'}
                                </td>

                                {/* Telegram ID */}
                                <td className="px-6 py-4">
                                    {student.telegram_id || '-'}
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => onEdit(student)}
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            title={t('students.edit', 'Edit')}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => onDelete(student)}
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                            title={t('students.delete', 'Delete')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {students.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-6 py-8 text-center text-muted-foreground"
                                >
                                    {t(
                                        'students.no_results',
                                        'No students found. Start by adding a student.',
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="border-t p-4">
                <Pagination links={students.links} />
            </div>
        </div>
    );
}
