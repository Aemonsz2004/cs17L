import { Head, useForm } from "@inertiajs/react"
import type { FormEvent } from "react"

export default function Login() {
  const { data, setData, post, processing, errors } = useForm({
    email: "",
    password: "",
    remember: false,
  })

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    post("/login")
  }

  return (
    <>
      <Head title="Login" />
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-[#1B2B4B]/10 rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-[#1B2B4B]">Sign in</h1>
          <p className="text-sm text-[#5C6B88] mt-1">Use your account credentials to continue.</p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1B2B4B]">Email</label>
              <input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#1B2B4B]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#24A18F]/30"
                required
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1B2B4B]">Password</label>
              <input
                id="password"
                type="password"
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#1B2B4B]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#24A18F]/30"
                required
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-[#1B2B4B]">
              <input
                type="checkbox"
                checked={data.remember}
                onChange={(e) => setData("remember", e.target.checked)}
                className="rounded border-[#1B2B4B]/30"
              />
              Remember me
            </label>

            <button
              type="submit"
              disabled={processing}
              className="w-full rounded-lg bg-[#1B2B4B] text-white py-2.5 font-medium hover:bg-[#15233D] disabled:opacity-60"
            >
              {processing ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
