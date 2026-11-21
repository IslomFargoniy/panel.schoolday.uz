<?php

use App\Models\Branch;
use App\Models\BranchDevice;
use App\Models\HikvisionAccessEvent;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Queue::fake();
    Role::firstOrCreate(['name' => 'Superadmin']);
    $this->school = School::create(['name' => 'S', 'status' => 1, 'valid_date' => now()->addYear()->toDateString()]);
    $this->branch = Branch::create(['school_id' => $this->school->id, 'name' => 'Bosh filial']);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('Superadmin');
    $this->actingAs($this->admin);
});

test('every new ISUP device gets its own Device ID and a key the terminal accepts, without a MAC address', function () {
    foreach (['Kirish', 'Chiqish'] as $name) {
        $this->post(route('branch_device.store'), ['branch_id' => $this->branch->id, 'name' => $name, 'connection_type' => 'isup', 'mac_address' => '', 'device_id' => '', 'encryption_key' => ''])
            ->assertSessionHasNoErrors();
    }

    $devices = BranchDevice::where('branch_id', $this->branch->id)->get();
    expect($devices)->toHaveCount(2)
        ->and($devices->pluck('device_id')->unique())->toHaveCount(2)
        ->and($devices->pluck('mac_address')->filter())->toBeEmpty();
    foreach ($devices as $device) {
        expect($device->device_id)->toMatch('/^school\d{6}$/')->toMatch(BranchDevice::ISUP_ID_PATTERN)
            ->and($device->encryption_key)->toMatch(BranchDevice::ISUP_KEY_PATTERN);
    }
});

test('a typed Device ID must be letters and digits and not taken by another device', function () {
    BranchDevice::create(['branch_id' => $this->branch->id, 'device_id' => 'branch1', 'connection_type' => 'isup', 'status' => false, 'encryption_key' => 'SchoolDay12026']);

    $this->post(route('branch_device.store'), ['branch_id' => $this->branch->id, 'connection_type' => 'isup', 'device_id' => 'branch1'])
        ->assertSessionHasErrors('device_id');
    $this->post(route('branch_device.store'), ['branch_id' => $this->branch->id, 'connection_type' => 'isup', 'device_id' => 'crm-1.uz'])
        ->assertSessionHasErrors('device_id');
    $this->post(route('branch_device.store'), ['branch_id' => $this->branch->id, 'connection_type' => 'isup', 'device_id' => 'kassa2', 'encryption_key' => '11221122'])
        ->assertSessionHasErrors('encryption_key');

    expect(BranchDevice::count())->toBe(1);
});

test('a typed Device ID without a key still gets a key', function () {
    $this->post(route('branch_device.store'), ['branch_id' => $this->branch->id, 'connection_type' => 'isup', 'device_id' => 'kassa2'])
        ->assertSessionHasNoErrors();

    expect(BranchDevice::where('device_id', 'kassa2')->value('encryption_key'))->toMatch(BranchDevice::ISUP_KEY_PATTERN);
});

test('HTTP listening still needs the MAC address', function () {
    $this->post(route('branch_device.store'), ['branch_id' => $this->branch->id, 'connection_type' => 'http_listening'])
        ->assertSessionHasErrors('mac_address');
});

test('an existing device keeps its Device ID and key when it is edited', function () {
    $device = BranchDevice::create(['branch_id' => $this->branch->id, 'device_id' => 'branch1', 'connection_type' => 'isup', 'encryption_key' => 'SchoolDay12026']);

    $this->put(route('branch_device.update', $device), ['branch_id' => $this->branch->id, 'name' => 'Kirish', 'connection_type' => 'isup', 'device_id' => 'branch1', 'encryption_key' => 'SchoolDay12026'])
        ->assertSessionHasNoErrors();

    expect($device->fresh()->only(['name', 'device_id', 'encryption_key']))
        ->toBe(['name' => 'Kirish', 'device_id' => 'branch1', 'encryption_key' => 'SchoolDay12026']);
});

test('the database refuses a second device with the same Device ID', function () {
    BranchDevice::create(['branch_id' => $this->branch->id, 'device_id' => 'branch1', 'connection_type' => 'isup', 'status' => false]);

    expect(fn () => BranchDevice::create(['branch_id' => $this->branch->id, 'device_id' => 'branch1', 'connection_type' => 'isup']))
        ->toThrow(UniqueConstraintViolationException::class);
});

