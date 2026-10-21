<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Branch;
use App\Models\DailyAttendance;
use App\Support\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MonitoringController extends ApiController
{
    /**
     * Filial → sinf → o'quvchilar, har biri kunlik holati bilan (on_time / late / absent).
     */
    public function index(Request $request): JsonResponse
    {
        $date = $this->date($request);

        $branches = Tenant::restrict(Branch::query())
            ->when($request->filled('school_id'), fn ($q) => $q->where('school_id', $request->integer('school_id')))
            ->when($request->filled('branch_id'), fn ($q) => $q->where('id', $request->integer('branch_id')))
            ->with(['shifts' => fn ($q) => $q->orderBy('start_time')->with([
                'classes' => fn ($q) => $q->orderBy('name')->with([
                    'students' => fn ($q) => $q->where('status', 'active')->orderBy('name'),
                ]),
            ])])
            ->orderBy('name')
            ->get();

        $studentIds = $branches->flatMap(fn ($b) => $b->shifts->flatMap(fn ($s) => $s->classes->flatMap(fn ($c) => $c->students->pluck('id'))));

        $attendances = DailyAttendance::whereIn('student_id', $studentIds)
            ->whereDate('date', $date)
            ->get()
            ->keyBy('student_id');

        $result = $branches->map(function ($branch) use ($attendances) {
            $classes = [];
            foreach ($branch->shifts as $shift) {
                foreach ($shift->classes as $class) {
                    $students = $class->students->map(function ($student) use ($attendances) {
                        $a = $attendances->get($student->id);

                        return [
                            'id' => $student->id,
                            'name' => $student->name,
                            'status' => ! $a ? 'absent' : ($a->is_late ? 'late' : 'on_time'),
                            'first_check_in' => $a?->first_check_in?->format('H:i'),
                            'last_check_out' => $a?->last_check_out?->format('H:i'),
                        ];
                    });

                    $classes[] = [
                        'id' => $class->id,
                        'name' => $class->name,
                        'shift_id' => $shift->id,
                        'shift_name' => $shift->name,
                        'total' => $students->count(),
                        'present' => $students->where('status', '!=', 'absent')->count(),
                        'late' => $students->where('status', 'late')->count(),
                        'students' => $students->values(),
                    ];
                }
            }

            return [
                'id' => $branch->id,
                'name' => $branch->name,
                'total' => array_sum(array_column($classes, 'total')),
                'present' => array_sum(array_column($classes, 'present')),
                'late' => array_sum(array_column($classes, 'late')),
                'classes' => $classes,
            ];
        });

        return $this->ok([
            'date' => $date->toDateString(),
            'updated_at' => now()->format('H:i:s'),
            'branches' => $result->values(),
        ]);
    }
}
