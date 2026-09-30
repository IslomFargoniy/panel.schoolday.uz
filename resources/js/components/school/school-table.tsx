import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Building2, Pencil, Settings, Trash2, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { formatDate } from '@/lib/utils';
import CreateSchoolModal from './create-school-modal';
import UpdateSchoolModal from './update-school-modal';
import SchoolSettingModal from './school-setting-modal';
import type { School, SchoolPaginate } from '@/types';

interface SchoolTableProps extends SchoolPaginate {
    searchData?: {
        search?: string;
        per_page?: string | number;
    };
}

export default function SchoolTable({ searchData, ...schools }: SchoolTableProps) {
    const { t } = useTranslation();
    const [editOpen, setEditOpen] = useState(false);
    const [settingOpen, setSettingOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [deleteSchoolId, setDeleteSchoolId] = useState<number | null>(null);

    const { auth } = usePage().props as unknown as { auth: { user: any } };
    const isAdmin = auth?.user?.roles?.some((role: any) => 
        (typeof role === 'string' ? role === 'Admin' || role === 'Superadmin' : role.name === 'Admin' || role.name === 'Superadmin')
    );

    const handleEditClick = (item: School) => {
        setSelectedSchool(item);
        setEditOpen(true);
    };

    const handleSettingClick = (item: School) => {
        setSelectedSchool(item);
        setSettingOpen(true);
    };

    const handleDelete = (id: number) => {
        setDeleteSchoolId(id);
    };

    const handleConfirmDelete = () => {
        if (!deleteSchoolId) return;

        router.delete(`/school/${deleteSchoolId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('deleted_successfully', 'Maktab muvaffaqiyatli o‘chirildi'));
                setDeleteSchoolId(null);
            },
            onError: (err: any) => {
                const errorMessage = err?.error || t('delete_failed', 'O‘chirishda xatolik yuz berdi');
                toast.error(errorMessage);
            },
        });
    };

    return (
        <div className="space-y-4">
            {/* Table Container Card */}
            <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left text-xs text-foreground">
                        <thead className="border-b border-border bg-muted/60 font-semibold text-muted-foreground uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3 text-center w-12 font-mono">{t('n', '№')}</th>
                                <th className="px-4 py-3">{t('school_table.name', 'Maktab nomi')}</th>
                                <th className="px-4 py-3">{t('school_table.users', 'Mas‘ul foydalanuvchilar')}</th>
                                <th className="px-4 py-3">{t('school_table.address', 'Manzil')}</th>
                                <th className="px-4 py-3 text-center">{t('school_table.branches', 'Filiallar')}</th>
                                <th className="px-4 py-3 whitespace-nowrap">{t('school_table.valid_date', 'Amal qilish muddati')}</th>
                                <th className="px-4 py-3 text-center">{t('school_table.status', 'Holat')}</th>
                                <th className="px-4 py-3 text-right w-36">
                                    {isAdmin && <CreateSchoolModal />}
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-border bg-card">
                            {schools.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                        <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm font-medium">{t('school_table.no_schools', 'Hozircha maktablar mavjud emas')}</p>
                                    </td>
                                </tr>
                            ) : (
                                schools.data.map((item, index) => {
                                    const globalIndex = (schools.current_page - 1) * schools.per_page + index + 1;
                                    const isActive = item.status == 1;

                                    return (
                                        <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                                            <td className="px-4 py-3 text-center font-mono text-muted-foreground">{globalIndex}</td>
                                            <td className="px-4 py-3 font-semibold text-foreground">
                                                <Link
                                                    href={`/branches?school_id=${item.id}`}
                                                    className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                >
                                                    <span>{item.name}</span>
                                                    <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                                                </Link>
                                                {item.comment && (
                                                    <p className="text-[11px] font-normal text-muted-foreground truncate max-w-xs">{item.comment}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {item.user_schools?.length ? (
                                                        item.user_schools.map(us => (
                                                            <span key={us.id} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-foreground">
                                                                {us.user?.name ?? '—'}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{item.address || '—'}</td>
                                            <td className="px-4 py-3 text-center font-semibold text-foreground">
                                                <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 text-indigo-700 dark:text-indigo-300">
                                                    {item.branches_count ?? 0} / {item.branch_limit}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground font-mono whitespace-nowrap">
                                                {formatDate(item.valid_date)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        <span>{t('active', 'Faol')}</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                        <span>{t('inactive', 'Nofaol')}</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleSettingClick(item)}
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg"
                                                        title={t('common.settings', 'Sozlamalar')}
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </Button>

                                                    {isAdmin && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEditClick(item)}
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"
                                                                title={t('edit', 'Tahrirlash')}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(item.id)}
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                                                                title={t('delete', 'O‘chirish')}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <UpdateSchoolModal
                school={selectedSchool}
                open={editOpen}
                onOpenChange={setEditOpen}
            />

            <SchoolSettingModal
                school={selectedSchool}
                open={settingOpen}
                onOpenChange={setSettingOpen}
            />

            <DeleteConfirmDialog
                open={deleteSchoolId !== null}
                onOpenChange={(open) => !open && setDeleteSchoolId(null)}
                onConfirm={handleConfirmDelete}
                title={t('confirm_delete_school_title', 'Maktabni o‘chirish')}
                description={t(
                    'confirm_delete_school',
                    'Haqiqatan ham bu maktabni o‘chirmoqchimisiz?',
                )}
            />
        </div>
    );
}
