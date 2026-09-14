"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Check whether the customer is already logged in
  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        router.replace("/dashboard");
        return;
      }

      setCheckingSession(false);
    }

    checkSession();
  }, [router]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setMessageType("success");

    const form = new FormData(event.currentTarget);

    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    if (!email || !password) {
      setMessageType("error");
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessageType("error");
      setMessage(error.message);
      return;
    }

    if (!data.user?.email_confirmed_at) {
      setMessageType("error");
      setMessage(
        "Please verify your email address before logging in. Check your inbox for the verification email."
      );
      return;
    }

    setMessageType("success");
    setMessage("Login successful! Taking you to your NILETEE portal...");

    setTimeout(() => {
      router.replace("/dashboard");
    }, 500);
  }

  async function handlePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setResetLoading(true);

    const email = resetEmail.trim();

    if (!email) {
      setResetLoading(false);
      setMessageType("error");
      setMessage("Please enter your email address.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setResetLoading(false);

    if (error) {
      setMessageType("error");
      setMessage(error.message);
      return;
    }

    setMessageType("success");
    setMessage(
      "Password reset email sent. Please check your inbox and click the reset link."
    );

    setResetEmail("");
  }

  // While checking whether the customer is already logged in
  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f1e5]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#17483b]/20 border-t-[#17483b]" />

          <p className="mt-4 font-bold text-[#173f35]">
            Checking your account...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f1e5] text-[#173f35]">
      <section className="min-h-screen lg:grid lg:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="relative hidden overflow-hidden bg-[#17483b] lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-[#17483b] via-[#1d5545] to-[#12382f]" />

          <div className="relative z-10 flex w-full flex-col items-center justify-center px-12 py-16 text-center">
            <Link href="/" className="mb-8">
              <img
                src="/logo.jpeg"
                alt="NILETEE"
                className="h-20 w-auto rounded-2xl object-contain"
              />
            </Link>

            <h1 className="max-w-xl text-4xl font-black leading-tight text-white xl:text-5xl">
              Welcome <span className="text-[#e5a451]">back.</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-8 text-white/80">
              Log in and continue requesting anything you need.
            </p>

            {/* CARTOON CHARACTER */}
            <div className="relative mt-12 h-[390px] w-[330px]">
              {/* Head */}
              <div className="absolute left-[85px] top-[20px] h-[125px] w-[125px] rounded-[48%] bg-[#8b542f] shadow-xl">
                <div className="absolute left-[25px] top-[45px] h-[12px] w-[12px] rounded-full bg-[#24170f]" />
                <div className="absolute right-[25px] top-[45px] h-[12px] w-[12px] rounded-full bg-[#24170f]" />

                <div className="absolute left-[42px] top-[75px] h-[24px] w-[42px] rounded-b-full border-b-4 border-white/80" />

                {/* Hair */}
                <div className="absolute -top-[12px] left-[2px] h-[55px] w-[121px] rounded-t-[55px] bg-[#20150f]" />
              </div>

              {/* Body */}
              <div className="absolute left-[52px] top-[135px] h-[190px] w-[190px] rounded-t-[70px] rounded-b-[35px] bg-[#0d342b] shadow-2xl">
                <div className="absolute left-[40px] top-[48px] flex h-[92px] w-[110px] items-center justify-center rounded-2xl bg-[#f7f1e5] shadow-lg">
                  <span className="text-xl font-black tracking-wide text-[#17483b]">
                    NILETEE
                  </span>
                </div>
              </div>

              {/* Arms */}
              <div className="absolute left-[20px] top-[165px] h-[115px] w-[45px] rotate-[18deg] rounded-full bg-[#0d342b]" />

              <div className="absolute right-[22px] top-[165px] h-[115px] w-[45px] -rotate-[28deg] rounded-full bg-[#0d342b]" />

              {/* Hands */}
              <div className="absolute left-[15px] top-[267px] h-[34px] w-[42px] rounded-full bg-[#8b542f]" />

              <div className="absolute right-[8px] top-[255px] h-[34px] w-[42px] rounded-full bg-[#8b542f]" />

              {/* Open book */}
              <div className="absolute left-[72px] top-[235px] flex h-[85px] w-[170px] -rotate-3 overflow-hidden rounded-xl bg-[#f3d9a9] shadow-2xl">
                <div className="w-1/2 border-r-2 border-[#b99661] p-3 text-left">
                  <div className="h-2 w-16 rounded bg-[#17483b]/30" />
                  <div className="mt-3 h-2 w-20 rounded bg-[#17483b]/20" />
                  <div className="mt-3 h-2 w-14 rounded bg-[#17483b]/20" />
                </div>

                <div className="w-1/2 p-3 text-left">
                  <div className="h-2 w-16 rounded bg-[#17483b]/30" />
                  <div className="mt-3 h-2 w-20 rounded bg-[#17483b]/20" />
                  <div className="mt-3 h-2 w-14 rounded bg-[#17483b]/20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-xl">
            {/* Mobile logo */}
            <div className="mb-8 lg:hidden">
              <Link href="/">
                <img
                  src="/logo.jpeg"
                  alt="NILETEE"
                  className="h-16 w-auto rounded-xl object-contain"
                />
              </Link>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-xl sm:p-10">
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#d68b36]">
                  Welcome back
                </p>

                <h2 className="mt-2 text-3xl font-black text-[#173f35] sm:text-4xl">
                  Log in to NILETEE
                </h2>

                <p className="mt-3 leading-7 text-slate-600">
                  Access your account and continue with your requests.
                </p>
              </div>

              {/* FORGOT PASSWORD PANEL */}
              {showForgotPassword ? (
                <div className="rounded-2xl border border-[#17483b]/10 bg-[#f7f1e5] p-5">
                  <div className="mb-5">
                    <h3 className="text-xl font-black text-[#173f35]">
                      Reset your password
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Enter the email address connected to your NILETEE
                      account. We&apos;ll send you a secure password reset link.
                    </p>
                  </div>

                  <form
                    onSubmit={handlePasswordReset}
                    className="space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="resetEmail"
                        className="mb-2 block text-sm font-bold text-[#173f35]"
                      >
                        Email address
                      </label>

                      <input
                        id="resetEmail"
                        type="email"
                        value={resetEmail}
                        onChange={(event) =>
                          setResetEmail(event.target.value)
                        }
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#17483b] focus:ring-2 focus:ring-[#17483b]/10"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full rounded-xl bg-[#17483b] px-5 py-3 font-black text-white transition hover:bg-[#10382e] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resetLoading
                        ? "Sending reset email..."
                        : "Send Reset Link"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setMessage("");
                      }}
                      className="w-full rounded-xl border border-[#17483b]/20 px-5 py-3 font-bold text-[#17483b] transition hover:bg-white"
                    >
                      Back to Login
                    </button>
                  </form>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-5">
                  {/* EMAIL */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-bold text-[#173f35]"
                    >
                      Email address
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#17483b] focus:ring-2 focus:ring-[#17483b]/10"
                    />
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="block text-sm font-bold text-[#173f35]"
                      >
                        Password
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setMessage("");
                        }}
                        className="text-sm font-bold text-[#17483b] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-20 outline-none transition focus:border-[#17483b] focus:ring-2 focus:ring-[#17483b]/10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#17483b]"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {/* REMEMBER ME */}
                  <label className="flex items-center gap-3 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      name="remember"
                      className="h-4 w-4 accent-[#17483b]"
                    />

                    <span>Remember me</span>
                  </label>

                  {/* MESSAGE */}
                  {message && (
                    <div
                      className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                        messageType === "error"
                          ? "bg-red-50 text-red-700"
                          : "bg-[#f7f1e5] text-[#173f35]"
                      }`}
                    >
                      {message}
                    </div>
                  )}

                  {/* LOGIN BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[#17483b] px-5 py-4 font-black text-white transition hover:bg-[#10382e] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Logging in..." : "Log In"}
                  </button>
                </form>
              )}

              {/* SUCCESS / ERROR MESSAGE FOR RESET */}
              {showForgotPassword && message && (
                <div
                  className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                    messageType === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* SIGNUP */}
              {!showForgotPassword && (
                <p className="mt-7 text-center text-sm text-slate-600">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="font-black text-[#17483b] hover:underline"
                  >
                    Create an account
                  </Link>
                </p>
              )}

              {/* HOME */}
              <Link
                href="/"
                className="mt-5 block text-center text-sm font-bold text-slate-500 hover:text-[#17483b]"
              >
                ← Back to homepage
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}