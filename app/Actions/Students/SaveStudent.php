<?php

namespace App\Actions\Students;

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use App\Support\Tenant;
use Illuminate\Http\UploadedFile;

class SaveStudent
{
    /** NOT NULL columns with a database default: a blank form field means "use the default / keep". */
    private const DEFAULTED = ['gender', 'user_verify_mode', 'door_right', 'plan_template_no', 'local_ui_right', 'valid_enabled', 'status'];

    public function create(array $data, ?UploadedFile $faceImage, User $user): Student
    {
        $this->authorizeClass($data['class_id'], $user);
        $data = $this->withFaceImage($this->withoutBlankDefaults($data), $faceImage);

        return Student::create($data);
    }

    public function update(Student $student, array $data, ?UploadedFile $faceImage, User $user): Student
    {
        $data = $this->withoutBlankDefaults($data);

        if (isset($data['class_id']) && (int) $data['class_id'] !== (int) $student->class_id) {
            $this->authorizeClass($data['class_id'], $user);
        }

        // No new file = keep the current photo
        if ($faceImage) {
            $data = $this->withFaceImage($data, $faceImage);
        } else {
            unset($data['face_image']);
        }

        $student->update($data);

        return $student;
    }

    private function withoutBlankDefaults(array $data): array
    {
        foreach (self::DEFAULTED as $key) {
            if (array_key_exists($key, $data) && $data[$key] === null) {
                unset($data[$key]);
            }
        }

        return $data;
    }

    private function authorizeClass(int|string $classId, User $user): void
    {
        $class = SchoolClass::with('shift.branch')->findOrFail($classId);
        Tenant::authorizeSchool($class->shift?->branch?->school_id, $user);
    }

    /** Stored on the public disk; StudentObserver then pushes the face to the terminals. */
    private function withFaceImage(array $data, ?UploadedFile $faceImage): array
    {
        if ($faceImage) {
            $data['face_image'] = '/storage/' . $faceImage->store('faces', 'public');
        } else {
            unset($data['face_image']);
        }

        return $data;
    }
}
