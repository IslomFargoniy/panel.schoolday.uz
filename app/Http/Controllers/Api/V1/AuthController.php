<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\School;
use App\Models\User;
use App\Support\Tenant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider;
use Laravel\Fortify\Fortify;

class AuthController extends ApiController
{
    /**
     * Email yoki telefon + parol bilan token beradi. 2FA yoqilgan bo'lsa "code" (yoki "recovery_code") ham kerak:
     * u yuborilmagan bo'lsa 422 + two_factor_required qaytadi va ilova kod so'raydi.
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'login' => 'required|string|max:255',
            'password' => 'required|string',
            'device_name' => 'nullable|string|max:100',
            'code' => 'nullable|string|max:10',
            'recovery_code' => 'nullable|string|max:100',
        ]);

        $user = $this->findUser($data['login']);

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return $this->fail(__('Login yoki parol noto‘g‘ri.'), 401);
        }

        if (! Tenant::isGlobalAdmin($user) && Tenant::schoolIds($user)->isEmpty()) {
            return $this->fail(__('Sizga hech qanday maktab biriktirilmagan.'), 403);
        }

        if ($user->hasEnabledTwoFactorAuthentication()) {
            if (empty($data['code']) && empty($data['recovery_code'])) {
                return $this->fail(__('Ikki bosqichli tasdiqlash kodini kiriting.'), 422, ['two_factor_required' => true]);
            }

            if (! $this->passesTwoFactor($user, $data['code'] ?? null, $data['recovery_code'] ?? null)) {
                return $this->fail(__('Tasdiqlash kodi noto‘g‘ri.'), 422, ['two_factor_required' => true]);
            }
        }

        $token = $user->createToken($data['device_name'] ?? 'android', ['school'])->plainTextToken;

        return $this->ok([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return $this->ok($this->userPayload($request->user()));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return $this->ok(null, __('Tizimdan chiqildi.'));
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'string', Password::defaults(), 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            return $this->fail(__('Joriy parol noto‘g‘ri.'), 422, ['errors' => ['current_password' => [__('Joriy parol noto‘g‘ri.')]]]);
        }

        $user->update(['password' => $data['password']]);

        // Boshqa qurilmalardagi tokenlar bekor qilinadi, joriysi qoladi.
        $user->tokens()->where('id', '!=', $user->currentAccessToken()?->id)->delete();

        return $this->ok(null, __('Parol o‘zgartirildi.'));
    }

    private function findUser(string $login): ?User
    {
        $login = trim($login);

        if (str_contains($login, '@')) {
            return User::where('email', Str::lower($login))->first();
        }

        // "+998 90 123-45-67", "998901234567" va "901234567" ko'rinishlari
        $digits = preg_replace('/\D/', '', $login);
        $candidates = array_values(array_unique(array_filter([
            $login,
            $digits,
            strlen($digits) >= 9 ? substr($digits, -9) : null,
            strlen($digits) >= 9 ? '998' . substr($digits, -9) : null,
            strlen($digits) >= 9 ? '+998' . substr($digits, -9) : null,
        ])));

        return User::whereIn('phone', $candidates)->first();
    }

    private function passesTwoFactor(User $user, ?string $code, ?string $recoveryCode): bool
    {
        if ($code) {
            return app(TwoFactorAuthenticationProvider::class)->verify(
                Fortify::currentEncrypter()->decrypt($user->two_factor_secret),
                $code
            );
        }

        $match = collect($user->recoveryCodes())->first(fn ($c) => hash_equals($c, (string) $recoveryCode));

        if ($match) {
            $user->replaceRecoveryCode($match);

            return true;
        }

        return false;
    }

    private function userPayload(User $user): array
    {
        $isGlobalAdmin = Tenant::isGlobalAdmin($user);

        $schools = School::query()
            ->when(! $isGlobalAdmin, fn ($q) => $q->whereIn('id', Tenant::schoolIds($user)))
            ->orderBy('name')
            ->get(['id', 'name', 'status', 'valid_date']);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'roles' => $user->getRoleNames()->values(),
            'is_global_admin' => $isGlobalAdmin,
            'two_factor_enabled' => $user->hasEnabledTwoFactorAuthentication(),
            'schools' => $schools->map(fn (School $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'is_active' => (int) $s->status === 1 && (! $s->valid_date || ! Carbon::parse($s->valid_date)->isPast()),
                'valid_date' => $s->valid_date,
            ])->values(),
        ];
    }
}
