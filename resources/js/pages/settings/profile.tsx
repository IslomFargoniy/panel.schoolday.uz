import { type Auth, type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit, update } from '@/routes/profile';
import { send } from '@/routes/verification';

type ProfileForm = {
    name: string;
    phone: string;
    email: string;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.profile', 'Profile settings'),
            href: edit().url,
        },
    ];

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm<Required<ProfileForm>>({
            name: auth.user.name,
            phone: (auth.user.phone as string) || '',
            email: auth.user.email,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(update().url, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.profile', 'Profile settings')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title={t(
                            'settings.profile_info',
                            'Profile information',
                        )}
                        description={t(
                            'settings.update_info',
                            'Update your name, phone and email address',
                        )}
                    />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                {t('settings.name', 'Name')}
                            </Label>

                            <Input
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                required
                                autoComplete="name"
                                placeholder={t(
                                    'settings.placeholder_name',
                                    'Full name',
                                )}
                            />

                            <InputError
                                className="mt-2"
                                message={errors.name}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">
                                {t('settings.phone', 'Phone Number')}
                            </Label>

                            <Input
                                id="phone"
                                className="mt-1 block w-full"
                                value={data.phone}
                                onChange={(e) =>
                                    setData('phone', e.target.value)
                                }
                                autoComplete="tel"
                                placeholder="+99890XXXXXXX"
                            />

                            <InputError
                                className="mt-2"
                                message={errors.phone}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">
                                {t('settings.email', 'Email address')}
                            </Label>

                            <Input
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                required
                                autoComplete="username"
                                placeholder={t(
                                    'settings.placeholder_email',
                                    'Email address',
                                )}
                            />

                            <InputError
                                className="mt-2"
                                message={errors.email}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t('settings.telegram_id', 'Telegram ID')}
                            </Label>

                            <Input
                                readOnly
                                disabled
                                type="text"
                                className="mt-1 block w-full cursor-not-allowed bg-muted opacity-80"
                                value={
                                    auth.user.telegram_id ||
                                    t('settings.not_connected', 'Ulanmagan')
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                {t(
                                    'settings.bot_instruction',
                                    "Botga (/start) buyrug'ini yozganingizda yoki botdan kontakt jo'natganingizda shu yerda yoziladi.",
                                )}
                            </p>
                        </div>

                        {mustVerifyEmail &&
                            auth.user.email_verified_at === null && (
                                <div>
                                    <p className="-mt-4 text-sm text-muted-foreground">
                                        Your email address is unverified.{' '}
                                        <Link
                                            href={send()}
                                            as="button"
                                            className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                        >
                                            {t(
                                                'settings.resend_verification',
                                                'Click here to resend the verification email.',
                                            )}
                                        </Link>
                                    </p>

                                    {status === 'verification-link-sent' && (
                                        <div className="mt-2 text-sm font-medium text-green-600">
                                            {t(
                                                'settings.verification_sent',
                                                'A new verification link has been sent to your email address.',
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                        <div className="flex items-center gap-4">
                            <Button
                                disabled={processing}
                                data-test="update-profile-button"
                            >
                                {t('settings.save', 'Save')}
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {t('settings.saved', 'Saved')}
                                </p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
