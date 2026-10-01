import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Activity,
    CalendarCheck,
    Clock,
    Camera,
    CheckCircle2,
    LogOut,
    LogIn,
    ScanFace,
    RefreshCw,
    X,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Student } from '@/types';

interface HikvisionEventItem {
    id: number;
    employeeNoString?: string;
    deviceName?: string;
    attendanceStatus?: string;
    majorEventType?: number;
    subEventType?: number;
    picture?: string;
    dateTime?: string;
    created_at?: string;
    access?: {
        ipAddress?: string;
        shortSerialNumber?: string;
    };
}

interface StudentHikvisionEventsModalProps {
    student: Student | null;
    open: boolean;
    onClose: () => void;
}

export default function StudentHikvisionEventsModal({
    student,
    open,
    onClose,
}: StudentHikvisionEventsModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState<HikvisionEventItem[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    const loadEvents = React.useCallback(async () => {
        if (!student) return;
        setLoading(true);
        try {
            const res = await fetch(
                `/students/${student.id}/hikvision-events`,
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );
            const data = await res.json();
            if (data.success && Array.isArray(data.events)) {
                setEvents(data.events);
            } else {
                setEvents([]);
            }
        } catch {
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [student]);

    React.useEffect(() => {
        if (open && student) {
            loadEvents();
        } else {
            setEvents([]);
        }
    }, [open, student, loadEvents]);

    if (!student) return null;

    const getStatusBadge = (status?: string) => {
        const s = (status || '').toLowerCase();
        if (
            s.includes('keld') ||
            s.includes('enter') ||
            s.includes('checkin') ||
            s === '1'
        ) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <LogIn className="h-3 w-3 text-emerald-500" />
                    <span>{t('attendance_entered', 'Kirish')}</span>
                </span>
            );
        }
        if (
            s.includes('ketd') ||
            s.includes('exit') ||
            s.includes('checkout') ||
            s === '2'
        ) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                    <LogOut className="h-3 w-3 text-amber-500" />
                    <span>{t('attendance_exited', 'Chiqish')}</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>{status || t('attendance_event', 'Hodisa')}</span>
            </span>
        );
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-[650px]">
                <DialogHeader className="border-b border-border bg-muted/30 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {student.face_image ? (
                                <img
                                    src={student.face_image}
                                    alt=""
                                    className="h-12 w-12 rounded-full border-2 border-indigo-500/40 object-cover"
                                />
                            ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-base font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                    {student.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <DialogTitle className="flex items-center gap-2 text-base font-bold sm:text-lg">
                                    <span>{student.name}</span>
                                    <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                                        ID: {student.employeeNoString || '—'}
                                    </span>
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                                    {t(
                                        'hikvision_events_desc',
                                        'Hikvision turniketidan o‘tish va yuzni tanish hodisalari jurnali',
                                    )}
                                </DialogDescription>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={loadEvents}
                            disabled={loading}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title={t('refresh', 'Yangilash')}
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                            />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Content List */}
                <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                            <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                            <span className="text-xs">
                                {t(
                                    'events_loading',
                                    'Hikvision hodisalari yuklanmoqda...',
                                )}
                            </span>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 py-12 text-center">
                            <ScanFace className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-50" />
                            <h4 className="mb-1 text-sm font-semibold text-foreground">
                                {t('events_not_found', 'Hodisalar topilmadi')}
                            </h4>
                            <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                                {t(
                                    'events_not_found_desc',
                                    'Ushbu o‘quvchining ID raqami bo‘yicha terminaldan o‘tish yozuvlari hali mavjud emas.',
                                )}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {events.map((evt) => {
                                const rawTime = evt.dateTime || evt.created_at;
                                const formattedTime = rawTime
                                    ? formatDateTime(rawTime)
                                    : '—';
                                const serial = evt.access?.shortSerialNumber;
                                const photoUrl = evt.picture
                                    ? serial
                                        ? `/storage/hikvision/${serial}/${evt.picture}`
                                        : `/storage/events/${evt.picture}`
                                    : null;

                                return (
                                    <div
                                        key={evt.id}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-xs transition-colors hover:bg-muted/40"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            {/* Photo from terminal */}
                                            {photoUrl ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedPhoto(
                                                            photoUrl,
                                                        )
                                                    }
                                                    className="group relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border"
                                                    title={t(
                                                        'enlarge_terminal_photo',
                                                        'Terminal suratini kattalashtirish',
                                                    )}
                                                >
                                                    <img
                                                        src={photoUrl}
                                                        alt="Capture"
                                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <Camera className="h-3.5 w-3.5 text-white" />
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                                                    <ScanFace className="h-5 w-5 opacity-60" />
                                                </div>
                                            )}

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(
                                                        evt.attendanceStatus,
                                                    )}
                                                    <span className="truncate font-semibold text-foreground">
                                                        {evt.deviceName ||
                                                            'MinMoe Terminal'}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    <span>{formattedTime}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <span className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                                                {evt.access?.ipAddress ||
                                                    'ISUP 5.0'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Image zoom preview */}
                {selectedPhoto && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-2">
                            <button
                                type="button"
                                onClick={() => setSelectedPhoto(null)}
                                className="absolute top-4 right-4 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <img
                                src={selectedPhoto}
                                alt="Hikvision Capture Zoom"
                                className="h-auto max-h-[70vh] w-full rounded-xl object-contain"
                            />
                            <p className="mt-2 py-1 text-center text-xs text-muted-foreground">
                                {t(
                                    'zoom_capture_hint',
                                    'Turniket kamerasi orqali qayd etilgan surat',
                                )}
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
