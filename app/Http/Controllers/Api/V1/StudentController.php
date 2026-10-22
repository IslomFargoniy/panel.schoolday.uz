<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\DeleteRecord;
use App\Actions\Students\SaveStudent;
use App\Exports\StudentsTemplateExport;
use App\Http\Requests\StudentRequest;
use App\Http\Resources\V1\AttendanceResource;
use App\Http\Resources\V1\EventResource;
use App\Http\Resources\V1\StudentResource;
use App\Imports\StudentsImport;
use App\Models\HikvisionAccessEvent;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Support\Tenant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class StudentController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['status' => 'nullable|in:active,inactive,all']);

        $query = Student::with('schoolClass.shift.branch')
            ->when($request->input('status', 'active') !== 'all', fn ($q) => $q->where('status', $request->input('status', 'active')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->input('search');
                $q->where(fn ($q) => $q->where('name', 'like', "%{$search}%")
                    ->orWhere('employeeNoString', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->when(\App\Support\Phone::searchDigits($search), fn ($q, $digits) => $q->orWhere('phone', 'like', "%{$digits}%")));
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

    public function store(StudentRequest $request, SaveStudent $save): JsonResponse
    {
        $student = $save->create($request->validated(), $request->file('face_image'), $request->user());

        return $this->ok((new StudentResource($student->fresh('schoolClass.shift.branch')))->resolve($request), status: 201);
    }

    /** POST, not PUT: PHP parses multipart bodies (the face photo) only on POST. */
    public function update(StudentRequest $request, Student $student, SaveStudent $save): JsonResponse
    {
        $this->authorize('update', $student);

        $save->update($student, $request->validated(), $request->file('face_image'), $request->user());

        return $this->ok((new StudentResource($student->fresh('schoolClass.shift.branch')))->resolve($request));
    }

    public function destroy(Student $student): JsonResponse
    {
        $this->authorize('delete', $student);

        DeleteRecord::run($student, 'crud.student_has_relations');

        return $this->ok(null);
    }

    public function template(): BinaryFileResponse
    {
        return Excel::download(new StudentsTemplateExport, 'shablon_oquvchilar.xlsx');
    }

    /** Rows are created in the background (queued import), like on the web panel. */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'excel_file' => 'required|file|mimes:xlsx,xls,csv',
            'class_id' => 'required|exists:classes,id',
        ]);

        $class = SchoolClass::with('shift.branch')->findOrFail($request->input('class_id'));
        Tenant::authorizeSchool($class->shift?->branch?->school_id);

        $path = $request->file('excel_file')->store('imports');
        Excel::queueImport(new StudentsImport($class->id), $path);

        return $this->ok(null, \App\Support\UiText::get('crud.students_imported_queued'), 202);
    }
}
