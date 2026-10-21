<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\School;
use App\Support\Tenant;
use Illuminate\Http\JsonResponse;

class FilterController extends ApiController
{
    /**
     * Filtrlar uchun daraxt: maktab → filial → smena → sinf.
     */
    public function index(): JsonResponse
    {
        $schools = Tenant::restrict(School::query(), column: 'id')
            ->with(['branches' => fn ($q) => $q->orderBy('name')->with([
                'shifts' => fn ($q) => $q->orderBy('start_time')->with([
                    'classes' => fn ($q) => $q->orderBy('name'),
                ]),
            ])])
            ->orderBy('name')
            ->get();

        return $this->ok($schools->map(fn ($school) => [
            'id' => $school->id,
            'name' => $school->name,
            'branches' => $school->branches->map(fn ($branch) => [
                'id' => $branch->id,
                'name' => $branch->name,
                'shifts' => $branch->shifts->map(fn ($shift) => [
                    'id' => $shift->id,
                    'name' => $shift->name,
                    'start_time' => $shift->start_time,
                    'end_time' => $shift->end_time,
                    'classes' => $shift->classes->map(fn ($class) => [
                        'id' => $class->id,
                        'name' => $class->name,
                    ])->values(),
                ])->values(),
            ])->values(),
        ])->values());
    }
}
