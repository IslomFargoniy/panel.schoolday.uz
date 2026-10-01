<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserSchool;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Passwords for new users are read from env (SEED_SUPERADMIN_PASSWORD /
     * SEED_ADMIN_PASSWORD). If the env variable is absent a secure random
     * password is generated and printed ONCE to the console.
     * Existing users are NEVER updated — only roles are (re-)assigned.
     */
    public function run(): void
    {
        $roleSuperadmin = Role::firstOrCreate(['name' => 'Superadmin']);
        $roleAdmin = Role::firstOrCreate(['name' => 'Admin']);

        // ── Superadmin ────────────────────────────────────────────────────────
        $superadmin = User::where('email', 'abdurahmanislam304@gmail.com')
            ->orWhere('phone', '+998911157709')
            ->first();

        if (! $superadmin) {
            $password = env('SEED_SUPERADMIN_PASSWORD') ?: Str::password(16);
            if (! env('SEED_SUPERADMIN_PASSWORD')) {
                $this->command->warn("Superadmin password (shown once – store it now): {$password}");
            }
            $superadmin = User::create([
                'email' => 'abdurahmanislam304@gmail.com',
                'phone' => '+998911157709',
                'name' => 'Superadmin',
                'password' => Hash::make($password),
            ]);
        }
        $superadmin->assignRole($roleSuperadmin);

        // ── Admin ─────────────────────────────────────────────────────────────
        $admin = User::where('email', 'admin@gmail.com')
            ->orWhere('phone', '+998901234567')
            ->first();

        if (! $admin) {
            $password = env('SEED_ADMIN_PASSWORD') ?: Str::password(16);
            if (! env('SEED_ADMIN_PASSWORD')) {
                $this->command->warn("Admin password (shown once – store it now): {$password}");
            }
            $admin = User::create([
                'email' => 'admin@gmail.com',
                'phone' => '+998901234567',
                'name' => 'Admin',
                'password' => Hash::make($password),
            ]);
        }
        $admin->assignRole($roleAdmin);

        // ── Demo school ───────────────────────────────────────────────────────
        $school = \App\Models\School::firstOrCreate(
            ['name' => '1-sonli ixtisoslashtirilgan maktab'],
            [
                'address' => 'Toshkent shahri',
                'branch_limit' => 5,
                'branch_price' => 0,
                'valid_date' => now()->addYear()->toDateString(),
                'status' => 1,
            ]
        );

        UserSchool::firstOrCreate(['user_id' => $superadmin->id, 'school_id' => $school->id]);
        UserSchool::firstOrCreate(['user_id' => $admin->id, 'school_id' => $school->id]);
    }
}
