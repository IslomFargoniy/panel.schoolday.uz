<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\AttendanceExport;
use App\Http\Resources\V1\AttendanceResource;
use App\Http\Resources\V1\EventResource;
use App\Models\DailyAttendance;
use App\Models\HikvisionAccessEvent;
use App\Services\AttendanceReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends ApiController
{
    public function __construct(private AttendanceReport $report) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $this->filters($request);
        $filters['per_page'] = (string) $this->perPage();

        $meta = ['range_truncated' => false, 'effective_end_date' => null];
        if ($filters['status'] === 'absent') {
            [, $end, $truncated] = $this->report->resolveAbsentRange($filters['start_date'], $filters['end_date']);
            $meta = ['range_truncated' => $truncated, 'effective_end_date' => $truncated ? $end->toDateString() : null];
        }

        return $this->paginated($this->report->data($filters, true), AttendanceResource::class, $meta);
    }

    public function export(Request $request): BinaryFileResponse
    {
        return Excel::download(
            new AttendanceExport($this->report->data($this->filters($request), false)),
            'davomat_hisoboti_' . now()->format('Y-m-d_H-i') . '.xlsx'
        );
    }

    /**
     * Bitta davomat qatori va o'sha kundagi qurilma hodisalari (rasmlar bilan).
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $attendance = DailyAttendance::with('student.schoolClass.shift.branch')->findOrFail($id);
        $this->authorize('view', $attendance);

        $events = $attendance->student?->employeeNoString
            ? HikvisionAccessEvent::with('access')
                ->where('employeeNoString', $attendance->student->employeeNoString)
                ->whereHas('access', fn ($q) => $q->whereDate('dateTime', $attendance->date))
                ->get()
                ->sortBy(fn ($e) => $e->access?->dateTime)
                ->values()
            : collect();

        return $this->ok((new AttendanceResource($attendance))->resolve($request) + [
            'events' => EventResource::collection($events)->resolve($request),
        ]);
    }

    private function filters(Request $request): array
    {
        $request->validate([
            'start_date' => 'nullable|date_format:Y-m-d',
            'end_date' => 'nullable|date_format:Y-m-d',
            'status' => 'nullable|in:all,on_time,late,left_early,absent',
            'school_id' => 'nullable|integer',
            'branch_id' => 'nullable|integer',
            'shift_id' => 'nullable|integer',
            'class_id' => 'nullable|integer',
            'student_id' => 'nullable|integer',
        ]);

        return $this->report->filters($request);
    }
}
