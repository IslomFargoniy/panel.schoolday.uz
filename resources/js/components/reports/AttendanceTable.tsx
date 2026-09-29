import { Link } from '@inertiajs/react';
import { Users, Eye, FileDown } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/pagination';
import { ImageModal } from '@/components/students/ImageModal';
import { formatDate, formatDateTime } from '@/lib/utils';

interface AttendanceTableProps {
    attendances: any;
    filters?: any;
}

export function AttendanceTable({
    attendances,
    filters,
}: AttendanceTableProps) {
    const { t } = useTranslation();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const exportUrl = filters
        ? `/reports/export?${new URLSearchParams(
              Object.entries(filters).reduce((acc: any, [key, value]) => {
                  if (value !== null && value !== undefined && value !== '') {
                      acc[key] = String(value);
                  }
                  return acc;
              }, {}),
          ).toString()}`
        : '/reports/export';

    return (
        <div className="relative flex min-h-[60vh] flex-1 flex-col rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-sidebar-border">
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/50 text-xs text-muted-foreground uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-4 font-medium">
                                {t('reports.date', 'Date')}
                            </th>
                            <th scope="col" className="px-6 py-4 font-medium">
                                {t('reports.student_name', 'Student Info')}
                            </th>
                            <th scope="col" className="px-6 py-4 font-medium">
                                {t('reports.class', 'Class')}
                            </th>
                            <th scope="col" className="px-6 py-4 font-medium">
                                {t('reports.first_in', 'First Check-in')}
                            </th>
                            <th scope="col" className="px-6 py-4 font-medium">
                                {t('reports.last_out', 'Last Check-out')}
                            </th>
                            <th scope="col" className="px-6 py-4 font-medium">
                                {t('reports.details', 'Status')}
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-4 text-right font-medium"
                            >
                                <div className="flex items-center justify-end gap-2">
                                    <span>
                                        {t('reports.actions', 'Actions')}
                                    </span>
                                    <a
                                        href={exportUrl}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                                        title={t(
                                            'reports.export_excel',
                                            'Export to Excel',
                                        )}
                                    >
                                        <FileDown className="h-4 w-4" />
                                    </a>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-card-foreground">
                        {attendances.data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-6 py-8 text-center text-muted-foreground"
                                >
                                    {t(
                                        'reports.no_results',
                                        'No attendance records found for selected filters.',
                                    )}
                                </td>
                            </tr>
                        ) : (
                            attendances.data.map((item: any) => {
                                return (
                                    <tr
                                        key={item.id}
                                        className="transition-colors hover:bg-muted/30"
                                    >
                                        <td className="px-6 py-4 font-medium text-muted-foreground font-mono whitespace-nowrap">
                                            {formatDate(item.date)}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden border bg-muted"
                                                    onClick={(e) => {
                                                        if (
                                                            item.student
                                                                ?.face_image
                                                        ) {
                                                            e.stopPropagation();
                                                            setSelectedImage(
                                                                item.student
                                                                    .face_image,
                                                            );
                                                        }
                                                    }}
                                                    style={{
                                                        borderRadius: '50%',
                                                    }}
                                                >
                                                    {item.student
                                                        ?.face_image ? (
                                                        <img
                                                            src={
                                                                item.student
                                                                    .face_image
                                                            }
                                                            alt="Student"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <Users className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="font-medium">
                                                    {item.student?.name ||
                                                        t(
                                                            'reports.unknown',
                                                            'Unknown',
                                                        )}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-muted-foreground">
                                            {item.student?.school_class?.name ||
                                                '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs">
                                                    {item.first_check_in
                                                        ? formatDateTime(item.first_check_in)
                                                        : '-'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    (
                                                    {item.start_time
                                                        ? item.start_time.slice(
                                                              0,
                                                              5,
                                                          )
                                                        : '-'}
                                                    )
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs">
                                                    {item.last_check_out
                                                        ? formatDateTime(item.last_check_out)
                                                        : '-'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    (
                                                    {item.end_time
                                                        ? item.end_time.slice(
                                                              0,
                                                              5,
                                                          )
                                                        : '-'}
                                                    )
                                                </span>
                                            </div>
                                        </td>
                                        <td className="flex gap-2 px-6 py-4">
                                            {item.is_absent_placeholder ? (
                                                <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-600 ring-1 ring-red-500/20 ring-inset dark:text-red-500">
                                                    {t(
                                                        'reports.absent',
                                                        'Kelmagan',
                                                    )}
                                                </span>
                                            ) : (
                                                <>
                                                    {item.is_late ? (
                                                        <span className="inline-flex items-center rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive ring-1 ring-destructive/20 ring-inset">
                                                            {t(
                                                                'reports.late',
                                                                'Late',
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 ring-1 ring-green-500/20 ring-inset dark:text-green-500">
                                                            {t(
                                                                'reports.on_time',
                                                                'On Time',
                                                            )}
                                                        </span>
                                                    )}
                                                    {item.is_left_early &&
                                                        item.last_check_out && (
                                                            <span className="inline-flex items-center rounded-md bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-600 ring-1 ring-yellow-500/20 ring-inset dark:text-yellow-500">
                                                                {t(
                                                                    'reports.left_early',
                                                                    'Left Early',
                                                                )}
                                                            </span>
                                                        )}
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {!item.is_absent_placeholder && (
                                                <Link
                                                    href={`/reports/${item.id}`}
                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    {t(
                                                        'reports.view',
                                                        "Ko'rish",
                                                    )}
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-auto shrink-0 border-t p-4">
                <Pagination links={attendances.links} />
            </div>

            <ImageModal
                imageUrl={selectedImage}
                onClose={() => setSelectedImage(null)}
            />
        </div>
    );
}