test('an event is tied to the device by its Device ID when an old branch still lists the same MAC', function () {
    $oldBranch = Branch::create(['school_id' => $this->school->id, 'name' => 'Eski filial']);
    $old = BranchDevice::create(['branch_id' => $oldBranch->id, 'mac_address' => 'E0:CA:3C:F9:F5:89', 'device_id' => 'branch7', 'connection_type' => 'isup', 'last_seen_at' => now()]);
    $new = BranchDevice::create(['branch_id' => $this->branch->id, 'mac_address' => 'E0:CA:3C:F9:F5:89', 'device_id' => 'school821668', 'connection_type' => 'isup']);
    $studentIn = function (Branch $branch, string $no) {
        $shift = Shift::create(['branch_id' => $branch->id, 'name' => 'Sh', 'start_time' => '08:00', 'end_time' => '13:00']);
        $class = SchoolClass::create(['shift_id' => $shift->id, 'name' => 'C']);

        return Student::create(['class_id' => $class->id, 'name' => 'Stu', 'employeeNoString' => $no, 'status' => 'active']);
    };
    $studentIn($this->branch, 'E-1');
    $studentIn($oldBranch, 'E-2');
    $event = fn (string $no) => $this->postJson('/api/hikvision-callback', [
        'dateTime' => now()->format('Y-m-d\TH:i:sP'),
        'macAddress' => 'e0-ca-3c-f9-f5-89',
        'deviceID' => 'school821668',
        'AccessControllerEvent' => ['employeeNoString' => $no, 'deviceName' => 'T'],
    ])->assertOk();

    $event('E-1')->assertJson(['success' => true]);
    $event('E-2')->assertJson(['reason' => 'student_branch_mismatch']);

    expect(HikvisionAccessEvent::pluck('employeeNoString')->all())->toBe(['E-1'])
        ->and($new->fresh()->last_seen_at)->not->toBeNull()
        ->and($old->fresh()->is_online)->toBeFalse();
});

test('without a Device ID the event falls back to the MAC of the most recently seen device', function () {
    $oldBranch = Branch::create(['school_id' => $this->school->id, 'name' => 'Eski filial']);
    BranchDevice::create(['branch_id' => $oldBranch->id, 'mac_address' => 'E0:CA:3C:F9:F5:89', 'device_id' => 'branch7', 'connection_type' => 'isup', 'last_seen_at' => now()->subDays(3)]);
    $new = BranchDevice::create(['branch_id' => $this->branch->id, 'mac_address' => 'E0:CA:3C:F9:F5:89', 'device_id' => 'school821668', 'connection_type' => 'isup', 'last_seen_at' => now()->subMinute()]);
    $shift = Shift::create(['branch_id' => $this->branch->id, 'name' => 'Sh', 'start_time' => '08:00', 'end_time' => '13:00']);
    $class = SchoolClass::create(['shift_id' => $shift->id, 'name' => 'C']);
    Student::create(['class_id' => $class->id, 'name' => 'Stu', 'employeeNoString' => 'E-1', 'status' => 'active']);

    $this->postJson('/api/hikvision-callback', [
        'macAddress' => 'e0:ca:3c:f9:f5:89',
        'AccessControllerEvent' => ['employeeNoString' => 'E-1'],
    ])->assertOk()->assertJson(['success' => true]);

    expect($new->fresh()->last_seen_at->gt(now()->subSeconds(30)))->toBeTrue();
});

test('the app gets the server address with a fresh unique Device ID and key, and sees the key of an ISUP device', function () {
    BranchDevice::create(['branch_id' => $this->branch->id, 'device_id' => 'branch1', 'connection_type' => 'isup', 'encryption_key' => 'SchoolDay12026']);
    Sanctum::actingAs($this->admin, ['school']);

    $connection = $this->getJson('/api/v1/devices/connection')->assertOk()->json('data');
    expect($connection['isup_device_id'])->toMatch('/^school\d{6}$/')
        ->and($connection['isup_key'])->toMatch(BranchDevice::ISUP_KEY_PATTERN)
        ->and($connection['server_domain'])->toBe(config('hikvision.server_domain'))
        ->and($connection['server_ip'])->toBe(config('hikvision.server_ip'));

    $created = $this->postJson('/api/v1/devices', ['branch_id' => $this->branch->id, 'connection_type' => 'isup', 'mac_address' => null])
        ->assertCreated()->json('data');
    expect($created['mac_address'])->toBeNull()
        ->and($created['device_id'])->toMatch('/^school\d{6}$/')
        ->and($created['encryption_key'])->toMatch(BranchDevice::ISUP_KEY_PATTERN);

    $listed = collect($this->getJson('/api/v1/devices')->assertOk()->json('data'))->keyBy('device_id');
    expect($listed['branch1']['encryption_key'])->toBe('SchoolDay12026');
});
