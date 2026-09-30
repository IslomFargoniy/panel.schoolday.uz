import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface RoleItem {
    id: number;
    name: string;
}

interface UserItem {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    roles?: RoleItem[];
    user_schools?: {
        id: number;
        school_id: number;
        school?: { id: number; name: string };
    }[];
    created_at?: string;
}

interface UsersIndexProps {
    users: UserItem[];
    roles: RoleItem[];
    schools?: { id: number; name: string }[];
    filters?: {
        role?: string;
        school_id?: string;
        search?: string;
    };
}

export default function UsersIndex({
    users,
    roles,
    schools = [],
    filters,
}: UsersIndexProps) {
    const { t } = useTranslation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editUser, setEditUser] = useState<UserItem | null>(null);
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

    const [filterData, setFilterData] = useState({
        role: filters?.role || '',
        school_id: filters?.school_id || '',
        search: filters?.search || '',
    });

    const handleFilterChange = (key: string, value: string) => {
        const next = { ...filterData, [key]: value };
        setFilterData(next);
        router.get('/users', next, { preserveState: true, replace: true });
    };

    const handleResetFilters = () => {
        const reset = { role: '', school_id: '', search: '' };
        setFilterData(reset);
        router.get('/users', reset, { preserveState: true, replace: true });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('sidebar.users', 'Users'), href: '/users' },
    ];

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'Admin',
    });

    const openCreateModal = () => {
        clearErrors();
        reset();
        setIsCreateModalOpen(true);
    };

    const openEditModal = (user: UserItem) => {
        clearErrors();
        setData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            password: '',
            role: user.roles?.[0]?.name || 'Admin',
        });
        setEditUser(user);
    };

    const closeModals = () => {
        setIsCreateModalOpen(false);
        setEditUser(null);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editUser) {
            put(`/users/${editUser.id}`, {
                onSuccess: () => {
                    closeModals();
                    reset();
                },
            });
        } else {
            post('/users', {
                onSuccess: () => {
                    closeModals();
                    reset();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        setDeleteUserId(id);
    };

    const handleConfirmDelete = () => {
        if (!deleteUserId) return;
        destroy(`/users/${deleteUserId}`, {
            onSuccess: () => setDeleteUserId(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('sidebar.users', 'Users')} />

            <div className="flex max-w-full min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        {t('sidebar.users', 'Users')}
                    </h2>
                    <Button
                        onClick={openCreateModal}
                        className="shrink-0 gap-2"
                    >
                        <Plus className="h-4 w-4 shrink-0" />
                        <span>{t('create', 'Yaratish')}</span>
                    </Button>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-sidebar-border bg-card p-3 shadow-xs sm:flex-row sm:items-center">
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                        {/* Role filter */}
                        <div className="w-full sm:w-44">
                            <Select
                                value={filterData.role || 'all'}
                                onValueChange={(val) =>
                                    handleFilterChange(
                                        'role',
                                        val === 'all' ? '' : val,
                                    )
                                }
                            >
                                <SelectTrigger className="h-9 rounded-xl text-xs">
                                    <SelectValue
                                        placeholder={t(
                                            'all_roles',
                                            'Barcha rollar',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        {t('all_roles', 'Barcha rollar')}
                                    </SelectItem>
                                    {roles.map((r) => (
                                        <SelectItem key={r.id} value={r.name}>
                                            {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* School filter (Foreign key) */}
                        {schools.length > 0 && (
                            <div className="w-full sm:w-48">
                                <Select
                                    value={filterData.school_id || 'all'}
                                    onValueChange={(val) =>
                                        handleFilterChange(
                                            'school_id',
                                            val === 'all' ? '' : val,
                                        )
                                    }
                                >
                                    <SelectTrigger className="h-9 rounded-xl text-xs">
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

                        {/* Search input */}
                        <div className="relative min-w-[180px] flex-1">
                            <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={filterData.search}
                                onChange={(e) =>
                                    handleFilterChange('search', e.target.value)
                                }
                                placeholder={t(
                                    'users.search_placeholder',
                                    'Ism, email yoki telefon...',
                                )}
                                className="h-9 rounded-xl pl-8 text-xs"
                            />
                        </div>
                    </div>

                    {Boolean(
                        filterData.role ||
                        filterData.school_id ||
                        filterData.search,
                    ) && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="h-9 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                            <span>{t('cancel', 'Tozalash')}</span>
                        </Button>
                    )}
                </div>

                <div className="min-h-[400px] overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm">
                    <div className="max-w-full min-w-0 overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left text-sm">
                            <thead className="border-b bg-muted/50 text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3.5 sm:px-6 sm:py-4">
                                        {t('users.name', 'Name')}
                                    </th>
                                    <th className="px-4 py-3.5 sm:px-6 sm:py-4">
                                        {t('users.email', 'Email')}
                                    </th>
                                    <th className="px-4 py-3.5 sm:px-6 sm:py-4">
                                        {t('users.phone', 'Phone')}
                                    </th>
                                    <th className="px-4 py-3.5 sm:px-6 sm:py-4">
                                        {t('users.role', 'Role')}
                                    </th>
                                    <th className="px-4 py-3.5 sm:px-6 sm:py-4">
                                        {t('school', 'Maktab')}
                                    </th>
                                    <th className="px-4 py-3.5 text-right sm:px-6 sm:py-4">
                                        {t('common.actions', 'Actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-card-foreground">
                                {users.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-8 text-center text-muted-foreground"
                                        >
                                            {t(
                                                'common.empty',
                                                'No data available.',
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-6 py-4 font-medium">
                                                {user.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.phone || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-secondary-foreground/20 ring-inset">
                                                    {user.roles?.[0]?.name ||
                                                        '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                {user.user_schools &&
                                                user.user_schools.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.user_schools.map(
                                                            (us) => (
                                                                <span
                                                                    key={us.id}
                                                                    className="rounded bg-muted px-2 py-0.5 font-medium"
                                                                >
                                                                    {us.school
                                                                        ?.name ||
                                                                        `ID: ${us.school_id}`}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 text-muted-foreground">
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(user)
                                                        }
                                                        className="p-2 transition-colors hover:text-primary"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                user.id,
                                                            )
                                                        }
                                                        className="p-2 transition-colors hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Dialog
                    open={isCreateModalOpen || !!editUser}
                    onOpenChange={(open) => !open && closeModals()}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editUser
                                    ? t('users.edit', 'Edit User')
                                    : t('users.create', 'Add New User')}
                            </DialogTitle>
                            <DialogDescription>
                                {t(
                                    'users.fill_info',
                                    'Fill in the information below.',
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    {t('users.name', 'Name')}
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="John Doe"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    {t('users.email', 'Email')}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    placeholder="admin@example.com"
                                    required
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">
                                    {t('users.phone', 'Phone')}
                                </Label>
                                <PhoneInput
                                    id="phone"
                                    value={data.phone}
                                    onChange={(val) =>
                                        setData('phone', val || '')
                                    }
                                    placeholder="+998901234567"
                                />
                                {errors.phone && (
                                    <p className="text-sm text-destructive">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    {t('users.password', 'Password')}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    placeholder={
                                        editUser
                                            ? t(
                                                  'users.leave_blank',
                                                  '(Leave blank to keep same)',
                                              )
                                            : '••••••••'
                                    }
                                    required={!editUser}
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">
                                    {t('users.role', 'Role')}
                                </Label>
                                <Select
                                    value={data.role}
                                    onValueChange={(val) =>
                                        setData('role', val)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'users.select_role',
                                                'Rolni tanlang',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((r) => (
                                            <SelectItem
                                                key={r.id}
                                                value={r.name}
                                            >
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role && (
                                    <p className="text-sm text-destructive">
                                        {errors.role}
                                    </p>
                                )}
                            </div>

                            <DialogFooter className="mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModals}
                                >
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {t('common.save', 'Save')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <DeleteConfirmDialog
                    open={deleteUserId !== null}
                    onOpenChange={(open) => !open && setDeleteUserId(null)}
                    onConfirm={handleConfirmDelete}
                    title={t(
                        'users.delete_confirm_title',
                        'Foydalanuvchini o‘chirish',
                    )}
                    description={t(
                        'common.confirm_delete',
                        'Ushbu foydalanuvchini o‘chirishni tasdiqlaysizmi?',
                    )}
                />
            </div>
        </AppLayout>
    );
}
