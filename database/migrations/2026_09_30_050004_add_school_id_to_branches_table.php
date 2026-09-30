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
        Schema::table('branches', function (Blueprint $table) {
            $table->unsignedBigInteger('school_id')->nullable()->after('id');
        });

        // Ensure default School exists if any branches exist
        $defaultSchoolId = DB::table('schools')->value('id');
        if (! $defaultSchoolId && DB::table('branches')->count() > 0) {
            $defaultSchoolId = DB::table('schools')->insertGetId([
                'name' => 'Bosh Maktab',
                'branch_limit' => 5,
                'branch_price' => 0,
                'valid_date' => now()->addYear()->toDateString(),
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Link existing users to this school
            $userIds = DB::table('users')->pluck('id');
            foreach ($userIds as $uid) {
                if (! DB::table('user_schools')->where('user_id', $uid)->where('school_id', $defaultSchoolId)->exists()) {
                    DB::table('user_schools')->insert([
                        'user_id' => $uid,
                        'school_id' => $defaultSchoolId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        if ($defaultSchoolId) {
            DB::table('branches')->whereNull('school_id')->update(['school_id' => $defaultSchoolId]);
        }

        Schema::table('branches', function (Blueprint $table) {
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
            $table->dropColumn('school_id');
        });
    }
};
