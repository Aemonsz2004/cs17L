<?php

namespace App\Http\Controllers\Applicant;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicantRegisterRequest;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('applicant/Register');
    }

    public function store(StoreApplicantRegisterRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $localName = explode('@', $data['email'])[0] ?? 'Applicant';

        try {
            $user = User::create([
                'name' => ucfirst(strtolower($localName)),
                'email' => strtolower(trim($data['email'])),
                'password' => $data['password'],
                'role' => 'applicant',
                'tenant_id' => null,
                'must_change_password' => false,
            ]);
        } catch (QueryException $exception) {
            report($exception);

            $message = 'Unable to create applicant account right now. Please try again.';

            if (str_contains($exception->getMessage(), 'CHECK constraint failed: role')) {
                $message = 'Registration requires an updated database schema. Please run migrations and retry.';
            }

            return back()
                ->withInput($request->only('email'))
                ->withErrors([
                    'general' => $message,
                ]);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()
            ->route('applicant.dashboard')
            ->with('success', 'Applicant account created. Complete your application to continue.');
    }
}
