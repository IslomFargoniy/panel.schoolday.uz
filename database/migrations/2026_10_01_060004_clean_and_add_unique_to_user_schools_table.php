<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Remove duplicate user_schools rows, keeping the lowest id
        $duplicates = DB::table('user_schools')
            ->select('user_id', 'school_id', DB::raw('MIN(id) as keep_id'))
            ->groupBy('user_id', 'school_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $dup) {
            DB::table('user_schools')
                ->where('user_id', $dup->user_id)
                ->where('school_id', $dup->school_id)
                ->where('id', '!=', $dup->keep_id)
                ->delete();
        }

        // 2. Add unique index
        Schema::table('user_schools', function (Blueprint $table) {
            $table->unique(['user_id', 'school_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_schools', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'school_id']);
        });
    }
};
