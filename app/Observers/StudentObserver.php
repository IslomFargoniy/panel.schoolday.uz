<?php

namespace App\Observers;

use App\Jobs\DeleteStudentFromDevicesJob;
use App\Jobs\SyncStudentToDevicesJob;
use App\Models\BranchDevice;
use App\Models\SchoolClass;
use App\Models\Student;

class StudentObserver
{
    /**
     * Hikvision related fields to watch for changes.
     *
     * @var array<int, string>
     */
    protected array $hikvisionFields = [
        'name',
        'employeeNoString',
        'face_image',
        'class_id',
        'status',
        'gender',
        'user_verify_mode',
        'local_ui_right',
        'door_right',
        'plan_template_no',
        'valid_begin',
        'valid_end',
        'valid_enabled',
    ];

    /**
     * Handle the Student "created" event.
     */
    public function created(Student $student): void
    {
        if (empty($student->employeeNoString)) {
            $student->employeeNoString = (string) $student->id;
            $student->saveQuietly();
        }

        if ($student->status === 'active') {
            SyncStudentToDevicesJob::dispatch($student->id)->afterCommit();
        }
    }

    /**
     * Handle the Student "updated" event.
     */
    public function updated(Student $student): void
    {
        // 1. Check if class/branch changed -> delete from old branch devices
        if ($student->wasChanged('class_id')) {
            $oldClassId = $student->getOriginal('class_id');
            if ($oldClassId) {
                $oldClass = SchoolClass::with('shift')->find($oldClassId);
                $newClass = SchoolClass::with('shift')->find($student->class_id);

                if ($oldClass && $newClass && $oldClass->shift?->branch_id !== $newClass->shift?->branch_id) {
                    $oldBranchDeviceIds = BranchDevice::where('branch_id', $oldClass->shift?->branch_id)
                        ->where('connection_type', 'isup')
                        ->whereNotNull('device_id')
                        ->pluck('id')
                        ->all();

                    if (! empty($oldBranchDeviceIds)) {
                        DeleteStudentFromDevicesJob::dispatch(
                            (string) ($student->employeeNoString ?: $student->id),
                            $oldBranchDeviceIds
                        )->afterCommit();
                    }
                }
            }
        }

        // 2. If status was changed to inactive, remove student from current devices
        if ($student->wasChanged('status') && $student->status === 'inactive') {
            $branchId = $student->schoolClass?->shift?->branch_id;
            if (! $branchId && $student->class_id) {
                $class = SchoolClass::with('shift')->find($student->class_id);
                $branchId = $class?->shift?->branch_id;
            }

            $deviceIds = $branchId
                ? BranchDevice::where('branch_id', $branchId)->where('connection_type', 'isup')->whereNotNull('device_id')->pluck('id')->all()
                : [];

            if (! empty($deviceIds)) {
                DeleteStudentFromDevicesJob::dispatch(
                    (string) ($student->employeeNoString ?: $student->id),
                    $deviceIds
                )->afterCommit();
            }

            return;
        }

        // 3. If active, sync to devices only if Hikvision-relevant fields changed
        if ($student->status === 'active') {
            $changedHikvision = false;
            foreach ($this->hikvisionFields as $field) {
                if ($student->wasChanged($field)) {
                    $changedHikvision = true;
                    break;
                }
            }

            if ($changedHikvision) {
                SyncStudentToDevicesJob::dispatch($student->id)->afterCommit();
            }
        }
    }

    /**
     * Handle the Student "deleted" event.
     */
    public function deleted(Student $student): void
    {
        $branchId = $student->schoolClass?->shift?->branch_id;
        if (! $branchId && $student->class_id) {
            $class = SchoolClass::with('shift')->find($student->class_id);
            $branchId = $class?->shift?->branch_id;
        }

        $deviceIds = $branchId
            ? BranchDevice::where('branch_id', $branchId)->where('connection_type', 'isup')->whereNotNull('device_id')->pluck('id')->all()
            : [];

        $employeeNo = (string) ($student->employeeNoString ?: $student->id);

        if (! empty($deviceIds)) {
            DeleteStudentFromDevicesJob::dispatch($employeeNo, $deviceIds)->afterCommit();
        }
    }
}
