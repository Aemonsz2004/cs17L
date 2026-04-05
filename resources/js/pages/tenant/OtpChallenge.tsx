import { Head, router, useForm, usePage } from "@inertiajs/react"
import type { FormEvent } from "react"

type OtpChallengeProps = {
  email: string
  expiresAt?: string | null
}

export default function OtpChallenge({ email, expiresAt }: OtpChallengeProps) {
  const { flash } = usePage<{
    flash?: {
      success?: string | null
      error?: string | null
    }
  }>().props

  const { data, setData, post, processing, errors } = useForm({
    otp: "",
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    post("/tenant/otp/verify")
  }

  const resend = () => {
    router.post("/tenant/otp/resend")
  }

  const goBackToLogin = () => {
    router.post("/logout")
  }

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null

  return (
    <>
      <Head title="Email Verification" />
      <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-[#1B2B4B]/10 rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-[#1B2B4B]">Enter OTP</h1>
          <p className="text-sm text-[#5C6B88] mt-1">
            We sent a 6-digit verification code to <span className="font-medium text-[#1B2B4B]">{email}</span>.
          </p>
          {expiryLabel && (
            <p className="text-xs text-[#5C6B88] mt-1">Code expires at {expiryLabel}.</p>
          )}

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
              <label htmlFor="otp" className="block text-sm font-medium text-[#1B2B4B]">One-Time Password</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={data.otp}
                onChange={(event) => setData("otp", event.target.value.replace(/\D/g, ""))}
                className="mt-1 w-full tracking-[0.35em] text-center text-lg rounded-lg border border-[#1B2B4B]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#24A18F]/30"
                placeholder="000000"
                required
              />
              {errors.otp && <p className="mt-1 text-sm text-red-600">{errors.otp}</p>}
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full rounded-lg bg-[#1B2B4B] text-white py-2.5 font-medium hover:bg-[#15233D] disabled:opacity-60"
            >
              {processing ? "Verifying..." : "Verify OTP"}
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
  )
}
