<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\DailyAttendance;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class MonitoringController extends Controller
{
    public function index()
    {
        $schools = \App\Models\School::select('id', 'name')->get();
        $branches = Branch::select('id', 'name', 'school_id')->get();

        return Inertia::render('monitoring', [
            'schools' => $schools,
            'branches' => $branches,
        ]);
    }

    public function data(): JsonResponse
    {
        $today = Carbon::today()->toDateString();

        // Get all student IDs that have attendance today
        $presentStudentIds = DailyAttendance::where('date', $today)
            ->pluck('student_id')
            ->toArray();

        $branchesQuery = Branch::query();

        if (request()->filled('school_id')) {
            $branchesQuery->where('school_id', request('school_id'));
        }

        if (request()->filled('branch_id')) {
            $branchesQuery->where('id', request('branch_id'));
        }

        $branches = $branchesQuery->with([
            'shifts.classes.students' => function ($q) {
                $q->where('status', 'active')->orderBy('name');
            },
        ])->get();

        $result = [];

        foreach ($branches as $branch) {
            $branchData = [
                'id' => $branch->id,
                'name' => $branch->name,
                'classes' => [],
                'total_students' => 0,
                'present_students' => 0,
            ];

            foreach ($branch->shifts as $shift) {
                foreach ($shift->classes as $class) {
                    $classStudents = [];
                    $classPresent = 0;

                    foreach ($class->students as $student) {
                        $isPresent = in_array($student->id, $presentStudentIds);
                        if ($isPresent) {
                            $classPresent++;
                        }

                        $classStudents[] = [
                            'id' => $student->id,
                            'name' => $student->name,
                            'is_present' => $isPresent,
                        ];
                    }

                    $branchData['classes'][] = [
                        'id' => $class->id,
                        'name' => $class->name,
                        'shift_name' => $shift->name,
                        'students' => $classStudents,
                        'total' => count($classStudents),
                        'present' => $classPresent,
                    ];

                    $branchData['total_students'] += count($classStudents);
                    $branchData['present_students'] += $classPresent;
                }
            }

            $result[] = $branchData;
        }

        return response()->json([
            'branches' => $result,
            'updated_at' => now()->format('H:i:s'),
        ]);
    }
}
