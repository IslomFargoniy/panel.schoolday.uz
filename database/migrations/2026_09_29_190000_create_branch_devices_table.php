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
        Schema::create('branch_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('mac_address')->nullable()->index();
            $table->string('device_id')->nullable()->index();
            $table->string('connection_type')->default('isup'); // 'isup', 'http_listening'
            $table->boolean('status')->default(true);
            $table->boolean('is_online')->default(false);
            $table->timestamp('last_seen_at')->nullable();
            $table->string('encryption_key')->nullable();
            $table->timestamps();
        });

        // Migrate any existing branch_mac_addresses
        if (Schema::hasTable('branch_mac_addresses')) {
            $existing = DB::table('branch_mac_addresses')->get();
            foreach ($existing as $item) {
                DB::table('branch_devices')->insert([
                    'branch_id' => $item->branch_id,
                    'name' => 'Hikvision Terminal',
                    'mac_address' => $item->mac_address,
                    'device_id' => 'branch' . $item->branch_id,
                    'connection_type' => 'http_listening',
                    'status' => true,
                    'is_online' => false,
                    'created_at' => $item->created_at ?? now(),
                    'updated_at' => $item->updated_at ?? now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branch_devices');
    }
};
