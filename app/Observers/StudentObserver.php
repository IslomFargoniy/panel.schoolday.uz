<?php

namespace App\Observers;

use App\Models\Student;
use App\Services\Hikvision\HikvisionSyncService;
use Exception;
use Illuminate\Support\Facades\Log;

class StudentObserver
{
    /**
     * Handle the Student "created" event.
     */
    public function created(Student $student): void
    {
        if (empty($student->employeeNoString)) {
            $student->employeeNoString = (string) $student->id;
            $student->saveQuietly();
        }

        try {
            app(HikvisionSyncService::class)->syncStudent($student);
        } catch (Exception $e) {
            Log::warning('StudentObserver sync failed on create: ' . $e->getMessage());
        }
    }

    /**
     * Handle the Student "updated" event.
     */
    public function updated(Student $student): void
    {
        try {
            app(HikvisionSyncService::class)->syncStudent($student);
        } catch (Exception $e) {
            Log::warning('StudentObserver sync failed on update: ' . $e->getMessage());
        }
    }

    /**
     * Handle the Student "deleted" event.
     */
    public function deleted(Student $student): void
    {
        try {
            app(HikvisionSyncService::class)->deleteStudent($student);
        } catch (Exception $e) {
            Log::warning('StudentObserver delete sync failed: ' . $e->getMessage());
        }
    }
}
