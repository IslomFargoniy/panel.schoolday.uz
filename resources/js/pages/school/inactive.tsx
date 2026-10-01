import { Head, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import settings from '@/routes/settings';

interface School {
    id: number;
    name: string;
    status: number;
    valid_date: string | null;
}

interface InactiveProps {
    schools?: School[];
}

export default function SchoolInactive({ schools = [] }: InactiveProps) {
    const { t } = useTranslation();

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
            <Head title={t('school_inactive_title', 'Maktab faoliyati to‘xtatilgan')} />
            <Card className="w-full max-w-lg border-destructive/30 shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground">
                        {t('school_inactive_title', 'Maktab faoliyati to‘xtatilgan')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {t(
                            'school_inactive_desc',
                            'Siz biriktirilgan maktab(lar)ning tizimdan foydalanish muddati tugagan yoki faoliyati to‘xtatilgan. Tizimga qayta kirish huquqini tiklash uchun platforma ma’muri bilan bog‘laning.',
                        )}
                    </p>

                    {schools.length > 0 && (
                        <div className="rounded-lg border bg-muted/40 p-3 text-left">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                {t('schools', 'Maktablar')}:
                            </h4>
                            <ul className="space-y-1.5 text-xs">
                                {schools.map((s) => (
                                    <li key={s.id} className="flex items-center justify-between">
                                        <span className="font-medium text-foreground">{s.name}</span>
                                        <span className="text-destructive font-mono">
                                            {s.valid_date ? `${t('until', 'Muddati:')} ${s.valid_date}` : t('inactive', 'Faol emas')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto gap-2"
                        onClick={() => router.get(settings.profile().url)}
                    >
                        <Settings className="h-4 w-4" />
                        <span>{t('settings.profile', 'Sozlamalar')}</span>
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-full sm:w-auto gap-2"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                        <span>{t('logout', 'Chiqish')}</span>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
