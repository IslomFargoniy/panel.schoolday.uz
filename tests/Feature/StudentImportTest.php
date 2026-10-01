<?php

use App\Imports\StudentsImport;
use App\Models\Branch;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\User;
use App\Models\UserSchool;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

beforeEach(function () {
    $this->schoolA = School::create([
        'name' => 'Maktab A',
        'branch_limit' => 5,
        'valid_date' => now()->addYear()->format('Y-m-d'),
        'status' => 1,
    ]);

    $this->branchA = Branch::create([
        'name' => 'Filial A',
        'school_id' => $this->schoolA->id,
    ]);

    $this->shiftA = Shift::create([
        'name' => 'Smena A',
        'branch_id' => $this->branchA->id,
        'start_time' => '08:00:00',
        'end_time' => '13:00:00',
    ]);

    $this->classA = SchoolClass::create([
        'name' => '1-A',
        'shift_id' => $this->shiftA->id,
    ]);

    $this->userA = User::factory()->create();
    UserSchool::create([
        'user_id' => $this->userA->id,
        'school_id' => $this->schoolA->id,
    ]);

    $this->schoolB = School::create([
        'name' => 'Maktab B',
        'branch_limit' => 5,
        'valid_date' => now()->addYear()->format('Y-m-d'),
        'status' => 1,
    ]);

    $this->branchB = Branch::create([
        'name' => 'Filial B',
        'school_id' => $this->schoolB->id,
    ]);

    $this->shiftB = Shift::create([
        'name' => 'Smena B',
        'branch_id' => $this->branchB->id,
        'start_time' => '08:00:00',
        'end_time' => '13:00:00',
    ]);

    $this->classB = SchoolClass::create([
        'name' => '1-B',
        'shift_id' => $this->shiftB->id,
    ]);
});

test('authenticated school user can import students for their own class', function () {
    Excel::fake();
    Storage::fake('local');

    $this->actingAs($this->userA);

    $file = UploadedFile::fake()->create('students.xlsx');

    $response = $this->post(route('students.import'), [
        'class_id' => $this->classA->id,
        'excel_file' => $file,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    Excel::assertImported('imports/' . $file->hashName(), function (StudentsImport $import) {
        return true;
    });
});

test('user cannot import students into a class of another school', function () {
    Excel::fake();
    Storage::fake('local');

    $this->actingAs($this->userA);

    $file = UploadedFile::fake()->create('students.xlsx');

    $response = $this->post(route('students.import'), [
        'class_id' => $this->classB->id, // Belongs to School B!
        'excel_file' => $file,
    ]);

    $response->assertStatus(403);
});

test('import route is not treated as student update route', function () {
    $this->actingAs($this->userA);

    // Missing required fields will trigger validation errors, confirming it hit StudentController::import, not update
    $response = $this->post(route('students.import'), []);

    $response->assertSessionHasErrors(['class_id', 'excel_file']);
});
