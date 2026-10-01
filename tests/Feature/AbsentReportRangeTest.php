<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Superadmin']);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('Superadmin');
});

test('absent report longer than 31 days is truncated and flagged', function () {
    $this->actingAs($this->admin)
        ->get(route('reports.index', [
            'status' => 'absent',
            'start_date' => '2026-01-01',
            'end_date' => '2026-03-31',
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('reports/index')
            ->where('range_truncated', true)
            ->where('effective_end_date', '2026-02-01')
        );
});

test('absent report within 31 days is not flagged', function () {
    $this->actingAs($this->admin)
        ->get(route('reports.index', [
            'status' => 'absent',
            'start_date' => '2026-01-01',
            'end_date' => '2026-01-31',
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('range_truncated', false)
            ->where('effective_end_date', null)
        );
});

test('non-absent reports are never flagged as truncated', function () {
    $this->actingAs($this->admin)
        ->get(route('reports.index', [
            'status' => 'all',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('range_truncated', false));
});

test('reversed absent range is normalised before the cap is applied', function () {
    $this->actingAs($this->admin)
        ->get(route('reports.index', [
            'status' => 'absent',
            'start_date' => '2026-03-31',
            'end_date' => '2026-01-01',
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('range_truncated', true)
            ->where('effective_end_date', '2026-02-01')
        );
});

test('empty date filters fall back to today instead of failing', function () {
    foreach (['absent', 'all'] as $status) {
        $this->actingAs($this->admin)
            ->get("/reports?status={$status}&start_date=&end_date=")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.start_date', now()->toDateString())
                ->where('filters.end_date', now()->toDateString())
            );
    }
});
