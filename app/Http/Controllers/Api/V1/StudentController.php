<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\AttendanceResource;
use App\Http\Resources\V1\EventResource;
use App\Http\Resources\V1\StudentResource;
use App\Models\HikvisionAccessEvent;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['status' => 'nullable|in:active,inactive']);

        $query = Student::with('schoolClass.shift.branch')
            ->where('status', $request->input('status', 'active'))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->input('search');
                $q->where(fn ($q) => $q->where('name', 'like', "%{$search}%")
                    ->orWhere('employeeNoString', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%"));
            })
            ->orderBy('name');

        return $this->paginated(
            $this->scoped($query, 'schoolClass.shift.branch', $request)->paginate($this->perPage()),
            StudentResource::class
        );
    }

    /**
     * O'quvchi va uning "month" (Y-m) oyidagi davomati.
     */
    public function show(Request $request, Student $student): JsonResponse
    {
        $this->authorize('view', $student);
        $request->validate(['month' => 'nullable|date_format:Y-m']);

        $month = $request->filled('month') ? Carbon::createFromFormat('Y-m-d', $request->input('month') . '-01') : Carbon::today();
        $from = $month->copy()->startOfMonth();
        $to = $month->copy()->endOfMonth();

        $attendances = $student->attendances()
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->orderByDesc('date')
            ->get();

        $student->load('schoolClass.shift.branch');

        return $this->ok([
            'student' => (new StudentResource($student))->resolve($request),
            'month' => $from->format('Y-m'),
            'summary' => [
                'present' => $attendances->count(),
                'late' => $attendances->where('is_late', true)->count(),
                'left_early' => $attendances->where('is_left_early', true)->whereNotNull('last_check_out')->count(),
            ],
            'attendances' => AttendanceResource::collection($attendances)->resolve($request),
        ]);
    }

    public function events(Request $request, Student $student): JsonResponse
    {
        $this->authorize('view', $student);

        $events = $student->employeeNoString
            ? HikvisionAccessEvent::with('access')
                ->where('employeeNoString', $student->employeeNoString)
                ->orderByDesc('id')
                ->limit(30)
                ->get()
            : collect();

        return $this->ok(EventResource::collection($events));
    }
}
