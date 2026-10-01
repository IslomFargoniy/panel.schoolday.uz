<?php

use App\Models\Branch;
use App\Models\BranchDevice;
use App\Models\School;
use App\Models\User;
use App\Models\UserSchool;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Superadmin']);
});

test('inactive school user gets a 403 json response instead of a server error', function () {
    $school = School::create(['name' => 'Inactive', 'status' => 0]);
    $user = User::factory()->create();
    UserSchool::create(['user_id' => $user->id, 'school_id' => $school->id]);

    $response = $this->actingAs($user)->getJson(route('dashboard'));

    $response->assertForbidden()
        ->assertJson(['error' => 'school_inactive', 'message' => 'school_inactive_or_expired']);
});

test('inactive school user is redirected to the notice page for html requests', function () {
    $school = School::create(['name' => 'Expired', 'status' => 1, 'valid_date' => now()->subDay()->toDateString()]);
    $user = User::factory()->create();
    UserSchool::create(['user_id' => $user->id, 'school_id' => $school->id]);

    $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('school.inactive'));
});

test('school creation failure flashes a translation key instead of throwing', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Superadmin');

    School::creating(function () {
        throw new Exception('db down');
    });

    $this->actingAs($admin)
        ->from(route('school.index'))
        ->post(route('school.store'), ['name' => 'X', 'branch_limit' => 1])
        ->assertRedirect(route('school.index'))
        ->assertSessionHas('error', ['key' => 'crud.school_create_error'])
        ->assertSessionHasNoErrors();

    School::flushEventListeners();
    Model::clearBootedModels();
});

test('device deletion failure flashes a translation key instead of throwing', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Superadmin');
    $school = School::create(['name' => 'S']);
    $branch = Branch::create(['school_id' => $school->id, 'name' => 'B']);
    $device = BranchDevice::create(['branch_id' => $branch->id, 'device_id' => 'D1', 'connection_type' => 'isup', 'status' => true]);

    BranchDevice::deleting(function () {
        throw new Exception('locked');
    });

    $this->actingAs($admin)
        ->from(route('devices.index'))
        ->delete(route('branch_device.destroy', $device))
        ->assertRedirect(route('devices.index'))
        ->assertSessionHas('error', ['key' => 'crud.device_delete_error'])
        ->assertSessionHasNoErrors();

    BranchDevice::flushEventListeners();
    Model::clearBootedModels();
});
