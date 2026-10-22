<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Branches\SaveBranch;
use App\Actions\DeleteRecord;
use App\Http\Requests\BranchRequest;
use App\Http\Resources\V1\DeviceResource;
use App\Models\Branch;
use App\Models\DailyAttendance;
use App\Models\Student;
use App\Support\Tenant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchController extends ApiController
{
    /** Branches with today's student counts. */
    public function index(Request $request): JsonResponse
    {
        $branches = Tenant::restrict(Branch::with('school')->withCount(['shifts', 'devices']))
            ->when($request->filled('school_id'), fn ($q) => $q->where('school_id', $request->integer('school_id')))
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%' . $request->input('search') . '%'))
            ->orderBy('name')
            ->get();

        $date = $this->date($request);
        $counts = $this->dayCounts($branches->pluck('id')->all(), $date);

        return $this->ok($branches->map(fn (Branch $b) => $this->payload($b) + ($counts[$b->id] ?? ['total_students' => 0, 'present_students' => 0, 'late_students' => 0]))->values());
    }

    /** One branch: its shifts (with classes), devices and MAC list, as on the web branch page. */
    public function show(Request $request, Branch $branch): JsonResponse
    {
        $this->authorize('view', $branch);

        $branch->load(['school', 'shifts' => fn ($q) => $q->orderBy('start_time')->withCount('classes'), 'shifts.classes' => fn ($q) => $q->orderBy('name'), 'devices']);
        $counts = $this->dayCounts([$branch->id], $this->date($request));

        return $this->ok($this->payload($branch) + ($counts[$branch->id] ?? []) + [
            'shifts' => $branch->shifts->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'start_time' => substr((string) $s->start_time, 0, 5),
                'end_time' => substr((string) $s->end_time, 0, 5),
                'classes' => $s->classes->map(fn ($c) => ['id' => $c->id, 'name' => $c->name])->values(),
            ])->values(),
            'devices' => DeviceResource::collection($branch->devices)->resolve($request),
            'mac_addresses' => $branch->devices->where('connection_type', 'http_listening')->pluck('mac_address')->filter()->values(),
        ]);
    }

    public function store(BranchRequest $request, SaveBranch $save): JsonResponse
    {
        $branch = $save->create($request->validated(), $request->user());

        return $this->ok($this->payload($branch->load('school')), status: 201);
    }

    public function update(BranchRequest $request, Branch $branch, SaveBranch $save): JsonResponse
    {
        $this->authorize('update', $branch);

        $save->update($branch, $request->validated(), $request->user());

        return $this->ok($this->payload($branch->load('school')));
    }

    public function destroy(Branch $branch): JsonResponse
    {
        $this->authorize('delete', $branch);

        DeleteRecord::run($branch, 'crud.branch_has_relations');

        return $this->ok(null);
    }

    private function payload(Branch $branch): array
    {
        return [
            'id' => $branch->id,
            'name' => $branch->name,
            'description' => $branch->description,
            'school_id' => $branch->school_id,
            'school_name' => $branch->school?->name,
            'shifts_count' => (int) ($branch->shifts_count ?? 0),
            'devices_count' => (int) ($branch->devices_count ?? 0),
        ];
    }

    /** @return array<int, array{total_students: int, present_students: int, late_students: int}> */
    private function dayCounts(array $branchIds, Carbon $date): array
    {
        $totals = Student::where('status', 'active')
            ->join('classes', 'students.class_id', '=', 'classes.id')
            ->join('shifts', 'classes.shift_id', '=', 'shifts.id')
            ->whereIn('shifts.branch_id', $branchIds)
            ->groupBy('shifts.branch_id')
            ->selectRaw('shifts.branch_id as branch_id, count(*) as total')
            ->pluck('total', 'branch_id');

        $present = DailyAttendance::whereDate('date', $date)
            ->join('students', 'daily_attendances.student_id', '=', 'students.id')
            ->join('classes', 'students.class_id', '=', 'classes.id')
            ->join('shifts', 'classes.shift_id', '=', 'shifts.id')
            ->whereIn('shifts.branch_id', $branchIds)
            ->groupBy('shifts.branch_id')
            ->selectRaw('shifts.branch_id as branch_id, count(*) as present, sum(case when daily_attendances.is_late then 1 else 0 end) as late')
            ->get()
            ->keyBy('branch_id');

        $out = [];
        foreach ($branchIds as $id) {
            $out[$id] = [
                'total_students' => (int) ($totals[$id] ?? 0),
                'present_students' => (int) ($present[$id]->present ?? 0),
                'late_students' => (int) ($present[$id]->late ?? 0),
            ];
        }

        return $out;
    }
}
