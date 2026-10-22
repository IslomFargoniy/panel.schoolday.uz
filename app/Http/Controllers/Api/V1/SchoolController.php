<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Schools\CreateSchool;
use App\Actions\Schools\DeleteSchool;
use App\Http\Requests\StoreSchoolRequest;
use App\Http\Requests\StoreSchoolSettingRequest;
use App\Http\Requests\UpdateSchoolRequest;
use App\Models\School;
use App\Models\SchoolSetting;
use App\Models\User;
use App\Models\UserSchool;
use App\Support\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Schools. Everyone sees their own schools; creating, editing, deleting, settings and
 * attaching users are for Admin / Superadmin (the routes carry that middleware).
 */
class SchoolController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $schools = Tenant::restrict(School::with(['school_setting', 'user_schools.user'])->withCount('branches'), column: 'id')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->integer('status')))
            ->when($request->filled('search'), fn ($q) => $q->where(fn ($q) => $q
                ->where('name', 'like', '%' . $request->input('search') . '%')
                ->orWhere('address', 'like', '%' . $request->input('search') . '%')
                ->orWhere('comment', 'like', '%' . $request->input('search') . '%')))
            ->orderBy('name')
            ->get();

        return $this->ok($schools->map(fn (School $s) => $this->payload($s))->values());
    }

    public function show(School $school): JsonResponse
    {
        $this->authorize('view', $school);

        return $this->ok($this->payload($school->load(['school_setting', 'user_schools.user'])->loadCount('branches')));
    }

    public function store(StoreSchoolRequest $request, CreateSchool $create): JsonResponse
    {
        $school = $create($request->validated(), $request->user());

        return $this->ok($this->payload($school->load(['school_setting', 'user_schools.user'])->loadCount('branches')), status: 201);
    }

    public function update(UpdateSchoolRequest $request, School $school): JsonResponse
    {
        $this->authorize('update', $school);

        $school->update($request->validated());

        return $this->ok($this->payload($school->load(['school_setting', 'user_schools.user'])->loadCount('branches')));
    }

    public function destroy(School $school, DeleteSchool $delete): JsonResponse
    {
        $this->authorize('delete', $school);

        $delete($school);

        return $this->ok(null);
    }

    public function saveSettings(StoreSchoolSettingRequest $request, School $school): JsonResponse
    {
        // The school comes from the URL, never from the body
        SchoolSetting::updateOrCreate(['school_id' => $school->id], array_merge($request->validated(), ['school_id' => $school->id]));

        return $this->ok($this->payload($school->load(['school_setting', 'user_schools.user'])->loadCount('branches')));
    }

    public function attachUser(Request $request, School $school): JsonResponse
    {
        $data = $request->validate(['user_id' => 'required|exists:users,id']);
        UserSchool::firstOrCreate(['user_id' => $data['user_id'], 'school_id' => $school->id]);

        return $this->ok($this->payload($school->load(['school_setting', 'user_schools.user'])->loadCount('branches')));
    }

    public function detachUser(School $school, User $user): JsonResponse
    {
        UserSchool::where('school_id', $school->id)->where('user_id', $user->id)->delete();

        return $this->ok($this->payload($school->load(['school_setting', 'user_schools.user'])->loadCount('branches')));
    }

    private function payload(School $school): array
    {
        $setting = $school->school_setting;

        return [
            'id' => $school->id,
            'name' => $school->name,
            'address' => $school->address,
            'comment' => $school->comment,
            'branch_limit' => $school->branch_limit,
            'branch_price' => $school->branch_price !== null ? (float) $school->branch_price : null,
            'valid_date' => $school->valid_date,
            'status' => (int) $school->status,
            'branches_count' => (int) ($school->branches_count ?? 0),
            'settings' => [
                'telegram_channel_id' => $setting?->telegram_channel_id,
                'timezone' => $setting?->timezone,
                'sms_sender' => $setting?->sms_sender,
                'webhook_url' => $setting?->webhook_url,
            ],
            'users' => $school->user_schools->filter(fn ($us) => $us->user)->map(fn ($us) => [
                'id' => $us->user->id,
                'name' => $us->user->name,
                'email' => $us->user->email,
                'phone' => $us->user->phone,
            ])->values(),
        ];
    }
}
