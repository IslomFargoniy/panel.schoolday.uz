<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('school_settings', 'telegram_bot_token')) {
            Schema::table('school_settings', function (Blueprint $table) {
                $table->dropColumn('telegram_bot_token');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('school_settings', 'telegram_bot_token')) {
            Schema::table('school_settings', function (Blueprint $table) {
                $table->string('telegram_bot_token')->nullable()->after('sms_sender');
            });
        }
    }
};
