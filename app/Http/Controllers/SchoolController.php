<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSchoolRequest;
use App\Http\Requests\UpdateSchoolRequest;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SchoolController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $per_page = $request->input('per_page', 15);

        $query = School::with([
            'school_setting',
            'user_schools.user',
        ])
            ->withCount(['branches']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('comment', 'like', "%{$search}%");
            });
        }

        if (Auth::check() && !Auth::user()->hasRole('Admin') && !Auth::user()->hasRole('Superadmin')) {
            $query->whereHas('user_schools', function ($q) {
                $q->where('user_id', Auth::id());
            });
        }

        $schools = $query->paginate($per_page);

        return Inertia::render('school/index', [
            'school' => $schools,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSchoolRequest $request)
    {
        try {
            $school = School::create($request->validated());

            // If created by an admin, also attach the creator if needed
            if (Auth::check()) {
                $school->user_schools()->create([
                    'user_id' => Auth::id(),
                ]);
            }

            return redirect()->back()->with('success', __('Maktab muvaffaqiyatli yaratildi.'));
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => [$e->getMessage() ?: __('Xatolik yuz berdi')],
            ]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, School $school)
    {
        if (Auth::check() && !Auth::user()->hasRole('Admin') && !Auth::user()->hasRole('Superadmin')) {
            Auth::user()->user_schools()
                ->where('school_id', $school->id)
                ->firstOrFail();
        }

        $school->load([
            'branches.devices',
            'school_setting',
            'user_schools.user',
        ]);

        return redirect()->route('branches.index', ['school_id' => $school->id]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSchoolRequest $request, School $school)
    {
        try {
            $school->update($request->validated());
            return redirect()->back()->with('success', __('Maktab muvaffaqiyatli yangilandi.'));
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => [$e->getMessage() ?: __('Xatolik yuz berdi')],
            ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(School $school)
    {
        try {
            $school->delete();
            return redirect()->back()->with('success', __('Maktab muvaffaqiyatli o‘chirildi.'));
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => [$e->getMessage() ?: __('Xatolik yuz berdi')],
            ]);
        }
    }
}
