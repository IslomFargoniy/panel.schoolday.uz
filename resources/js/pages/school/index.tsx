import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Search, Building2, SlidersHorizontal } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import SchoolTable from '@/components/school/school-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem, SchoolPaginate } from '@/types';

export default function SchoolIndex() {
    const { school } = usePage<{ school: SchoolPaginate }>().props;
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('sidebar.school', 'Maktablar'),
            href: '/school',
        },
    ];

    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const [search, setSearch] = useState(urlParams.get('search') || '');
    const [perPage, setPerPage] = useState(urlParams.get('per_page') || '15');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/school', { search, per_page: perPage }, { preserveState: true });
    };

    const handlePerPageChange = (val: string) => {
        setPerPage(val);
        router.get('/school', { search, per_page: val }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('sidebar.school', 'Maktablar')} />

            <div className="flex h-full flex-1 flex-col gap-5 p-4 sm:p-6 min-w-0 max-w-full">
                {/* Header & Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                            <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            <span>{t('schools_title', 'Maktablar Tarmog‘i')}</span>
                        </h1>
                        <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                            {t('schools_desc', 'Barcha ta‘lim muassasalari, ularning filiallar limitlari va sozlamalari')}
                        </p>
                    </div>

                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative min-w-[200px] sm:min-w-[260px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('search_school', 'Maktabni qidirish...')}
                                className="pl-9 h-9.5 rounded-xl text-xs sm:text-sm"
                            />
                        </div>

                        <select
                            value={perPage}
                            onChange={(e) => handlePerPageChange(e.target.value)}
                            className="h-9.5 rounded-xl border border-input bg-background px-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="10">10</option>
                            <option value="15">15</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>

                        <Button type="submit" variant="secondary" size="sm" className="h-9.5 rounded-xl px-3 text-xs">
                            {t('search', 'Qidirish')}
                        </Button>
                    </form>
                </div>

                {/* Schools Table */}
                <div className="w-full min-w-0 max-w-full">
                    <SchoolTable {...school} searchData={{ search, per_page: perPage }} />
                </div>
            </div>
        </AppLayout>
    );
}
