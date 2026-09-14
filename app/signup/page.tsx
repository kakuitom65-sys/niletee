"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const form = new FormData(event.currentTarget);

    const firstName = String(form.get("firstName") || "").trim();
    const lastName = String(form.get("lastName") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const password = String(form.get("password") || "");
    const terms = form.get("terms");

    if (!firstName || !lastName || !email || !phone || !password) {
      setMessage("Please fill in all the required fields.");
      return;
    }

    if (!terms) {
      setMessage("Please agree to the Terms and Conditions.");
      return;
    }

    if (password.length < 6) {
      setMessage("Your password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone,
        },
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "Account created successfully. Please check your email if verification is required."
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
              Need it? <span className="text-[#e5a451]">NILETEE it.</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-8 text-white/80">
              Anything you need. We find it, buy it and bring it to you.
            </p>

            {/* CARTOON CHARACTER */}
            <div className="relative mt-12 h-[390px] w-[330px]">
              {/* head */}
              <div className="absolute left-[85px] top-[20px] h-[125px] w-[125px] rounded-[48%] bg-[#8b542f] shadow-xl">
                <div className="absolute left-[25px] top-[45px] h-[12px] w-[12px] rounded-full bg-[#24170f]" />
                <div className="absolute right-[25px] top-[45px] h-[12px] w-[12px] rounded-full bg-[#24170f]" />

                <div className="absolute left-[42px] top-[75px] h-[24px] w-[42px] rounded-b-full border-b-4 border-white/80" />

                {/* hair */}
                <div className="absolute -top-[12px] left-[2px] h-[55px] w-[121px] rounded-t-[55px] bg-[#20150f]" />
              </div>

              {/* body / sweatshirt */}
              <div className="absolute left-[52px] top-[135px] h-[190px] w-[190px] rounded-t-[70px] rounded-b-[35px] bg-[#0d342b] shadow-2xl">
                <div className="absolute left-[40px] top-[48px] flex h-[92px] w-[110px] items-center justify-center rounded-2xl bg-[#f7f1e5] shadow-lg">
                  <span className="text-xl font-black tracking-wide text-[#17483b]">
                    NILETEE
                  </span>
                </div>
              </div>

              {/* left arm */}
              <div className="absolute left-[20px] top-[165px] h-[115px] w-[45px] rotate-[18deg] rounded-full bg-[#0d342b]" />

              {/* right arm */}
              <div className="absolute right-[22px] top-[165px] h-[115px] w-[45px] -rotate-[28deg] rounded-full bg-[#0d342b]" />

              {/* hands */}
              <div className="absolute left-[15px] top-[267px] h-[34px] w-[42px] rounded-full bg-[#8b542f]" />
              <div className="absolute right-[8px] top-[255px] h-[34px] w-[42px] rounded-full bg-[#8b542f]" />

              {/* book */}
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
                  Welcome to NILETEE
                </p>

                <h2 className="mt-2 text-3xl font-black text-[#173f35] sm:text-4xl">
                  Create your account
                </h2>

                <p className="mt-3 leading-7 text-slate-600">
                  Create an account to start requesting anything you need.
                </p>
              </div>

              <form onSubmit={handleSignup} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-sm font-bold text-[#173f35]"
                    >
                      First name
                    </label>

                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="First name"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#17483b] focus:ring-2 focus:ring-[#17483b]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-sm font-bold text-[#173f35]"
                    >
                      Last name
                    </label>

                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Last name"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#17483b] focus:ring-2 focus:ring-[#17483b]/10"
                    />
                  </div>
                </div>

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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#17483b] focus:ring-2 focus:ring-[#17483b]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-bold text-[#173f35]"
                  >
                    Phone number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="07XX XXX XXX"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#17483b] focus:ring-2 focus:ring-[#17483b]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-bold text-[#173f35]"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
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

                <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                  <input
                    type="checkbox"
                    name="terms"
                    className="mt-1 h-4 w-4 accent-[#17483b]"
                  />

                  <span>
                    I agree to the NILETEE Terms and Conditions and Privacy
                    Policy.
                  </span>
                </label>

                {message && (
                  <div className="rounded-xl bg-[#f7f1e5] px-4 py-3 text-sm font-semibold text-[#173f35]">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#17483b] px-5 py-4 font-black text-white transition hover:bg-[#10382e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create My Account"}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-black text-[#17483b] hover:underline"
                >
                  Log in
                </Link>
              </p>

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