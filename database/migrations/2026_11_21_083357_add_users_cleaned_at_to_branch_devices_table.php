<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * When the terminal's leftover users (not active students of the device's branch) were removed.
     * Empty for a newly added device: the first check after it connects cleans it once.
     * Every device that exists now is marked as done, so nothing is ever removed from a working terminal.
     */
    public function up(): void
    {
        Schema::table('branch_devices', function (Blueprint $table) {
            $table->timestamp('users_cleaned_at')->nullable()->after('last_event_synced_at');
        });

        DB::table('branch_devices')->update(['users_cleaned_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('branch_devices', function (Blueprint $table) {
            $table->dropColumn('users_cleaned_at');
        });
    }
};
