<?php

namespace App\Console\Commands;

use App\Models\Branch;
use App\Models\DailyAttendance;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Models\User;
use App\Models\UserSchool;
use Carbon\CarbonPeriod;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Demo school for the Google Play reviewer: a school admin with sample students and a week of attendance.
 * Safe to re-run: restores the account (even if the reviewer deleted it or turned on 2FA) and refreshes attendance.
 * Nothing is sent to Hikvision devices or Telegram: the demo branch has no devices and classes have no groups.
 */
class PlayReviewDemoCommand extends Command
{
    protected $signature = 'schoolday:play-demo {--password= : Reviewer password (required on first run)}';

    protected $description = 'Create or reset the demo school and reviewer account for Google Play';

    private const EMAIL = 'review@schoolday.uz';

    private const SCHOOL = 'SchoolDay Demo School';

    private const STUDENTS = [
        '5-A' => ['Aliyev Jasur', 'Karimova Madina', 'Rahimov Bekzod', 'Tursunova Dilnoza', 'Yusupov Sardor', 'Nazarova Malika'],
        '6-B' => ['Ergashev Otabek', 'Qodirova Zarina', 'Saidov Amir', 'Xolmatova Sevara', 'Usmonov Doniyor', 'Abdullayeva Nilufar'],
    ];

    public function handle(): int
    {
        $user = User::withoutGlobalScopes()->where('email', self::EMAIL)->first();
        $password = $this->option('password');
        if (! $user && ! $password) {
            $this->error('First run needs --password=...');

            return self::FAILURE;
        }

        DB::transaction(function () use ($user, $password) {
            $school = School::firstOrCreate(['name' => self::SCHOOL], [
                'address' => 'Tashkent',
                'comment' => 'Google Play review demo',
                'branch_limit' => 2,
                'branch_price' => 0,
            ]);
            $school->update(['status' => 1, 'valid_date' => now()->addYear()->toDateString()]);

            $user ??= new User(['email' => self::EMAIL]);
            $user->name = 'Demo Admin';
            if ($password) {
                $user->password = Hash::make($password);
            }
            $user->forceFill([
                'email_verified_at' => $user->email_verified_at ?? now(),
                'two_factor_secret' => null,
                'two_factor_recovery_codes' => null,
                'two_factor_confirmed_at' => null,
            ])->save();
            UserSchool::firstOrCreate(['user_id' => $user->id, 'school_id' => $school->id]);

            $branch = Branch::firstOrCreate(['school_id' => $school->id, 'name' => 'Main building']);
            $shift = Shift::firstOrCreate(['branch_id' => $branch->id, 'name' => 'Morning'], ['start_time' => '08:00', 'end_time' => '13:00']);

            $students = collect();
            foreach (self::STUDENTS as $className => $names) {
                $class = SchoolClass::firstOrCreate(['name' => $className, 'shift_id' => $shift->id]);
                foreach ($names as $i => $name) {
                    $students->push(Student::firstOrCreate(['name' => $name, 'class_id' => $class->id], [
                        'gender' => $i % 2 ? 'female' : 'male',
                        'status' => 'active',
                    ]));
                }
            }

            $this->seedAttendance($students->all());
        });

        $this->info('Demo ready. Login: '.self::EMAIL.($password ? " / {$password}" : ' (password unchanged)'));

        return self::SUCCESS;
    }

    /** Last 7 school days (Mon–Sat) including today: most students on time, a few late, one or two absent. */
    private function seedAttendance(array $students): void
    {
        $ids = array_map(fn ($s) => $s->id, $students);
        DailyAttendance::whereIn('student_id', $ids)->where('date', '>=', now()->subDays(10)->toDateString())->delete();

        $days = collect(CarbonPeriod::create(now()->subDays(8), now()))->reject->isSunday()->take(-7);
        foreach ($days as $day) {
            foreach ($students as $n => $student) {
                $seed = crc32($student->id.$day->toDateString());
                if ($seed % 10 === 0) {
                    continue; // absent
                }
                $late = $seed % 7 === 0;
                $in = $day->copy()->setTime($late ? 8 : 7, $late ? 10 + $seed % 30 : 30 + $seed % 28);
                $out = $day->isToday() ? null : $day->copy()->setTime(13, 5 + $seed % 40);

                DailyAttendance::create([
                    'student_id' => $student->id,
                    'date' => $day->toDateString(),
                    'start_time' => '08:00',
                    'end_time' => '13:00',
                    'first_check_in' => $in,
                    'last_check_out' => $out,
                    'is_late' => $late,
                    'is_left_early' => false,
                ]);
            }
        }
    }
}
