import { Head, Link, useForm } from '@inertiajs/react';

import PublicLayout from '../../components/Layouts/PublicLayout';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post('/apply/register');
    };

    return (
        <>
            <Head title="Applicant Registration" />

            <div className="flex min-h-screen items-center justify-center bg-[#f3efe7] px-4">
                <div className="w-full max-w-md rounded-2xl border border-[#15233d]/10 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-[#15233d]">Create Applicant Account</h1>
                    <p className="mt-1 text-sm text-[#42506b]">
                        Register with email and password. You will apply for a unit in the next step.
                    </p>

                    {errors.general && (
                        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {errors.general}
                        </div>
                    )}

                    <form className="mt-5 space-y-4" onSubmit={submit}>
                        <div>
                            <label htmlFor="register-email" className="block text-sm font-medium text-[#15233d]">Email</label>
                            <input
                                id="register-email"
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                autoComplete="email"
                                className="mt-1 w-full rounded-lg border border-[#15233d]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d7b6e]/30"
                                required
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label htmlFor="register-password" className="block text-sm font-medium text-[#15233d]">Password</label>
                            <input
                                id="register-password"
                                type="password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                autoComplete="new-password"
                                className="mt-1 w-full rounded-lg border border-[#15233d]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d7b6e]/30"
                                required
                            />
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                        </div>

                        <div>
                            <label htmlFor="register-password-confirmation" className="block text-sm font-medium text-[#15233d]">Confirm Password</label>
                            <input
                                id="register-password-confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(event) => setData('password_confirmation', event.target.value)}
                                autoComplete="new-password"
                                className="mt-1 w-full rounded-lg border border-[#15233d]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1d7b6e]/30"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-[#15233d] py-2.5 font-semibold text-white hover:bg-[#0f1a2d] disabled:opacity-60"
                        >
                            {processing ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <p className="mt-4 text-sm text-[#42506b]">
                        Already registered?{' '}
                        <Link href="/login" className="font-semibold text-[#1d7b6e] hover:underline">
                            Sign in
                        </Link>
                    </p>

                    <p className="mt-2 text-sm text-[#42506b]">
                        <Link href="/" className="font-semibold text-[#1d7b6e] hover:underline">
                            Back to Front Page
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}

Register.layout = (page) => <PublicLayout children={page} />;
