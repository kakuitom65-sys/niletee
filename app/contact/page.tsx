"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ContactPage() {
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [sending, setSending] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("General Inquiry");
  const [message, setMessage] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    setLoadingUser(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);
    setUserEmail(user.email || "");

    // Try to load customer name from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, name")
      .eq("id", user.id)
      .maybeSingle();

    const customerName =
      profile?.full_name ||
      profile?.name ||
      user.email?.split("@")[0] ||
      "";

    setName(customerName);
    setEmail(user.email || "");

    setLoadingUser(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccess("");
    setError("");

    if (!userId) {
      setError("You must be logged in to send a message.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!subject.trim()) {
      setError("Please select a subject.");
      return;
    }

    if (!message.trim()) {
      setError("Please enter your message.");
      return;
    }

    setSending(true);

    try {
      const { data: currentUserData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !currentUserData.user) {
        setError("Your login session has expired. Please log in again.");
        router.replace("/login");
        return;
      }

      const currentUser = currentUserData.user;

      console.log("Sending contact message...");
      console.log("User ID:", currentUser.id);
      console.log("Email:", currentUser.email);

      const { error: insertError } = await supabase
        .from("contact_messages")
        .insert({
          user_id: currentUser.id,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          subject: subject.trim(),
          message: message.trim(),
          status: "new",
        });

      if (insertError) {
        console.error("CONTACT INSERT ERROR");
        console.error("Message:", insertError.message);
        console.error("Details:", insertError.details);
        console.error("Hint:", insertError.hint);
        console.error("Code:", insertError.code);
        console.error("Full error:", JSON.stringify(insertError, null, 2));

        setError(
          insertError.message ||
            insertError.details ||
            "Unable to send your message. Please try again."
        );

        return;
      }

      setSuccess(
        "Your message has been sent successfully. NILETEE will get back to you soon."
      );

      setPhone("");
      setSubject("General Inquiry");
      setMessage("");
    } catch (err) {
      console.error("Unexpected contact error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while sending your message."
      );
    } finally {
      setSending(false);
    }
  }

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-[#07111f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-5" />

          <p className="text-slate-300 font-medium">
            Loading contact page...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
                N
              </div>

              <div>
                <h1 className="text-xl font-black tracking-wide">
                  NILETEE
                </h1>
                <p className="text-xs text-slate-400">
                  Customer Portal
                </p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              <Link
                href="/"
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                Home
              </Link>

              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                Dashboard
              </Link>

              <Link
                href="/requests"
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                My Requests
              </Link>

              <Link
                href="/orders"
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                My Orders
              </Link>

              <Link
                href="/contact"
                className="px-4 py-2 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/20"
              >
                Contact Us
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* INTRO */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm mb-5">
              <span>💬</span>
              <span>NILETEE Customer Support</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-5">
              How can we{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                help you?
              </span>
            </h2>

            <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
              Send us a message and our team will review your request and
              get back to you as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-8">
            {/* LEFT INFORMATION */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <h3 className="text-xl font-bold mb-6">
                  Contact NILETEE
                </h3>

                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      📧
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="text-slate-200">
                        support@niletee.com
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      📱
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Phone</p>
                      <p className="text-slate-200">
                        NILETEE Customer Support
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      🕐
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Support Hours</p>
                      <p className="text-slate-200">
                        Monday - Saturday
                      </p>
                      <p className="text-slate-400 text-sm">
                        8:00 AM - 6:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-7">
                <div className="text-3xl mb-4">🚀</div>

                <h3 className="text-xl font-bold mb-3">
                  Need something sourced?
                </h3>

                <p className="text-slate-400 leading-relaxed mb-6">
                  Instead of sending a general message, you can create a
                  request and let NILETEE help you find the product or
                  service you need.
                </p>

                <Link
                  href="/requests"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition"
                >
                  Make a Request →
                </Link>
              </div>
            </div>

            {/* CONTACT FORM */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              <div className="mb-7">
                <h3 className="text-2xl font-bold">
                  Send us a message
                </h3>

                <p className="text-slate-400 mt-2">
                  We will receive your message through the NILETEE support
                  system.
                </p>
              </div>

              {success && (
                <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-green-300">
                  <div className="flex gap-3">
                    <span>✓</span>
                    <p>{success}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-300">
                  <div className="flex gap-3">
                    <span>⚠</span>

                    <div>
                      <p className="font-semibold">
                        Message could not be sent
                      </p>

                      <p className="text-sm mt-1 break-words">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* NAME + EMAIL */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full rounded-xl bg-[#0b1728] border border-white/10 px-4 py-3.5 text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl bg-[#0b1728] border border-white/10 px-4 py-3.5 text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* PHONE */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="w-full rounded-xl bg-[#0b1728] border border-white/10 px-4 py-3.5 text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition"
                  />
                </div>

                {/* SUBJECT */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Subject
                  </label>

                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl bg-[#0b1728] border border-white/10 px-4 py-3.5 text-white outline-none focus:border-blue-500 transition"
                  >
                    <option>General Inquiry</option>
                    <option>Request Assistance</option>
                    <option>Order Assistance</option>
                    <option>Payment Assistance</option>
                    <option>Delivery Assistance</option>
                    <option>Complaint</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* MESSAGE */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Message
                  </label>

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how we can help..."
                    rows={7}
                    className="w-full rounded-xl bg-[#0b1728] border border-white/10 px-4 py-3.5 text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition resize-none"
                  />
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-400 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed py-4 font-bold text-white shadow-lg shadow-blue-500/20 transition"
                >
                  {sending ? "Sending Message..." : "Send Message →"}
                </button>
              </form>

              <p className="text-xs text-slate-500 text-center mt-5">
                Your message is securely connected to your NILETEE account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} NILETEE. All rights reserved.
            </p>

            <div className="flex flex-wrap justify-center gap-5 text-sm">
              <Link
                href="/"
                className="text-slate-400 hover:text-white transition"
              >
                Home
              </Link>

              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-white transition"
              >
                Dashboard
              </Link>

              <Link
                href="/requests"
                className="text-slate-400 hover:text-white transition"
              >
                Requests
              </Link>

              <Link
                href="/orders"
                className="text-slate-400 hover:text-white transition"
              >
                Orders
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}