<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Actions\ConfirmTwoFactorAuthentication;
use Laravel\Fortify\Actions\DisableTwoFactorAuthentication;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;
use Laravel\Fortify\Actions\GenerateNewRecoveryCodes;
use Laravel\Fortify\Fortify;

/**
 * Profile, account deletion, password reset link and 2FA — the web panel's settings pages.
 * 2FA changes ask for the password each time (the web panel's "confirm password" step).
 */
class ProfileController extends ApiController
{
    public function update(ProfileUpdateRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated());
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }
        $user->save();

        return $this->ok(['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'phone' => $user->phone]);
    }

    public function destroy(ProfileDeleteRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->tokens()->delete();
        $user->delete();

        return $this->ok(null);
    }

    /** Same answer whether the email exists or not, so it can't be used to probe accounts. */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);
        Password::sendResetLink($request->only('email'));

        return $this->ok(null, __('Agar bu email ro‘yxatdan o‘tgan bo‘lsa, parolni tiklash havolasi yuborildi.'));
    }

    // ---- Two-factor authentication ----

    /** Step 1: creates a secret (not active yet) and returns what the authenticator app needs. */
    public function enableTwoFactor(Request $request, EnableTwoFactorAuthentication $enable): JsonResponse
    {
        $this->confirmPassword($request);
        $user = $request->user();

        if ($user->hasEnabledTwoFactorAuthentication()) {
            return $this->fail(__('Ikki bosqichli tasdiqlash allaqachon yoqilgan.'), 422);
        }

        $enable($user, force: true);
        $user->refresh();

        return $this->ok([
            'secret' => Fortify::currentEncrypter()->decrypt($user->two_factor_secret),
            'otpauth_url' => $user->twoFactorQrCodeUrl(),
        ]);
    }

    /** Step 2: the 6-digit code from the app turns 2FA on and returns the recovery codes. */
    public function confirmTwoFactor(Request $request, ConfirmTwoFactorAuthentication $confirm): JsonResponse
    {
        $request->validate(['code' => 'required|string']);
        $confirm($request->user(), $request->input('code'));

        return $this->ok(['recovery_codes' => $request->user()->fresh()->recoveryCodes()]);
    }

    public function disableTwoFactor(Request $request, DisableTwoFactorAuthentication $disable): JsonResponse
    {
        $this->confirmPassword($request);
        $disable($request->user());

        return $this->ok(null);
    }

    public function recoveryCodes(Request $request): JsonResponse
    {
        $this->confirmPassword($request);
        $user = $request->user();

        if (! $user->hasEnabledTwoFactorAuthentication()) {
            return $this->fail(__('Ikki bosqichli tasdiqlash yoqilmagan.'), 422);
        }

        return $this->ok(['recovery_codes' => $user->recoveryCodes()]);
    }

    public function regenerateRecoveryCodes(Request $request, GenerateNewRecoveryCodes $generate): JsonResponse
    {
        $this->confirmPassword($request);
        $user = $request->user();

        if (! $user->hasEnabledTwoFactorAuthentication()) {
            return $this->fail(__('Ikki bosqichli tasdiqlash yoqilmagan.'), 422);
        }

        $generate($user);

        return $this->ok(['recovery_codes' => $user->fresh()->recoveryCodes()]);
    }

    private function confirmPassword(Request $request): void
    {
        $request->validate(['password' => 'required|string']);

        if (! Hash::check($request->input('password'), $request->user()->password)) {
            throw ValidationException::withMessages(['password' => __('Parol noto‘g‘ri.')]);
        }
    }
}
