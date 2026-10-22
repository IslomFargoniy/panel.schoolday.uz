<?php

use App\Support\Phone;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Brings stored phones to one form ("+998901234567"). Values that aren't phones are left alone;
 * a user whose normalised phone already belongs to someone else keeps the old spelling
 * (users.phone is unique) and is listed in the log.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('students')->whereNotNull('phone')->orderBy('id')->each(function ($row) {
            $normalized = Phone::normalize($row->phone);
            if ($normalized !== null && $normalized !== $row->phone) {
                DB::table('students')->where('id', $row->id)->update(['phone' => $normalized]);
            }
        });

        DB::table('users')->whereNotNull('phone')->orderBy('id')->each(function ($row) {
            $normalized = Phone::normalize($row->phone);
            if ($normalized === null || $normalized === $row->phone) {
                return;
            }
            if (DB::table('users')->where('phone', $normalized)->where('id', '!=', $row->id)->exists()) {
                logger()->warning("Phone of user {$row->id} not normalised: {$normalized} is taken");

                return;
            }
            DB::table('users')->where('id', $row->id)->update(['phone' => $normalized]);
        });
    }

    public function down(): void
    {
        // Spellings before the change are not kept; the normalised values stay valid
    }
};
