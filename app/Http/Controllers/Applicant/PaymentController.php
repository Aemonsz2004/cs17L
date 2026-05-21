<?php

namespace App\Http\Controllers\Applicant;

use App\Http\Controllers\Controller;
use App\Models\RentalApplication;
use App\Models\RtmsNotification;
use App\Support\ApplicationPaymentService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private readonly ApplicationPaymentService $paymentService,
    ) {}

    public function chooseMethod(Request $request)
    {
        $data = $request->validate([
            'payment_method' => ['required', 'in:cash,gcash'],
        ]);

        $application = RentalApplication::where('user_id', auth()->id())
            ->where('status', RentalApplication::STATUS_APPROVED)
            ->latest()
            ->firstOrFail();

        if ($data['payment_method'] === 'gcash') {
            $this->paymentService->processDirectGcashPayment($application);

            return redirect()->back()->with('payment_success', true);
        }

        $application->update(['payment_method' => 'Cash']);

        RtmsNotification::create([
            'variant' => 'amber',
            'message' => "Applicant {$application->full_name} will pay with cash. Go to Applications to mark as paid.",
            'category' => 'lease',
            'tenant_id' => null,
            'unread' => true,
        ]);

        return redirect()->back()->with('success', 'You chose to pay with cash. The admin has been notified.');
    }
}
