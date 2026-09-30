import { Head, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ClassesTable } from '@/components/classes/ClassesTable';
import { ClassFilters } from '@/components/classes/ClassFilters';
import { ClassForm } from '@/components/classes/ClassForm';
import AppLayout from '@/layouts/app-layout';
import type {
    BreadcrumbItem,
    SchoolClass,
    Shift,
    PaginatedResponse,
} from '@/types';

interface ClassesPageFilters {
    school_id?: string;
    branch_id?: string;
    shift_id?: string;
    search?: string;
    per_page?: string;
}

interface ClassesPageProps {
    classes: PaginatedResponse<SchoolClass>;
    schools?: { id: number; name: string }[];
    branches?: { id: number; name: string; school_id?: number }[];
    shifts: (Shift & { branch_id?: number })[];
    filters: ClassesPageFilters;
}

export default function ClassesPage({
    classes,
    schools = [],
    branches = [],
    shifts,
    filters,
}: ClassesPageProps) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('classes.title', 'Classes'), href: '/classes' },
    ];

    const [filterData, setFilterData] = useState({
        school_id: filters?.school_id || '',
        branch_id: filters?.branch_id || '',
        shift_id: filters?.shift_id || '',
        search: filters?.search || '',
        per_page: filters?.per_page || '20',
    });

    const handleFilterChange = (key: string, value: string) => {
        const next = { ...filterData, [key]: value };
        setFilterData(next);
        router.get('/classes', next, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        const resetData = { school_id: '', branch_id: '', shift_id: '', search: '', per_page: '20' };
        setFilterData(resetData);
        router.get('/classes', resetData, { preserveState: true, replace: true });
    };

    const [editing, setEditing] = useState<SchoolClass | null>(null);
    const {
        data: formData,
        setData,
        post,
        put,
        delete: destroy,
        reset,
        errors,
        clearErrors,
    } = useForm({
        name: '',
        shift_id: '',
        telegram_group_id: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!formData.shift_id) {
            alert(t('classes.shift_required', 'Smenani tanlash majburiy!'));
            return;
        }
        if (editing) {
            put(`/classes/${editing.id}`, {
                onSuccess: () => {
                    setEditing(null);
                    reset();
                },
            });
        } else {
            post('/classes', { onSuccess: () => reset() });
        }
    };

    const handleEdit = (schoolClass: SchoolClass) => {
        setEditing(schoolClass);
        clearErrors();
        setData({
            name: schoolClass.name,
            shift_id: String(schoolClass.shift_id),
            telegram_group_id: schoolClass.telegram_group_id || '',
        });
    };

    const handleDelete = (id: number) => {
        if (
            confirm(
                t(
                    'classes.delete_confirm',
                    'Are you sure you want to delete this class?',
                ),
            )
        ) {
            destroy(`/classes/${id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('classes.title', 'Classes')} />
            <div className="grid grid-cols-1 items-start gap-6 p-6 lg:grid-cols-3">
                <ClassForm
                    editing={editing}
                    formData={formData}
                    errors={errors}
                    shifts={shifts}
                    setData={setData}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setEditing(null);
                        reset();
                        clearErrors();
                    }}
                />
                <div className="flex flex-col gap-4 lg:col-span-2">
                    <ClassFilters
                        filterData={filterData}
                        schools={schools}
                        branches={branches}
                        shifts={shifts}
                        onFilterChange={handleFilterChange}
                        onReset={clearFilters}
                    />
                    <ClassesTable
                        classes={classes}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
