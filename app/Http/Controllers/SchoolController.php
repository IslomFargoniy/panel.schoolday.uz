<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSchoolRequest;
use App\Http\Requests\UpdateSchoolRequest;
use App\Models\School;
use App\Support\Tenant;
use Exception;
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

        if ($request->filled('status')) {
            $query->where('status', (bool) $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('comment', 'like', "%{$search}%");
            });
        }

        if (! Tenant::isGlobalAdmin()) {
            $query->whereIn('id', Tenant::schoolIds());
        }

        $schools = $query->paginate($per_page);

        return Inertia::render('school/index', [
            'school' => $schools,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'per_page' => $per_page,
            ],
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
        } catch (Exception $e) {
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
        $this->authorize('view', $school);

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
        $this->authorize('update', $school);

        try {
            $school->update($request->validated());

            return redirect()->back()->with('success', __('Maktab muvaffaqiyatli yangilandi.'));
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('School update error: ' . $e->getMessage());

            throw ValidationException::withMessages([
                'error' => [__('Maktabni yangilashda xatolik yuz berdi.')],
            ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(School $school)
    {
        $this->authorize('delete', $school);

        if ($school->branches()->count() > 0) {
            return redirect()->back()->with('error', __('Ushbu maktabda filiallar mavjud bo‘lganligi sababli uni o‘chirib bo‘lmaydi.'));
        }

        try {
            $school->delete();

            return redirect()->back()->with('success', __('Maktab muvaffaqiyatli o‘chirildi.'));
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('School delete error: ' . $e->getMessage());

            return redirect()->back()->with('error', __('Maktabni o‘chirishda xatolik yuz berdi.'));
        }
    }
}
