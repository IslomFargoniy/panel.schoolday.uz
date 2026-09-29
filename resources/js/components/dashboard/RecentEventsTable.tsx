import { Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageModal } from '@/components/students/ImageModal';

interface EventData {
    id: number;
    employeeNoString: string | null;
    start_time: string | null;
    created_at: string;
    majorEventType: number;
    subEventType: number;
    picture?: string | null;
    student?: {
        name: string;
        face_image?: string | null;
        school_class?: { name: string };
    };
    access?: {
        macAddress?: string | null;
        dateTime?: string | null;
    };
}

interface RecentEventsTableProps {
    events: EventData[];
}

const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};

const getImageUrl = (evt: EventData) => {
    if (evt.picture) {
        if (evt.picture.startsWith('http') || evt.picture.startsWith('/'))
            return evt.picture;
        return '/storage/' + evt.picture;
    }
    if (evt.student?.face_image) return evt.student.face_image;
    return null;
};

export function RecentEventsTable({ events }: RecentEventsTableProps) {
    const { t } = useTranslation();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    return (
        <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-sidebar-border">
            <div className="min-h-[300px] overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/50 text-xs text-muted-foreground uppercase">
                        <tr>
                            <th className="px-6 py-4 font-medium">
                                {t('dashboard.student_info', 'Student Info')}
                            </th>
                            <th className="px-6 py-4 font-medium">
                                {t('dashboard.class', 'Class')}
                            </th>
                            <th className="px-6 py-4 font-medium">
                                {t('dashboard.time_device', 'Time (Device)')}
                            </th>
                            <th className="px-6 py-4 font-medium">
                                {t('dashboard.recorded_at', 'Recorded At')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-card-foreground">
                        {events.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-6 py-8 text-center text-muted-foreground"
                                >
                                    {t(
                                        'dashboard.waiting_events',
                                        'Waiting for access events...',
                                    )}
                                </td>
                            </tr>
                        ) : (
                            events.map((evt) => {
                                const imgUrl = getImageUrl(evt);
                                return (
                                    <tr
                                        key={evt.id}
                                        className="transition-colors hover:bg-muted/30"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden border bg-muted"
                                                    onClick={() =>
                                                        imgUrl &&
                                                        setSelectedImage(imgUrl)
                                                    }
                                                    style={{
                                                        borderRadius: '50%',
                                                    }}
                                                >
                                                    {imgUrl ? (
                                                        <img
                                                            src={imgUrl}
                                                            alt="Student"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <Users className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-base font-medium">
                                                        {evt.student?.name || (
                                                            <span className="text-muted-foreground italic">
                                                                {t(
                                                                    'dashboard.unknown',
                                                                    'Unknown',
                                                                )}{' '}
                                                                (
                                                                {evt.employeeNoString ||
                                                                    t(
                                                                        'dashboard.no_id',
                                                                        'No ID',
                                                                    )}
                                                                )
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-secondary-foreground/20 ring-inset">
                                                {evt.student?.school_class
                                                    ?.name ||
                                                    t(
                                                        'dashboard.unassigned',
                                                        'Unassigned',
                                                    )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            <div className="flex flex-col">
                                                <span>
                                                    {formatTime(
                                                        evt.access?.dateTime ||
                                                            evt.start_time ||
                                                            evt.created_at,
                                                    )}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {evt.access?.macAddress ||
                                                        '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {formatTime(evt.created_at)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <ImageModal
                imageUrl={selectedImage}
                onClose={() => setSelectedImage(null)}
            />
        </div>
    );
}
