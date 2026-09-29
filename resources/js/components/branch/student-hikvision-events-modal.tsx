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

    const loadEvents = async () => {
        if (!student) return;
        setLoading(true);
        try {
            const res = await fetch(`/students/${student.id}/hikvision-events`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.events)) {
                setEvents(data.events);
            } else {
                setEvents([]);
            }
        } catch (e) {
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (open && student) {
            loadEvents();
        } else {
            setEvents([]);
        }
    }, [open, student?.id]);

    if (!student) return null;

    const getStatusBadge = (status?: string) => {
        const s = (status || '').toLowerCase();
        if (s.includes('keld') || s.includes('enter') || s.includes('checkin') || s === '1') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
                    <LogIn className="w-3 h-3 text-emerald-500" />
                    <span>{t('attendance_entered', 'Kirish')}</span>
                </span>
            );
        }
        if (s.includes('ketd') || s.includes('exit') || s.includes('checkout') || s === '2') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800">
                    <LogOut className="w-3 h-3 text-amber-500" />
                    <span>{t('attendance_exited', 'Chiqish')}</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                <Activity className="w-3 h-3" />
                <span>{status || t('attendance_event', 'Hodisa')}</span>
            </span>
        );
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {student.face_image ? (
                                <img
                                    src={student.face_image}
                                    alt=""
                                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/40"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
                                    {student.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                                    <span>{student.name}</span>
                                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800">
                                        ID: {student.employeeNoString || '—'}
                                    </span>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Hikvision turniketidan o‘tish va yuzni tanish hodisalari jurnali
                                </DialogDescription>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={loadEvents}
                            disabled={loading}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Yangilash"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Content List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                            <span className="text-xs">Hikvision hodisalari yuklanmoqda...</span>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="py-12 text-center rounded-xl border border-dashed border-border bg-card/40 p-6">
                            <ScanFace className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <h4 className="text-sm font-semibold text-foreground mb-1">
                                Hodisalar topilmadi
                            </h4>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                Ushbu o‘quvchining ({student.employeeNoString}) ID raqami bo‘yicha terminaldan o‘tish yozuvlari hali mavjud emas.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {events.map((evt) => {
                                const rawTime = evt.dateTime || evt.created_at;
                                const formattedTime = rawTime ? formatDateTime(rawTime) : '—';
                                const serial = evt.access?.shortSerialNumber;
                                const photoUrl = evt.picture
                                    ? serial
                                        ? `/storage/hikvision/${serial}/${evt.picture}`
                                        : `/storage/events/${evt.picture}`
                                    : null;

                                return (
                                    <div
                                        key={evt.id}
                                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors text-xs"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Photo from terminal */}
                                            {photoUrl ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPhoto(photoUrl)}
                                                    className="relative w-10 h-10 rounded-lg overflow-hidden border border-border group shrink-0"
                                                    title="Terminal suratini kattalashtirish"
                                                >
                                                    <img
                                                        src={photoUrl}
                                                        alt="Capture"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Camera className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                                                    <ScanFace className="w-5 h-5 opacity-60" />
                                                </div>
                                            )}

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(evt.attendanceStatus)}
                                                    <span className="font-semibold text-foreground truncate">
                                                        {evt.deviceName || 'MinMoe Terminal'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground mt-1 text-[11px] font-mono">
                                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                                    <span>{formattedTime}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                                {evt.access?.ipAddress || 'ISUP 5.0'}
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
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <div className="relative max-w-md w-full bg-card rounded-2xl overflow-hidden border border-border p-2">
                            <button
                                type="button"
                                onClick={() => setSelectedPhoto(null)}
                                className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <img
                                src={selectedPhoto}
                                alt="Hikvision Capture Zoom"
                                className="w-full h-auto rounded-xl object-contain max-h-[70vh]"
                            />
                            <p className="text-center text-xs text-muted-foreground mt-2 py-1">
                                Turniket kamerasi orqali qayd etilgan surat
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
