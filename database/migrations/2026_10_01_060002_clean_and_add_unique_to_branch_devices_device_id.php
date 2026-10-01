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
        // 1. Set device_id to null for all http_listening devices
        DB::table('branch_devices')
            ->where('connection_type', 'http_listening')
            ->update(['device_id' => null]);

        // 2. Resolve any remaining duplicate device_id values by setting duplicates to null
        $duplicates = DB::table('branch_devices')
            ->select('device_id', DB::raw('MIN(id) as keep_id'))
            ->whereNotNull('device_id')
            ->groupBy('device_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $dup) {
            DB::table('branch_devices')
                ->where('device_id', $dup->device_id)
                ->where('id', '!=', $dup->keep_id)
                ->update(['device_id' => null]);
        }

        // 3. Add unique index to device_id
        Schema::table('branch_devices', function (Blueprint $table) {
            $table->unique('device_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branch_devices', function (Blueprint $table) {
            $table->dropUnique(['device_id']);
        });
    }
};
