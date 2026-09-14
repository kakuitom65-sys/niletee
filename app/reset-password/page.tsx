"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setValidSession(true);
      } else {
        setValidSession(false);
        setMessageType("error");
        setMessage(
          "This password reset link is invalid or has expired. Please request a new reset link."
        );
      }

      setCheckingSession(false);
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY" && session?.user) {
        setValidSession(true);
        setMessage("");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleResetPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (!password || !confirmPassword) {
      setMessageType("error");
      setMessage("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 6) {
      setMessageType("error");
      setMessage("Your password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("The passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setMessageType("error");
      setMessage(error.message);
      return;
    }

    setMessageType("success");
    setMessage(
      "Your password has been successfully changed. You can now log in."
    );

    setPassword("");
    setConfirmPassword("");

    setTimeout(async () => {
      await supabase.auth.signOut();
      router.replace("/login");
    }, 2000);
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f1e5]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#17483b]/20 border-t-[#17483b]" />

          <p className="mt-4 font-bold text-[#173f35]">
            Verifying your reset link...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f1e5] px-5 py-10 text-[#173f35]">
      <div className="mx-auto flex min-h-[90vh] max-w-lg items-center justify-center">
        <div className="w-full rounded-3xl bg-white p-7 shadow-xl sm:p-10">
          {/* LOGO */}
          <div className="mb-8 text-center">
            <Link href="/">
              <img
                src="/logo.jpeg"
                alt="NILETEE"
                className="mx-auto h-20 w-auto rounded-2xl object-contain"
              />
            </Link>
          </div>

          {/* TITLE */}
          <div className="mb-8 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#d68b36]">
              Account security
            </p>

            <h1 className="mt-2 text-3xl font-black text-[#173f35]">
              Create a new password
            </h1>

            <p className="mt-3 leading-7 text-slate-600">
              Choose a new password for your NILETEE account.
            </p>
          </div>

          {/* INVALID LINK */}
          {!validSession ? (
            <div>
              <div className="rounded-2xl bg-red-50 p-5 text-center">
                <div className="text-3xl">⚠️</div>

                <p className="mt-3 font-bold text-red-700">
                  Password reset link unavailable
                </p>

                <p className="mt-2 text-sm leading-6 text-red-600">
                  {message}
                </p>
              </div>

              <Link
                href="/login"
                className="mt-6 block w-full rounded-xl bg-[#17483b] px-5 py-4 text-center font-black text-white transition hover:bg-[#10382e]"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* NEW PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-[#173f35]"
                >
                  New password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your new password"
                    autoComplete="new-password"
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

              {/* CONFIRM PASSWORD */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-bold text-[#173f35]"
                >
                  Confirm new password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-20 outline-none transition focus:border-[#17483b] focus:ring-2 focus:ring-[#17483b]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#17483b]"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* PASSWORD REQUIREMENTS */}
              <div className="rounded-xl bg-[#f7f1e5] p-4 text-sm text-slate-600">
                <p className="font-bold text-[#173f35]">
                  Password requirements
                </p>

                <ul className="mt-2 space-y-1">
                  <li>• At least 6 characters</li>
                  <li>• Both password fields must match</li>
                </ul>
              </div>

              {/* MESSAGE */}
              {message && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                    messageType === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#17483b] px-5 py-4 font-black text-white transition hover:bg-[#10382e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Updating password..." : "Update Password"}
              </button>

              <Link
                href="/login"
                className="block text-center text-sm font-bold text-slate-500 hover:text-[#17483b]"
              >
                ← Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}