import { Head, useForm, usePage } from "@inertiajs/react"
import type { FormEvent } from "react"

export default function SetPassword() {
  const { flash } = usePage<{
    flash?: {
      success?: string | null
      error?: string | null
    }
  }>().props

  const { data, setData, post, processing, errors } = useForm({
    password: "",
    password_confirmation: "",
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    post("/tenant/set-password")
  }

  return (
    <>
      <Head title="Set Your Password" />
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-[#1B2B4B]/10 rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-[#1B2B4B]">Set Your Password</h1>
          <p className="text-sm text-[#5C6B88] mt-1">
            This is your first login. Update your password before accessing the tenant portal.
          </p>

          {flash?.success && (
            <p className="mt-3 text-sm rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-2">
              {flash.success}
            </p>
          )}
          {flash?.error && (
            <p className="mt-3 text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2">
              {flash.error}
            </p>
          )}

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1B2B4B]">New Password</label>
              <input
                id="password"
                type="password"
                value={data.password}
                onChange={(event) => setData("password", event.target.value)}
                className="mt-1 w-full rounded-lg border border-[#1B2B4B]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#24A18F]/30"
                required
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-[#1B2B4B]">Confirm Password</label>
              <input
                id="password_confirmation"
                type="password"
                value={data.password_confirmation}
                onChange={(event) => setData("password_confirmation", event.target.value)}
                className="mt-1 w-full rounded-lg border border-[#1B2B4B]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#24A18F]/30"
                required
              />
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full rounded-lg bg-[#1B2B4B] text-white py-2.5 font-medium hover:bg-[#15233D] disabled:opacity-60"
            >
              {processing ? "Saving..." : "Save New Password"}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
