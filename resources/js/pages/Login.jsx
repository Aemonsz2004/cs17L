import { Head, Link, useForm } from '@inertiajs/react';
import { Input } from '../components/Input';
import Button from '../components/Button';
import PublicLayout from '../components/Layouts/PublicLayout';
export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };
    return (
        <>
            <Head title="Login" />
            <div className="flex min-h-screen items-center justify-center bg-[#FAF8F4] px-4">
                <div className="w-full max-w-md rounded-2xl border border-[#1B2B4B]/10 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-[#1B2B4B]">
                        Sign in
                    </h1>
                    <p className="mt-1 text-sm text-[#5C6B88]">
                        Use your account credentials to continue.
                    </p>

                    <form className="mt-6 space-y-4" onSubmit={submit}>
                        <Input
                            label="Email"
                            type="email"
                            required
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            error={errors.email}
                        />

                        <Input
                            label="Password"
                            type="password"
                            required
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            error={errors.password}
                        />

                        {/* <label className="inline-flex items-center gap-2 text-sm text-[#1B2B4B]">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) =>
                                    setData('remember', e.target.checked)
                                }
                                className="rounded border-[#1B2B4B]/30"
                            />
                            Remember me
                        </label> */}

                        <Button
                            type="submit"
                            loading={processing}
                            full
                        >
                            Sign in
                        </Button>
                    </form>

                    <p className="mt-4 text-sm text-[#5C6B88]">
                        New applicant?{' '}
                        <Link
                            href="/apply/register"
                            className="font-semibold text-[#24A18F] hover:underline"
                        >
                            Create an account
                        </Link>
                    </p>

                    <p className="mt-2 text-sm text-[#5C6B88]">
                        <Link
                            href="/"
                            className="font-semibold text-[#24A18F] hover:underline"
                        >
                            Back to Front Page
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}

Login.layout = (page) => <PublicLayout children={page} />;
