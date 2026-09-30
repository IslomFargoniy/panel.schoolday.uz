import { Head, Link } from '@inertiajs/react';
import { useEcho, useConnectionStatus } from '@laravel/echo-react';
import {
    Moon,
    Sun,
    ArrowLeft,
    RefreshCw,
    Users,
    UserCheck,
    UserX,
    Building2,
    GraduationCap,
    Activity,
    Radio,
    Wifi,
    WifiOff,
} from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppearance } from '@/hooks/use-appearance';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface StudentData {
    id: number;
    name: string;
    is_present: boolean;
}

interface ClassData {
    id: number;
    name: string;
    shift_name: string;
    students: StudentData[];
    total: number;
    present: number;
}

interface BranchData {
    id: number;
    name: string;
    classes: ClassData[];
    total_students: number;
    present_students: number;
}

interface MonitoringData {
    branches: BranchData[];
    updated_at: string;
}

interface MonitoringProps {
    schools?: { id: number; name: string }[];
    branches?: { id: number; name: string; school_id?: number }[];
}

export default function Monitoring({
    schools = [],
    branches = [],
}: MonitoringProps) {
    const { t } = useTranslation();
    const { appearance, updateAppearance } = useAppearance();
    const [data, setData] = useState<MonitoringData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSchool, setSelectedSchool] = useState<string>('');
    const [selectedBranch, setSelectedBranch] = useState<string>('');

    const connectionStatus = useConnectionStatus();

    const toggleTheme = () => {
        const isDark =
            appearance === 'dark' ||
            (appearance === 'system' &&
                window.matchMedia('(prefers-color-scheme: dark)').matches);
        updateAppearance(isDark ? 'light' : 'dark');
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedSchool) params.append('school_id', selectedSchool);
            if (selectedBranch) params.append('branch_id', selectedBranch);
            const qs = params.toString() ? `?${params.toString()}` : '';
            const res = await fetch(`/monitoring/data${qs}`);
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error('Monitoring data fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [selectedSchool, selectedBranch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reverb WebSocket event subscription
    useEcho(
        'monitoring',
        ['.updated', 'updated', 'MonitoringUpdate'],
        (payload) => {
            console.log(
                'Realtime event received via Reverb WebSocket:',
                payload,
            );
            fetchData();
        },
        [fetchData],
        'public',
    );

    // Fallback polling: polls every 10s if disconnected, or 60s passive heartbeat if connected
    useEffect(() => {
        const intervalMs = connectionStatus === 'connected' ? 60000 : 10000;
        const interval = setInterval(() => {
            fetchData();
        }, intervalMs);

        return () => clearInterval(interval);
    }, [connectionStatus, fetchData]);

    // Overall stats
    const totalStudents =
        data?.branches.reduce((s, b) => s + b.total_students, 0) ?? 0;
    const presentStudents =
        data?.branches.reduce((s, b) => s + b.present_students, 0) ?? 0;
    const absentStudents = totalStudents - presentStudents;
    const attendanceRate =
        totalStudents > 0
            ? Math.round((presentStudents / totalStudents) * 100)
            : 0;

    const isWsConnected = connectionStatus === 'connected';
    const isWsConnecting = connectionStatus === 'connecting';

    return (
        <>
            <Head
                title={`${t('sidebar.monitoring', 'Monitoring')} — SchoolDay`}
            >
                <meta
                    name="description"
                    content={t(
                        'monitoring.subtitle',
                        'Real-vaqt davomat monitoring',
                    )}
                />
            </Head>

            <div className="min-h-screen bg-slate-50 font-sans text-slate-800 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-100">
                {/* Background Effects */}
                <div className="pointer-events-none fixed inset-0 z-0">
                    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-600/10 blur-[128px] dark:bg-emerald-600/20"></div>
                    <div className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[128px] dark:bg-cyan-500/10"></div>
                    <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-orange-500/10 blur-[128px] dark:bg-orange-500/20"></div>
                </div>

                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="rounded-xl bg-black/5 p-2 transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-emerald-500" />
                                <h1 className="text-lg font-bold sm:text-xl">
                                    {t('sidebar.monitoring', 'Monitoring')}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Reverb WebSocket Live indicator */}
                            <div
                                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    isWsConnected
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                        : isWsConnecting
                                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                                          : 'border-slate-500/20 bg-slate-500/10 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400'
                                }`}
                                title={`Reverb WebSocket: ${connectionStatus}`}
                            >
                                <span className="relative flex h-2 w-2">
                                    {isWsConnected && (
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                    )}
                                    <span
                                        className={`relative inline-flex h-2 w-2 rounded-full ${
                                            isWsConnected
                                                ? 'bg-emerald-500'
                                                : isWsConnecting
                                                  ? 'animate-pulse bg-amber-500'
                                                  : 'bg-slate-400'
                                        }`}
                                    ></span>
                                </span>
                                <span>
                                    {isWsConnected
                                        ? t(
                                              'monitoring.reverb_live',
                                              'Reverb: Jonli',
                                          )
                                        : isWsConnecting
                                          ? t(
                                                'monitoring.reverb_connecting',
                                                'Reverb: Ulanmoqda...',
                                            )
                                          : t(
                                                'monitoring.offline_polling',
                                                'Oflayn (polling)',
                                            )}
                                </span>
                            </div>

                            {data && (
                                <span className="hidden text-xs text-slate-400 tabular-nums sm:inline-block dark:text-slate-500">
                                    {data.updated_at}
                                </span>
                            )}

                            <button
                                onClick={() => fetchData()}
                                disabled={loading}
                                title={t('refresh', 'Yangilash')}
                                className="rounded-xl bg-black/5 p-2 transition-colors hover:bg-black/10 disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/20"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`}
                                />
                            </button>

                            <button
                                onClick={toggleTheme}
                                className="rounded-full bg-black/5 p-2 transition-all hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
                            >
                                <Sun className="hidden h-4 w-4 dark:block" />
                                <Moon className="block h-4 w-4 dark:hidden" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Foreign Key Filter Bar */}
                {(schools.length > 0 || branches.length > 0) && (
                    <div className="relative z-10 mx-auto max-w-7xl px-4 pt-4 sm:px-6">
                        <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-black/5 bg-white/60 p-2.5 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-slate-800/60">
                            {schools.length > 0 && (
                                <div className="w-full sm:w-48">
                                    <Select
                                        value={selectedSchool || 'all'}
                                        onValueChange={(val) => {
                                            const newSchool =
                                                val === 'all' ? '' : val;
                                            setSelectedSchool(newSchool);
                                            if (newSchool && selectedBranch) {
                                                const valid = branches.some(
                                                    (b) =>
                                                        String(b.id) ===
                                                            selectedBranch &&
                                                        String(b.school_id) ===
                                                            newSchool,
                                                );
                                                if (!valid)
                                                    setSelectedBranch('');
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-8 rounded-xl bg-transparent text-xs">
                                            <SelectValue
                                                placeholder={t(
                                                    'all_schools',
                                                    'Barcha maktablar',
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                {t(
                                                    'all_schools',
                                                    'Barcha maktablar',
                                                )}
                                            </SelectItem>
                                            {schools.map((s) => (
                                                <SelectItem
                                                    key={s.id}
                                                    value={String(s.id)}
                                                >
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {branches.length > 0 && (
                                <div className="w-full sm:w-48">
                                    <Select
                                        value={selectedBranch || 'all'}
                                        onValueChange={(val) =>
                                            setSelectedBranch(
                                                val === 'all' ? '' : val,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-8 rounded-xl bg-transparent text-xs">
                                            <SelectValue
                                                placeholder={t(
                                                    'all_branches',
                                                    'Barcha filiallar',
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                {t(
                                                    'all_branches',
                                                    'Barcha filiallar',
                                                )}
                                            </SelectItem>
                                            {(selectedSchool
                                                ? branches.filter(
                                                      (b) =>
                                                          String(
                                                              b.school_id,
                                                          ) === selectedSchool,
                                                  )
                                                : branches
                                            ).map((b) => (
                                                <SelectItem
                                                    key={b.id}
                                                    value={String(b.id)}
                                                >
                                                    {b.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {(selectedSchool || selectedBranch) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedSchool('');
                                        setSelectedBranch('');
                                    }}
                                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    {t('cancel', 'Tozalash')}
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                <main className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                        <div className="rounded-2xl border border-black/5 bg-white/60 p-4 backdrop-blur-sm sm:p-5 dark:border-white/10 dark:bg-white/5">
                            <div className="mb-2 flex items-center gap-3">
                                <div className="rounded-xl bg-blue-500/10 p-2">
                                    <Users className="h-5 w-5 text-blue-500" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold tabular-nums sm:text-3xl">
                                {totalStudents}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                                {t(
                                    'monitoring.total_students',
                                    'Jami o‘quvchilar',
                                )}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-black/5 bg-white/60 p-4 backdrop-blur-sm sm:p-5 dark:border-white/10 dark:bg-white/5">
                            <div className="mb-2 flex items-center gap-3">
                                <div className="rounded-xl bg-emerald-500/10 p-2">
                                    <UserCheck className="h-5 w-5 text-emerald-500" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-emerald-600 tabular-nums sm:text-3xl dark:text-emerald-400">
                                {presentStudents}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                                {t('monitoring.present', 'Kelganlar')}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-black/5 bg-white/60 p-4 backdrop-blur-sm sm:p-5 dark:border-white/10 dark:bg-white/5">
                            <div className="mb-2 flex items-center gap-3">
                                <div className="rounded-xl bg-red-500/10 p-2">
                                    <UserX className="h-5 w-5 text-red-500" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-red-500 tabular-nums sm:text-3xl dark:text-red-400">
                                {absentStudents}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                                {t('monitoring.absent', 'Kelmaganlar')}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-black/5 bg-white/60 p-4 backdrop-blur-sm sm:p-5 dark:border-white/10 dark:bg-white/5">
                            <div className="mb-2 flex items-center gap-3">
                                <div className="rounded-xl bg-orange-500/10 p-2">
                                    <RefreshCw
                                        className={`h-5 w-5 text-orange-500 ${loading ? 'animate-spin' : ''}`}
                                    />
                                </div>
                            </div>
                            <p className="text-2xl font-bold tabular-nums sm:text-3xl">
                                {attendanceRate}%
                            </p>
                            <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                                {t(
                                    'monitoring.attendance_rate',
                                    'Davomat foizi',
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Branches */}
                    {loading && !data ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-24">
                            <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
                            <p className="text-slate-400">
                                {t(
                                    'monitoring.loading',
                                    'Ma‘lumotlar yuklanmoqda...',
                                )}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {data?.branches.map((branch) => {
                                const branchAbsent =
                                    branch.total_students -
                                    branch.present_students;
                                const branchRate =
                                    branch.total_students > 0
                                        ? Math.round(
                                              (branch.present_students /
                                                  branch.total_students) *
                                                  100,
                                          )
                                        : 0;

                                return (
                                    <div key={branch.id}>
                                        {/* Branch Header */}
                                        <div className="mb-4 flex items-center gap-3 px-1">
                                            <Building2 className="h-6 w-6 text-indigo-500" />
                                            <h2 className="text-xl font-bold">
                                                {branch.name}
                                            </h2>
                                            <div className="ml-auto flex items-center gap-2 text-xs">
                                                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-600 dark:text-emerald-400">
                                                    {branch.present_students}{' '}
                                                    {t(
                                                        'monitoring.present_short',
                                                        'kelgan',
                                                    )}
                                                </span>
                                                <span className="rounded-full bg-red-500/10 px-2.5 py-1 font-medium text-red-500 dark:text-red-400">
                                                    {branchAbsent}{' '}
                                                    {t(
                                                        'monitoring.absent_short',
                                                        'kelmagan',
                                                    )}
                                                </span>
                                                <span className="hidden rounded-full bg-blue-500/10 px-2.5 py-1 font-medium text-blue-600 sm:inline dark:text-blue-400">
                                                    {branchRate}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Class Cards Grid */}
                                        {branch.classes.length === 0 ? (
                                            <p className="px-1 text-sm text-slate-400 italic">
                                                {t(
                                                    'monitoring.no_classes',
                                                    'Sinflar topilmadi',
                                                )}
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                {branch.classes.map((cls) => {
                                                    const classAbsent =
                                                        cls.total - cls.present;

                                                    return (
                                                        <div
                                                            key={cls.id}
                                                            className="overflow-hidden rounded-2xl border border-black/5 bg-white/70 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
                                                        >
                                                            {/* Class Card Header */}
                                                            <div className="flex items-center justify-between border-b border-black/5 bg-white/50 px-4 py-3 dark:border-white/5 dark:bg-white/3">
                                                                <div className="flex items-center gap-2">
                                                                    <GraduationCap className="h-5 w-5 text-orange-500" />
                                                                    <span className="text-base font-semibold">
                                                                        {
                                                                            cls.name
                                                                        }
                                                                    </span>
                                                                    <span className="ml-1 text-xs text-slate-400">
                                                                        (
                                                                        {
                                                                            cls.shift_name
                                                                        }
                                                                        )
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs font-medium">
                                                                    <span className="text-emerald-600 dark:text-emerald-400">
                                                                        {
                                                                            cls.present
                                                                        }
                                                                        ✓
                                                                    </span>
                                                                    <span className="text-red-500 dark:text-red-400">
                                                                        {
                                                                            classAbsent
                                                                        }
                                                                        ✗
                                                                    </span>
                                                                    <span className="text-slate-400">
                                                                        /{' '}
                                                                        {
                                                                            cls.total
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Students - Journal Style */}
                                                            <div className="divide-y divide-black/5 dark:divide-white/5">
                                                                {cls.students.map(
                                                                    (
                                                                        student,
                                                                        idx,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                student.id
                                                                            }
                                                                            className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                                                                                student.is_present
                                                                                    ? 'bg-emerald-500/15 dark:bg-emerald-500/20'
                                                                                    : 'bg-rose-500/12 dark:bg-rose-500/15'
                                                                            }`}
                                                                        >
                                                                            <span className="w-6 flex-shrink-0 text-center font-mono text-xs text-slate-400 dark:text-slate-500">
                                                                                {idx +
                                                                                    1}
                                                                            </span>
                                                                            <span
                                                                                className={`flex-1 font-medium ${
                                                                                    student.is_present
                                                                                        ? 'text-emerald-800 dark:text-emerald-200'
                                                                                        : 'text-rose-700 dark:text-rose-200'
                                                                                }`}
                                                                            >
                                                                                {
                                                                                    student.name
                                                                                }
                                                                            </span>
                                                                            <span
                                                                                className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                                                                    student.is_present
                                                                                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                                                                        : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                                                                                }`}
                                                                            >
                                                                                {student.is_present
                                                                                    ? t(
                                                                                          'monitoring.status_present',
                                                                                          'Kelgan',
                                                                                      )
                                                                                    : t(
                                                                                          'monitoring.status_absent',
                                                                                          'Kelmagan',
                                                                                      )}
                                                                            </span>
                                                                        </div>
                                                                    ),
                                                                )}
                                                                {cls.students
                                                                    .length ===
                                                                    0 && (
                                                                    <p className="px-4 py-3 text-xs text-slate-400 italic">
                                                                        {t(
                                                                            'monitoring.no_students',
                                                                            'O‘quvchilar topilmadi',
                                                                        )}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="relative z-10 px-4 py-6 text-center text-xs text-slate-400">
                    {t(
                        'monitoring.footer',
                        'Real-vaqt (WebSocket) rejimida yangilanadi • SchoolDay Monitoring',
                    )}
                </footer>
            </div>
        </>
    );
}
