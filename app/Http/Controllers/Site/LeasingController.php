<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LeasingController extends Controller
{
    public function landing(): Response|RedirectResponse
    {
        if (Auth::check()) {
            $user = Auth::user();

            if ($user instanceof \App\Models\User) {
                if ($user->isAdmin()) {
                    return redirect()->route('admin.dashboard');
                }

                if ($user->isTenant()) {
                    return redirect()->route('tenant.home');
                }

                if ($user->isApplicant()) {
                    return redirect()->route('applicant.dashboard');
                }
            }

            return redirect()->route('login');
        }

        $units = Unit::where('status', 'vacant')
            ->orderBy('floor')
            ->orderBy('number')
            ->limit(6)
            ->get();

        return Inertia::render('public/Landing', [
            'property' => $this->propertyData(),
            'featuredUnits' => $units->map(fn (Unit $unit) => $this->mapUnit($unit))->values(),
        ]);
    }

    public function units(): Response
    {
        $units = Unit::where('status', 'vacant')
            ->orderBy('floor')
            ->orderBy('number')
            ->get();

        return Inertia::render('public/UnitsIndex', [
            'property' => $this->propertyData(),
            'units' => $units->map(fn (Unit $unit) => $this->mapUnit($unit))->values(),
        ]);
    }

    public function show(Unit $unit): Response
    {
        return Inertia::render('public/UnitShow', [
            'property' => $this->propertyData(),
            'unit' => $this->mapUnit($unit),
            'canApply' => $unit->status === 'vacant' && $unit->tenant_id === null,
        ]);
    }

    private function propertyData(): array
    {
        return [
            'name' => 'Pandarawan Commercial Center',
            'tagline' => 'Flexible office, retail, and medical spaces in one secure building.',
            'location' => 'Poblacion District, Dumaguete City, Negros Oriental',
            'amenities' => [
                '24/7 CCTV and security desk',
                'Backup generator and stable power',
                'Fiber-ready internet lines',
                'Dedicated loading bay and parking slots',
            ],
            'photos' => [
                'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
            ],
        ];
    }

    private function mapUnit(Unit $unit): array
    {
        $gallery = [
            sprintf('https://picsum.photos/seed/unit-%d-1/1200/700', $unit->id),
            sprintf('https://picsum.photos/seed/unit-%d-2/1200/700', $unit->id),
            sprintf('https://picsum.photos/seed/unit-%d-3/1200/700', $unit->id),
        ];

        return [
            'id' => $unit->id,
            'number' => $unit->number,
            'floor' => $unit->floor,
            'type' => $unit->type,
            'area' => $unit->area,
            'base_rent' => $unit->base_rent,
            'status' => $unit->status,
            'tenant_id' => $unit->tenant_id,
            'is_available' => $unit->status === 'vacant' && $unit->tenant_id === null,
            'gallery' => $gallery,
            'specs' => [
                'Floor' => $unit->floor,
                'Type' => $unit->type,
                'Size (sqm)' => (string) $unit->area,
                'Monthly Rate' => 'P' . number_format((int) $unit->base_rent),
            ],
        ];
    }
}
