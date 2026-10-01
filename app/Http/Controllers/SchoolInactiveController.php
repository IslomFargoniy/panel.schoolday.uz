<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class SchoolInactiveController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('school/inactive', [
            'schools' => auth()->user()?->schools ?? [],
        ]);
    }
}
