<?php

use App\Models\Branch;
use App\Models\BranchDevice;
use App\Models\User;

test('authenticated user can create a branch device with isup connection', function () {
    Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Admin']);
    $user = User::factory()->create();
    $user->assignRole('Admin');
    $this->actingAs($user);

    $branch = Branch::create([
        'name' => 'Bosh Filial',
        'description' => 'Asosiy filial binosi',
    ]);

    $response = $this->post(route('branch_device.store'), [
        'branch_id' => $branch->id,
        'name' => 'Kirish Turniketi (ISUP)',
        'mac_address' => 'AA:BB:CC:DD:EE:01',
        'connection_type' => 'isup',
        'device_id' => 'TERM_SCH_01',
        'encryption_key' => 'Hik12345678',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('branch_devices', [
        'branch_id' => $branch->id,
        'name' => 'Kirish Turniketi (ISUP)',
        'mac_address' => 'AA:BB:CC:DD:EE:01',
        'connection_type' => 'isup',
        'device_id' => 'TERM_SCH_01',
    ]);
});

test('authenticated user can delete a branch device', function () {
    Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Admin']);
    $user = User::factory()->create();
    $user->assignRole('Admin');
    $this->actingAs($user);

    $branch = Branch::create([
        'name' => 'Filial 2',
    ]);

    $device = BranchDevice::create([
        'branch_id' => $branch->id,
        'name' => 'Chiqish Turniketi',
        'mac_address' => 'AA:BB:CC:DD:EE:02',
        'connection_type' => 'http',
        'status' => 'active',
    ]);

    $response = $this->delete(route('branch_device.destroy', $device));
    $response->assertRedirect();

    $this->assertDatabaseMissing('branch_devices', [
        'id' => $device->id,
    ]);
});

test('hikvision get device key endpoint returns registered key', function () {
    $branch = Branch::create(['name' => 'Test Branch']);
    BranchDevice::create([
        'branch_id' => $branch->id,
        'name' => 'Hik ISUP Dev',
        'mac_address' => '11:22:33:44:55:66',
        'device_id' => 'DEV_TEST_101',
        'connection_type' => 'isup',
        'encryption_key' => 'SecretKey777',
    ]);

    $response = $this->getJson('/api/hikvision-device-key?deviceId=DEV_TEST_101');
    $response->assertOk()
        ->assertJson([
            'key' => 'SecretKey777',
            'deviceId' => 'DEV_TEST_101',
        ]);
});

test('hikvision update status endpoint marks device online', function () {
    $branch = Branch::create(['name' => 'Test Branch']);
    $device = BranchDevice::create([
        'branch_id' => $branch->id,
        'name' => 'Hik ISUP Dev',
        'mac_address' => '11:22:33:44:55:77',
        'device_id' => 'DEV_TEST_102',
        'connection_type' => 'isup',
        'is_online' => false,
    ]);

    $response = $this->postJson('/api/hikvision-device-status', [
        'deviceId' => 'DEV_TEST_102',
        'status' => 'online',
    ]);

    $response->assertOk();
    $device->refresh();
    expect($device->is_online)->toBeTrue();
    expect($device->last_seen_at)->not->toBeNull();
});
