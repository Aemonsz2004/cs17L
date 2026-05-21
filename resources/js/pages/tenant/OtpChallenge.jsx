import { Head, router, useForm, usePage } from '@inertiajs/react';
export default function OtpChallenge({ email, expiresAt }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        otp: '',
    });
    const submit = (event) => {
        event.preventDefault();
        post('/tenant/otp/verify');
    };
    const resend = () => {
        router.post('/tenant/otp/resend');
    };
    const goBackToLogin = () => {
        router.post('/logout');
    };
    const expiryLabel = expiresAt
        ? new Date(expiresAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
          })
        : null;
    return (
        <>
            <Head title="Email Verification" />
            <div className="flex min-h-screen items-center justify-center bg-[#FAF8F4] px-4">
                <div className="w-full max-w-md rounded-2xl border border-[#1B2B4B]/10 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-[#1B2B4B]">
                        Enter OTP   
                    </h1>
                    <p className="mt-1 text-sm text-[#5C6B88]">
                        We sent a 6-digit verification code to{' '}
                        <span className="font-medium text-[#1B2B4B]">
                            {email}
                        </span>
                        .
                    </p>
                    <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        ⏳ Code expires in{' '}
                        <span className="font-semibold">10 minutes</span>
                        {expiryLabel && (
                            <> (at {expiryLabel})</>
                        )}.
                    </p>

                    {/* {flash?.success && (
                        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                            {flash.success}
                        </p>
                    )}
                    {flash?.error && (
                        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {flash.error}
                        </p>
                    )} */}

                    <form className="mt-6 space-y-4" onSubmit={submit}>
                        <div>
                            <label
                                htmlFor="otp"
                                className="block text-sm font-medium text-[#1B2B4B]"
                            >
                                One-Time Password
                            </label>
                            <input
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={data.otp}
                                onChange={(event) =>
                                    setData(
                                        'otp',
                                        event.target.value.replace(/\D/g, ''),
                                    )
                                }
                                className="mt-1 w-full rounded-lg border border-[#1B2B4B]/20 px-3 py-2 text-center text-lg tracking-[0.35em] outline-none focus:ring-2 focus:ring-[#24A18F]/30"
                                placeholder="000000"
                                required
                            />
                            {errors.otp && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.otp}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-[#1B2B4B] py-2.5 font-medium text-white hover:bg-[#15233D] disabled:opacity-60"
                        >
                            {processing ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </form>

                    <button
                        type="button"
                        onClick={resend}
                        className="mt-3 w-full rounded-lg border border-[#1B2B4B]/20 py-2 text-sm font-medium text-[#1B2B4B] hover:bg-[#F4F6FA]"
                    >
                        Resend Code
                    </button>

                    <button
                        type="button"
                        onClick={goBackToLogin}
                        className="mt-2 w-full text-sm text-[#5C6B88] underline underline-offset-2 hover:text-[#1B2B4B]"
                    >
                        Wrong email? Go back to login
                    </button>
                </div>
            </div>
        </>
    );
}
