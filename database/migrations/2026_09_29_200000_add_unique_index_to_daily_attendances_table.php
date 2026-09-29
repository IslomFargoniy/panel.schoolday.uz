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
        // Clean up any duplicate records if present, keeping the earliest one
        $duplicates = DB::table('daily_attendances')
            ->select('student_id', 'date', DB::raw('MIN(id) as keep_id'))
            ->groupBy('student_id', 'date')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $dup) {
            DB::table('daily_attendances')
                ->where('student_id', $dup->student_id)
                ->where('date', $dup->date)
                ->where('id', '!=', $dup->keep_id)
                ->delete();
        }

        Schema::table('daily_attendances', function (Blueprint $table) {
            $table->unique(['student_id', 'date'], 'daily_attendances_student_date_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daily_attendances', function (Blueprint $table) {
            $table->dropUnique('daily_attendances_student_date_unique');
        });
    }
};
