<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\Tenant;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Mobil ilova uchun umumiy javob konverti: {success, data, meta?, message?}.
 */
abstract class ApiController extends Controller
{
    protected function ok(mixed $data = null, ?string $message = null, int $status = 200): JsonResponse
    {
        if ($data instanceof JsonResource) {
            $data = $data->resolve(request());
        }

        return response()->json(array_filter([
            'success' => true,
            'data' => $data,
            'message' => $message,
        ], fn ($v) => $v !== null), $status);
    }

    protected function fail(string $message, int $status, array $extra = []): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message] + $extra, $status);
    }

    /**
     * @param  class-string<JsonResource>  $resource
     */
    protected function paginated(LengthAwarePaginator $paginator, string $resource, array $meta = []): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $resource::collection($paginator->getCollection())->resolve(request()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ] + $meta,
        ]);
    }

    /** "per_page" query value clamped to 1..100 (default 20). */
    protected function perPage(): int
    {
        return max(1, min(100, (int) request()->input('per_page', 20)));
    }

    /** "date" query value (Y-m-d), today by default. */
    protected function date(Request $request, string $key = 'date'): Carbon
    {
        $request->validate([$key => 'nullable|date_format:Y-m-d']);

        return $request->filled($key) ? Carbon::parse($request->input($key))->startOfDay() : Carbon::today();
    }

    /**
     * Foydalanuvchi maktablari bilan cheklaydi va school_id / branch_id / shift_id / class_id filtrlarini qo'llaydi.
     * $branchPath — so'rov modelidan Branch'gacha bo'lgan yo'l, masalan "student.schoolClass.shift.branch".
     */
    protected function scoped(Builder $query, string $branchPath, Request $request): Builder
    {
        Tenant::restrict($query, $branchPath);

        $shiftPath = $this->parentPath($branchPath);
        $classPath = $this->parentPath($shiftPath);

        $filters = [
            [$branchPath, 'school_id', 'school_id'],
            [$shiftPath, 'branch_id', 'branch_id'],
        ];

        if ($shiftPath !== '') {
            $filters[] = [$classPath, 'shift_id', 'shift_id'];
        }

        if ($classPath !== '') {
            $filters[] = [$this->parentPath($classPath), 'class_id', 'class_id'];
        }

        foreach ($filters as [$path, $column, $param]) {
            if (! $request->filled($param)) {
                continue;
            }

            $value = $request->integer($param);
            $path === ''
                ? $query->where($query->getModel()->qualifyColumn($column), $value)
                : $query->whereHas($path, fn (Builder $q) => $q->where($column, $value));
        }

        return $query;
    }

    private function parentPath(string $path): string
    {
        return str_contains($path, '.') ? substr($path, 0, strrpos($path, '.')) : '';
    }
}
