<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\DeleteRecord;
use App\Http\Requests\ShiftRequest;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $shifts = $this->scoped(Shift::with('branch')->withCount('classes'), 'branch', $request)
            ->orderBy('branch_id')
            ->orderBy('start_time')
            ->get();

        return $this->ok($shifts->map(fn (Shift $s) => $this->payload($s))->values());
    }

    public function store(ShiftRequest $request): JsonResponse
    {
        $shift = Shift::create($request->validated());

        return $this->ok($this->payload($shift->load('branch')->loadCount('classes')), status: 201);
    }

    public function update(ShiftRequest $request, Shift $shift): JsonResponse
    {
        $this->authorize('update', $shift);

        $shift->update($request->validated());

        return $this->ok($this->payload($shift->load('branch')->loadCount('classes')));
    }

    public function destroy(Shift $shift): JsonResponse
    {
        $this->authorize('delete', $shift);

        DeleteRecord::run($shift, 'crud.delete_shift_error');

        return $this->ok(null);
    }

    private function payload(Shift $shift): array
    {
        return [
            'id' => $shift->id,
            'name' => $shift->name,
            'start_time' => substr((string) $shift->start_time, 0, 5),
            'end_time' => substr((string) $shift->end_time, 0, 5),
            'branch_id' => $shift->branch_id,
            'branch_name' => $shift->branch?->name,
            'classes_count' => (int) $shift->classes_count,
        ];
    }
}
