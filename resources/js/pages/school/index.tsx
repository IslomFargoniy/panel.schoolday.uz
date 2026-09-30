import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Search, Building2, SlidersHorizontal, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import SchoolTable from '@/components/school/school-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { BreadcrumbItem, SchoolPaginate } from '@/types';

export default function SchoolIndex() {
    const { school, filters } = usePage<{
        school: SchoolPaginate;
        filters?: { search?: string; status?: string; per_page?: string | number };
    }>().props;
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('sidebar.school', 'Maktablar'),
            href: '/school',
        },
    ];

    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || 'all');
    const [perPage, setPerPage] = useState(String(filters?.per_page || '15'));

    const handleFilterChange = (newStatus: string, newPerPage: string) => {
        router.get(
            '/school',
            {
                search,
                status: newStatus === 'all' ? '' : newStatus,
                per_page: newPerPage,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/school',
            {
                search,
                status: status === 'all' ? '' : status,
                per_page: perPage,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleReset = () => {
        setSearch('');
        setStatus('all');
        setPerPage('15');
        router.get('/school', {}, { preserveState: true, replace: true });
    };

    const hasFilters = Boolean(search || status !== 'all' || perPage !== '15');

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

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Select */}
                        <div className="w-36">
                            <Select
                                value={status}
                                onValueChange={(val) => {
                                    setStatus(val);
                                    handleFilterChange(val, perPage);
                                }}
                            >
                                <SelectTrigger className="h-9.5 text-xs rounded-xl">
                                    <SelectValue placeholder={t('status', 'Holat')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all', 'Barcha holatlar')}</SelectItem>
                                    <SelectItem value="1">{t('active', 'Faol')}</SelectItem>
                                    <SelectItem value="0">{t('inactive', 'Nofaol')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search input */}
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <div className="relative min-w-[180px] sm:min-w-[220px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('search_school', 'Maktabni qidirish...')}
                                    className="pl-9 h-9.5 rounded-xl text-xs sm:text-sm"
                                />
                            </div>

                            <Button type="submit" variant="secondary" size="sm" className="h-9.5 rounded-xl px-3 text-xs">
                                {t('search', 'Qidirish')}
                            </Button>
                        </form>

                        {/* Reset button */}
                        {hasFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                className="h-9.5 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>{t('cancel', 'Tozalash')}</span>
                            </Button>
                        )}

                        {/* Per page Select */}
                        <div className="w-24">
                            <Select
                                value={perPage}
                                onValueChange={(val) => {
                                    setPerPage(val);
                                    handleFilterChange(status, val);
                                }}
                            >
                                <SelectTrigger className="h-9.5 text-xs rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 ta</SelectItem>
                                    <SelectItem value="15">15 ta</SelectItem>
                                    <SelectItem value="25">25 ta</SelectItem>
                                    <SelectItem value="50">50 ta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Schools Table */}
                <div className="w-full min-w-0 max-w-full">
                    <SchoolTable {...school} searchData={{ search, per_page: perPage }} />
                </div>
            </div>
        </AppLayout>
    );
}
