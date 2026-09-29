import { Head, Link, router } from '@inertiajs/react';
import { Users, ArrowLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageModal } from '@/components/students/ImageModal';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, DailyAttendance } from '@/types';

interface AttendanceAccessItem {
    dateTime?: string | null;
    macAddress?: string | null;
}

interface AttendanceEventItem {
    id: number;
    picture?: string | null;
    created_at?: string;
    start_time?: string | null;
    majorEventType?: number | null;
    subEventType?: number | null;
    cardReaderNo?: number | null;
    deviceName?: string | null;
    currentVerifyMode?: string | null;
    access?: AttendanceAccessItem | null;
}

interface ReportDetailsAttendance extends DailyAttendance {
    events?: AttendanceEventItem[];
}

import { formatDate, formatDateTime } from '@/lib/utils';

const getImageUrl = (evt: AttendanceEventItem) => {
    if (evt.picture) {
        if (evt.picture.startsWith('http') || evt.picture.startsWith('/'))
            return evt.picture;
        return '/storage/' + evt.picture;
    }
    return null;
};

export default function ReportDetailsPage({
    attendance,
}: {
    attendance: ReportDetailsAttendance;
}) {
    const { t } = useTranslation();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('reports.title', 'Daily Attendance Report'),
            href: '/reports',
        },
        {
            title: t('reports.details', 'Details'),
            href: `/reports/${attendance.id}`,
        },
    ];

    const handleDelete = () => {
        if (
            confirm(
                t(
                    'common.confirm_delete',
                    'Are you sure you want to delete this attendance record?',
                ),
            )
        ) {
            router.delete(`/reports/${attendance.id}`);
        }
    };

    const handleDeleteEvent = (eventId: number) => {
        if (
            confirm(
                t(
                    'common.confirm_delete',
                    'Are you sure you want to delete this access event?',
                ),
            )
        ) {
            router.delete(`/report-events/${eventId}`, {
                preserveScroll: true,
            });
        }
    };

    const student = attendance.student;
    const events = attendance.events || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('reports.details', 'Attendance Details')} />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/reports"
                            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">
                                {student?.name ||
                                    t(
                                        'reports.unknown_student',
                                        'Unknown Student',
                                    )}
                            </h2>
                            <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
                                <span>
                                    {t('reports.date', 'Date')}:{' '}
                                    <strong className="font-mono">
                                        {formatDate(attendance.date)}
                                    </strong>
                                </span>
                                <span>
                                    {t('reports.class', 'Class')}:{' '}
                                    <strong>
                                        {student?.school_class?.name ||
                                            student?.schoolClass?.name ||
                                            '-'}
                                    </strong>
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        className="flex items-center gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        {t('common.delete', "O'chirish")}
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4 rounded-xl border border-sidebar-border bg-card p-4 shadow-sm">
                        <h3 className="font-semibold">
                            {t('reports.summary', 'Summary')}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">
                                    {t('reports.first_in', 'First Check-in')}
                                </span>
                                <span className="text-base font-medium font-mono text-xs">
                                    {attendance.first_check_in
                                        ? formatDateTime(attendance.first_check_in)
                                        : '-'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    (
                                    {attendance.start_time
                                        ? attendance.start_time.slice(0, 5)
                                        : '-'}
                                    )
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">
                                    {t('reports.last_out', 'Last Check-out')}
                                </span>
                                <span className="text-base font-medium font-mono text-xs">
                                    {attendance.last_check_out
                                        ? formatDateTime(attendance.last_check_out)
                                        : '-'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    (
                                    {attendance.end_time
                                        ? attendance.end_time.slice(0, 5)
                                        : '-'}
                                    )
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">
                                    {t('reports.is_late', 'Late Arrival?')}
                                </span>
                                <div>
                                    {attendance.is_late ? (
                                        <span className="inline-flex items-center rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive ring-1 ring-destructive/20 ring-inset">
                                            {t('reports.yes', 'Yes')}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 ring-1 ring-green-500/20 ring-inset">
                                            {t('reports.no', 'No')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">
                                    {t('reports.is_left_early', 'Left Early?')}
                                </span>
                                <div>
                                    {attendance.is_left_early &&
                                    attendance.last_check_out ? (
                                        <span className="inline-flex items-center rounded-md bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-600 ring-1 ring-yellow-500/20 ring-inset">
                                            {t('reports.yes', 'Yes')}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 ring-1 ring-green-500/20 ring-inset">
                                            {t('reports.no', 'No')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center rounded-xl border border-sidebar-border bg-card p-4 shadow-sm">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-center text-sm text-muted-foreground">
                                {t('reports.profile_photo', 'Profile Photo')}
                            </span>
                            <div
                                className="flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 bg-muted transition-opacity hover:opacity-80"
                                onClick={() =>
                                    student?.face_image &&
                                    setSelectedImage(student.face_image)
                                }
                            >
                                {student?.face_image ? (
                                    <img
                                        src={student.face_image}
                                        alt={student?.name || ''}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <Users className="h-10 w-10 text-muted-foreground/50" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm">
                    <div className="border-b bg-muted/20 p-4">
                        <h3 className="font-semibold">
                            {t(
                                'reports.events_log',
                                'Device Access Events (Live Feed Timeline)',
                            )}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/50 text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-6 py-4">
                                        {t('reports.time', 'Time')}
                                    </th>
                                    <th className="px-6 py-4">
                                        {t('reports.device', 'Device')}
                                    </th>
                                    <th className="px-6 py-4">
                                        {t('reports.verify_mode', 'Method')}
                                    </th>
                                    <th className="px-6 py-4">
                                        {t('reports.photo', 'Photo')}
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        {t('common.actions', 'Harakatlar')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-card-foreground">
                                {events.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-8 text-center text-muted-foreground"
                                        >
                                            {t(
                                                'reports.no_events',
                                                'No access events recorded.',
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    events.map((evt: AttendanceEventItem) => {
                                        const imgUrl = getImageUrl(evt);
                                        return (
                                            <tr
                                                key={evt.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4 font-medium">
                                                    <div className="flex flex-col">
                                                        <span className="font-mono text-xs">
                                                            {formatDateTime(
                                                                evt.access
                                                                    ?.dateTime ||
                                                                    evt.start_time ||
                                                                    evt.created_at,
                                                            )}
                                                        </span>
                                                        <span className="text-xs font-normal whitespace-nowrap text-muted-foreground font-mono">
                                                            {t(
                                                                'reports.recorded',
                                                                'Rec:',
                                                            )}{' '}
                                                            {formatDateTime(
                                                                evt.created_at,
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span>
                                                            {evt.deviceName ||
                                                                t(
                                                                    'reports.unknown',
                                                                    'Unknown',
                                                                )}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {evt.access
                                                                ?.macAddress ||
                                                                '-'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 capitalize">
                                                    {evt.currentVerifyMode ||
                                                        '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {imgUrl ? (
                                                        <img
                                                            src={imgUrl}
                                                            alt="Event Capture"
                                                            className="h-12 w-12 cursor-pointer rounded-lg border object-cover transition-opacity hover:opacity-80"
                                                            onClick={() =>
                                                                setSelectedImage(
                                                                    imgUrl,
                                                                )
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center rounded-full bg-muted p-2 text-xs text-muted-foreground">
                                                            {t(
                                                                'reports.no_photo',
                                                                'No Photo',
                                                            )}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleDeleteEvent(
                                                                evt.id,
                                                            )
                                                        }
                                                        className="text-muted-foreground transition-colors hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <ImageModal
                    imageUrl={selectedImage}
                    onClose={() => setSelectedImage(null)}
                />
            </div>
        </AppLayout>
    );
}
