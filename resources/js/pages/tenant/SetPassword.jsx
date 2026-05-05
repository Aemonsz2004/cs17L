import { Head, useForm, usePage } from '@inertiajs/react';
export default function SetPassword() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });
    const submit = (event) => {
        event.preventDefault();
        post('/tenant/set-password');
    };
    return (
        <>
            <Head title="Set Your Password" />
            <div className="flex min-h-screen items-center justify-center bg-[#FAF8F4] px-4">
                <div className="w-full max-w-md rounded-2xl border border-[#1B2B4B]/10 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-[#1B2B4B]">
                        Set Your Password
                    </h1>
                    <p className="mt-1 text-sm text-[#5C6B88]">
                        This is your first login. Update your password before
                        accessing the tenant portal.
                    </p>

                    {flash?.success && (
                        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                            {flash.success}
                        </p>
                    )}
                    {flash?.error && (
                        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {flash.error}
                        </p>
                    )}

                    <form className="mt-6 space-y-4" onSubmit={submit}>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-[#1B2B4B]"
                            >
                                New Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(event) =>
                                    setData('password', event.target.value)
                                }
                                className="mt-1 w-full rounded-lg border border-[#1B2B4B]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#24A18F]/30"
                                required
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password_confirmation"
                                className="block text-sm font-medium text-[#1B2B4B]"
                            >
                                Confirm Password
                            </label>
                            <input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(event) =>
                                    setData(
                                        'password_confirmation',
                                        event.target.value,
                                    )
                                }
                                className="mt-1 w-full rounded-lg border border-[#1B2B4B]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#24A18F]/30"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-[#1B2B4B] py-2.5 font-medium text-white hover:bg-[#15233D] disabled:opacity-60"
                        >
                            {processing ? 'Saving...' : 'Save New Password'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
