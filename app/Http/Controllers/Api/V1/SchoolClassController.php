<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\DeleteRecord;
use App\Http\Requests\SchoolClassRequest;
use App\Http\Resources\V1\AttendanceResource;
use App\Http\Resources\V1\SchoolClassResource;
use App\Http\Resources\V1\StudentResource;
use App\Models\DailyAttendance;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Support\Tenant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolClassController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $date = $this->date($request);

        $query = $this->withDayCounts(SchoolClass::with('shift.branch'), $date)
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%' . $request->input('search') . '%'))
            ->orderBy('name');

        $classes = $this->scoped($query, 'shift.branch', $request)->get();

        return $this->ok(SchoolClassResource::collection($classes));
    }

    /**
     * Sinf va uning o'quvchilari tanlangan kundagi davomati bilan.
     */
    public function show(Request $request, SchoolClass $schoolClass): JsonResponse
    {
        $this->authorize('view', $schoolClass);
        $date = $this->date($request);

        $class = $this->withDayCounts(SchoolClass::with('shift.branch'), $date)->findOrFail($schoolClass->id);
        $students = $class->students()->where('status', 'active')->orderBy('name')->get();
        $attendances = DailyAttendance::whereIn('student_id', $students->pluck('id'))
            ->whereDate('date', $date)
            ->get()
            ->keyBy('student_id');

        return $this->ok([
            'class' => (new SchoolClassResource($class))->resolve($request),
            'date' => $date->toDateString(),
            'students' => $students->map(function ($student) use ($attendances, $request) {
                $a = $attendances->get($student->id);

                return (new StudentResource($student))->resolve($request) + [
                    'attendance' => $a ? (new AttendanceResource($a))->resolve($request) : null,
                ];
            })->values(),
        ]);
    }

    public function store(SchoolClassRequest $request): JsonResponse
    {
        $data = $request->validated();
        $shift = Shift::with('branch')->findOrFail($data['shift_id']);
        Tenant::authorizeSchool($shift->branch?->school_id);

        $class = SchoolClass::create($data)->load('shift.branch');

        return $this->ok(new SchoolClassResource($class), status: 201);
    }

    public function update(SchoolClassRequest $request, SchoolClass $schoolClass): JsonResponse
    {
        $this->authorize('update', $schoolClass);
        $data = $request->validated();

        if ((int) $data['shift_id'] !== (int) $schoolClass->shift_id) {
            $shift = Shift::with('branch')->findOrFail($data['shift_id']);
            Tenant::authorizeSchool($shift->branch?->school_id);
        }

        $schoolClass->update($data);

        return $this->ok(new SchoolClassResource($schoolClass->load('shift.branch')));
    }

    public function destroy(SchoolClass $schoolClass): JsonResponse
    {
        $this->authorize('delete', $schoolClass);

        DeleteRecord::run($schoolClass, 'crud.delete_class_error');

        return $this->ok(null);
    }

    private function withDayCounts($query, Carbon $date)
    {
        $day = fn ($extra = null) => function ($q) use ($date, $extra) {
            $q->where('status', 'active')->whereHas('attendances', function ($a) use ($date, $extra) {
                $a->whereDate('date', $date);
                if ($extra !== null) {
                    $a->where('is_late', $extra);
                }
            });
        };

        return $query
            ->withCount(['students as total_students' => fn ($q) => $q->where('status', 'active')])
            ->withCount(['students as present_students' => $day()])
            ->withCount(['students as on_time_students' => $day(false)])
            ->withCount(['students as late_students' => $day(true)]);
    }
}
