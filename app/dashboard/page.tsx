"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type RequestRow = {
  id: string;
  request_number: string | null;
  title: string | null;
  description?: string | null;
  status: string | null;
  total_final_amount: number | null;
  item_price?: number | null;
  shipping_fee?: number | null;
  service_fee?: number | null;
  delivery_fee?: number | null;
  delivery_location?: string | null;
  created_at: string;
};

const STATUS_ORDER = [
  "pending",
  "approved",
  "purchased",
  "shipping",
  "delivered",
  "completed",
];

const STATUS_META: Record<
  string,
  {
    label: string;
    icon: string;
    color: string;
    bg: string;
    description: string;
  }
> = {
  pending: {
    label: "Pending Review",
    icon: "⏳",
    color: "text-yellow-300",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    description: "NILETEE is reviewing your request.",
  },
  approved: {
    label: "Approved",
    icon: "✓",
    color: "text-blue-300",
    bg: "bg-blue-500/10 border-blue-500/20",
    description: "Your request has been approved.",
  },
  purchased: {
    label: "Purchased",
    icon: "🛍️",
    color: "text-purple-300",
    bg: "bg-purple-500/10 border-purple-500/20",
    description: "Your item has been purchased.",
  },
  shipping: {
    label: "Shipping",
    icon: "🚚",
    color: "text-orange-300",
    bg: "bg-orange-500/10 border-orange-500/20",
    description: "Your item is on its way.",
  },
  delivered: {
    label: "Delivered",
    icon: "📦",
    color: "text-green-300",
    bg: "bg-green-500/10 border-green-500/20",
    description: "Your item has been delivered.",
  },
  completed: {
    label: "Completed",
    icon: "🎉",
    color: "text-emerald-300",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    description: "Your NILETEE order is complete.",
  },
  cancelled: {
    label: "Cancelled",
    icon: "✕",
    color: "text-red-300",
    bg: "bg-red-500/10 border-red-500/20",
    description: "This request has been cancelled.",
  },
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userName, setUserName] = useState("Customer");
  const [userEmail, setUserEmail] = useState("");
  const [orders, setOrders] = useState<RequestRow[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<RequestRow | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setUserEmail(user.email || "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      setUserName(
        profile.full_name ||
          profile.name ||
          user.email?.split("@")[0] ||
          "Customer"
      );
    } else {
      setUserName(user.email?.split("@")[0] || "Customer");
    }

    const { data, error } = await supabase
      .from("requests")
      .select(
        `
        id,
        request_number,
        title,
        description,
        status,
        total_final_amount,
        item_price,
        shipping_fee,
        service_fee,
        delivery_fee,
        delivery_location,
        created_at
        `
      )
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Dashboard request error:", error);
      setOrders([]);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
    setRefreshing(false);
  }

  async function handleLogout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
      return;
    }

    router.replace("/login");
  }

  function formatMoney(amount: number | null | undefined) {
    return `KSh ${Number(amount || 0).toLocaleString()}`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatShortDate(date: string) {
    return new Date(date).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
    });
  }

  function statusLabel(status: string | null) {
    if (!status) return "Pending Review";

    return (
      STATUS_META[status]?.label ||
      status
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    );
  }

  function statusColor(status: string | null) {
    return (
      STATUS_META[status || "pending"]?.bg ||
      "bg-white/5 border-white/10"
    );
  }

  function statusTextColor(status: string | null) {
    return (
      STATUS_META[status || "pending"]?.color ||
      "text-slate-300"
    );
  }

  function statusIcon(status: string | null) {
    return STATUS_META[status || "pending"]?.icon || "⏳";
  }

  function getStatusIndex(status: string | null) {
    if (!status) return 0;

    const index = STATUS_ORDER.indexOf(status);

    return index === -1 ? 0 : index;
  }

  const stats = useMemo(() => {
    const total = orders.length;

    const pending = orders.filter(
      (order) => order.status === "pending"
    ).length;

    const active = orders.filter(
      (order) =>
        order.status === "approved" ||
        order.status === "purchased" ||
        order.status === "shipping"
    ).length;

    const completed = orders.filter(
      (order) =>
        order.status === "completed" ||
        order.status === "delivered"
    ).length;

    const cancelled = orders.filter(
      (order) => order.status === "cancelled"
    ).length;

    const totalValue = orders.reduce(
      (sum, order) =>
        sum + Number(order.total_final_amount || 0),
      0
    );

    return {
      total,
      pending,
      active,
      completed,
      cancelled,
      totalValue,
    };
  }, [orders]);

  const activeOrder = useMemo(() => {
    return (
      orders.find(
        (order) =>
          order.status === "shipping" ||
          order.status === "purchased"
      ) ||
      orders.find((order) => order.status === "approved") ||
      orders.find((order) => order.status === "pending") ||
      null
    );
  }, [orders]);

  const latestOrders = orders.slice(0, 6);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06111f] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative mx-auto mb-6 w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-spin" />
          </div>

          <h2 className="text-lg font-bold">
            Loading your NILETEE dashboard...
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Preparing your orders and account information.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06111f] text-white overflow-hidden">
      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-[35%] -right-40 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[25rem] h-[25rem] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06111f]/90 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-[76px] flex items-center justify-between gap-4 py-3">
            {/* LOGO */}
            <Link
              href="/dashboard"
              className="flex items-center gap-3 shrink-0"
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white shadow-lg shadow-blue-500/10 flex items-center justify-center">
                <img
                  src="/logo.jpeg"
                  alt="NILETEE"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="hidden sm:block">
                <h1 className="text-xl font-black tracking-wide">
                  NILETEE
                </h1>

                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Customer Portal
                </p>
              </div>
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition"
              >
                🏠 Home
              </Link>

              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-xl bg-blue-500/10 text-blue-300 text-sm font-semibold"
              >
                📊 Dashboard
              </Link>

              <Link
                href="/requests"
                className="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition"
              >
                🛒 Make Request
              </Link>

              <Link
                href="/orders"
                className="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition"
              >
                📦 My Orders
              </Link>

              <Link
                href="/contact"
                className="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition"
              >
                📩 Contact
              </Link>
            </nav>

            {/* ACCOUNT */}
            <div className="flex items-center gap-3">
              <div className="hidden xl:block text-right">
                <p className="text-sm font-semibold">
                  {userName}
                </p>

                <p className="text-xs text-slate-500">
                  {userEmail || "Customer"}
                </p>
              </div>

              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-black shadow-lg shadow-blue-500/20">
                {userName.charAt(0).toUpperCase()}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10 transition disabled:opacity-50"
              >
                🚪
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>

          {/* MOBILE NAV */}
          <div className="flex lg:hidden overflow-x-auto gap-2 pb-3">
            <Link
              href="/"
              className="whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300"
            >
              🏠 Home
            </Link>

            <Link
              href="/dashboard"
              className="whitespace-nowrap rounded-xl bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-300"
            >
              📊 Dashboard
            </Link>

            <Link
              href="/requests"
              className="whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300"
            >
              🛒 Request
            </Link>

            <Link
              href="/orders"
              className="whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300"
            >
              📦 Orders
            </Link>

            <Link
              href="/contact"
              className="whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300"
            >
              📩 Contact
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="whitespace-nowrap rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-300"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-600/20 via-[#0a1729] to-cyan-500/10 p-6 sm:p-8 lg:p-10">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

          <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold mb-5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                YOUR NILETEE ACCOUNT
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  {userName}
                </span>{" "}
                👋
              </h2>

              <p className="mt-4 text-slate-300 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed">
                Everything you need to request, track and manage
                your NILETEE orders is right here.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-7">
                <Link
                  href="/requests"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold shadow-xl shadow-blue-600/20 transition"
                >
                  ＋ Make a New Request
                </Link>

                <Link
                  href="/orders"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold transition"
                >
                  📦 View My Orders
                </Link>

                <button
                  type="button"
                  onClick={() => loadDashboard(true)}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/20 text-cyan-300 font-semibold transition disabled:opacity-50"
                >
                  {refreshing ? "↻ Refreshing..." : "↻ Refresh"}
                </button>
              </div>
            </div>

            {/* HERO SUMMARY */}
            <div className="lg:w-[280px] rounded-3xl border border-white/10 bg-black/10 backdrop-blur-xl p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-bold">
                Account Overview
              </p>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Total requests
                  </p>

                  <p className="text-4xl font-black mt-1">
                    {stats.total}
                  </p>
                </div>

                <span className="text-3xl">📦</span>
              </div>

              <div className="h-px bg-white/10 my-5" />

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  Active
                </span>

                <span className="font-bold text-blue-300">
                  {stats.active}
                </span>
              </div>

              <div className="flex justify-between text-sm mt-3">
                <span className="text-slate-500">
                  Completed
                </span>

                <span className="font-bold text-emerald-300">
                  {stats.completed}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= QUICK ACTIONS ================= */}
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">
              Quick Access
            </p>

            <h3 className="text-2xl font-black mt-1">
              What would you like to do?
            </h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link
              href="/requests"
              className="group rounded-2xl border border-white/10 bg-white/[0.035] hover:bg-blue-500/10 hover:border-blue-500/30 p-5 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition">
                🛒
              </div>

              <h4 className="font-bold">
                Make Request
              </h4>

              <p className="text-xs text-slate-500 mt-1">
                Tell us what you need
              </p>
            </Link>

            <Link
              href="/orders"
              className="group rounded-2xl border border-white/10 bg-white/[0.035] hover:bg-purple-500/10 hover:border-purple-500/30 p-5 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition">
                📦
              </div>

              <h4 className="font-bold">
                My Orders
              </h4>

              <p className="text-xs text-slate-500 mt-1">
                Track your requests
              </p>
            </Link>

            <Link
              href="/contact"
              className="group rounded-2xl border border-white/10 bg-white/[0.035] hover:bg-cyan-500/10 hover:border-cyan-500/30 p-5 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition">
                📩
              </div>

              <h4 className="font-bold">
                Contact Us
              </h4>

              <p className="text-xs text-slate-500 mt-1">
                Get help from NILETEE
              </p>
            </Link>

            <Link
              href="/profile"
              className="group rounded-2xl border border-white/10 bg-white/[0.035] hover:bg-green-500/10 hover:border-green-500/30 p-5 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition">
                👤
              </div>

              <h4 className="font-bold">
                My Profile
              </h4>

              <p className="text-xs text-slate-500 mt-1">
                Manage your account
              </p>
            </Link>
          </div>
        </section>

        {/* ================= STATS ================= */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Total Orders
                </p>

                <p className="text-3xl font-black mt-2">
                  {stats.total}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl">
                📦
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              All submitted requests
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Pending
                </p>

                <p className="text-3xl font-black mt-2 text-yellow-400">
                  {stats.pending}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center text-xl">
                ⏳
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              Awaiting review
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Active
                </p>

                <p className="text-3xl font-black mt-2 text-cyan-400">
                  {stats.active}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xl">
                🚚
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              Currently being processed
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Completed
                </p>

                <p className="text-3xl font-black mt-2 text-green-400">
                  {stats.completed}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center text-xl">
                🎉
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              Successfully completed
            </p>
          </div>
        </section>

        {/* ================= ACTIVE ORDER ================= */}
        {activeOrder && (
          <section className="mt-8">
            <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-white/[0.025] to-cyan-500/5 p-5 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />

                    <p className="text-xs uppercase tracking-[0.16em] text-blue-300 font-bold">
                      Current Order
                    </p>
                  </div>

                  <h3 className="text-2xl font-black mt-2">
                    {activeOrder.title || "Your NILETEE request"}
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    {activeOrder.request_number || "NILETEE ORDER"} •{" "}
                    {formatShortDate(activeOrder.created_at)}
                  </p>
                </div>

                <Link
                  href={`/orders/${activeOrder.id}`}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-sm font-bold transition"
                >
                  Track Order →
                </Link>
              </div>

              <div className="mt-8 overflow-x-auto pb-2">
                <div className="min-w-[700px]">
                  <div className="flex items-start">
                    {STATUS_ORDER.map((status, index) => {
                      const currentIndex = getStatusIndex(
                        activeOrder.status
                      );

                      const completed = index <= currentIndex;

                      return (
                        <div
                          key={status}
                          className="flex-1 relative"
                        >
                          {index < STATUS_ORDER.length - 1 && (
                            <div
                              className={`absolute top-5 left-1/2 right-0 h-0.5 ${
                                index < currentIndex
                                  ? "bg-blue-500"
                                  : "bg-white/10"
                              }`}
                            />
                          )}

                          <div className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                                completed
                                  ? "bg-blue-500/20 border-blue-400/40 text-blue-300"
                                  : "bg-white/5 border-white/10 text-slate-600"
                              }`}
                            >
                              {completed ? "✓" : index + 1}
                            </div>

                            <p
                              className={`text-xs font-bold mt-3 ${
                                completed
                                  ? "text-white"
                                  : "text-slate-600"
                              }`}
                            >
                              {STATUS_META[status].label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-black/10 border border-white/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {statusIcon(activeOrder.status)}
                  </div>

                  <div>
                    <p
                      className={`font-bold ${statusTextColor(
                        activeOrder.status
                      )}`}
                    >
                      {statusLabel(activeOrder.status)}
                    </p>

                    <p className="text-sm text-slate-400 mt-1">
                      {STATUS_META[
                        activeOrder.status || "pending"
                      ]?.description ||
                        "Your order is being processed by NILETEE."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= MAIN CONTENT ================= */}
        <section className="grid lg:grid-cols-[1fr_330px] gap-6 mt-8">
          {/* ORDERS */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
              <div>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">
                  Order Management
                </p>

                <h3 className="text-2xl font-black mt-1">
                  Recent Orders
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  View and track your latest NILETEE requests.
                </p>
              </div>

              <Link
                href="/orders"
                className="text-sm font-bold text-blue-400 hover:text-blue-300 transition"
              >
                View All Orders →
              </Link>
            </div>

            {latestOrders.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-10 sm:p-14 text-center">
                <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center text-4xl mx-auto mb-5">
                  📦
                </div>

                <h4 className="text-xl sm:text-2xl font-bold">
                  No orders yet
                </h4>

                <p className="text-slate-400 max-w-md mx-auto mt-2 text-sm leading-relaxed">
                  Your requests will appear here once you submit
                  them. Start by telling NILETEE what you need.
                </p>

                <Link
                  href="/requests"
                  className="inline-flex mt-6 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold transition"
                >
                  Make Your First Request
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {latestOrders.map((order) => (
                  <div
                    key={order.id}
                    className="group rounded-2xl border border-white/10 bg-white/[0.035] hover:bg-white/[0.055] hover:border-blue-500/30 p-5 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                      <div className="flex items-start gap-4">
                        <div className="hidden sm:flex w-12 h-12 rounded-xl bg-blue-500/10 items-center justify-center text-xl shrink-0">
                          {statusIcon(order.status)}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-blue-400 font-bold">
                            {order.request_number ||
                              "NILETEE ORDER"}
                          </p>

                          <h4 className="font-bold text-lg mt-1 truncate">
                            {order.title || "Untitled Request"}
                          </h4>

                          <p className="text-xs text-slate-500 mt-1">
                            Submitted {formatDate(order.created_at)}
                          </p>

                          {order.delivery_location && (
                            <p className="text-xs text-slate-500 mt-2 truncate max-w-md">
                              📍 {order.delivery_location}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div>
                          <p className="text-[11px] text-slate-500 uppercase tracking-wide">
                            Total
                          </p>

                          <p className="font-black mt-1">
                            {formatMoney(
                              order.total_final_amount
                            )}
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap ${statusColor(
                            order.status
                          )} ${statusTextColor(order.status)}`}
                        >
                          {statusLabel(order.status)}
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition"
                          title="Quick view"
                        >
                          👁
                        </button>

                        <Link
                          href={`/orders/${order.id}`}
                          className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition"
                          title="View order"
                        >
                          →
                        </Link>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center gap-3">
                      <span className="text-xs text-slate-500">
                        Status:
                      </span>

                      <span
                        className={`text-xs font-bold ${statusTextColor(
                          order.status
                        )}`}
                      >
                        {statusIcon(order.status)}{" "}
                        {statusLabel(order.status)}
                      </span>

                      {order.delivery_fee ? (
                        <span className="text-xs text-slate-500">
                          • Delivery {formatMoney(order.delivery_fee)}
                        </span>
                      ) : null}

                      {order.service_fee ? (
                        <span className="text-xs text-slate-500">
                          • Service {formatMoney(order.service_fee)}
                        </span>
                      ) : null}
                    </div>

                    <Link
                      href={`/orders/${order.id}`}
                      className="sm:hidden mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-blue-500/10 border border-white/10 py-3 text-sm font-bold text-blue-400 transition"
                    >
                      View Order →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SIDE PANEL */}
          <aside className="space-y-5">
            {/* ACCOUNT SUMMARY */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-xs text-blue-400 uppercase tracking-wider font-bold">
                Account Summary
              </p>

              <h3 className="text-lg font-bold mt-1">
                Your NILETEE activity
              </h3>

              <div className="space-y-4 mt-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Total requests
                  </span>

                  <span className="font-bold">
                    {stats.total}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Active
                  </span>

                  <span className="font-bold text-blue-300">
                    {stats.active}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Completed
                  </span>

                  <span className="font-bold text-emerald-300">
                    {stats.completed}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Cancelled
                  </span>

                  <span className="font-bold text-red-300">
                    {stats.cancelled}
                  </span>
                </div>
              </div>
            </div>

            {/* UPDATES */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                    Updates
                  </p>

                  <h3 className="text-lg font-bold mt-1">
                    Notifications
                  </h3>
                </div>

                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  🔔
                </div>
              </div>

              <div className="space-y-4">
                {activeOrder ? (
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-sm shrink-0">
                      {statusIcon(activeOrder.status)}
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        Order update
                      </p>

                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Your order{" "}
                        {activeOrder.request_number ||
                          ""} is currently{" "}
                        {statusLabel(activeOrder.status).toLowerCase()}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-sm shrink-0">
                      ✓
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        You're all caught up
                      </p>

                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        New order updates will appear here.
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-t border-white/5" />

                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center text-sm shrink-0">
                    📦
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Need something?
                    </p>

                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      You can submit another request anytime.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* HELP */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/15 to-cyan-500/5 p-5">
              <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center text-xl mb-4">
                💬
              </div>

              <h3 className="font-bold text-lg">
                Need help?
              </h3>

              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Have a question about your request, payment or
                delivery? Our team is here to help.
              </p>

              <Link
                href="/contact"
                className="w-full mt-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-bold transition flex items-center justify-center"
              >
                📩 Contact NILETEE
              </Link>
            </div>

            {/* PROFILE */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                Your Account
              </p>

              <h3 className="font-bold mt-2">
                Manage your account
              </h3>

              <p className="text-sm text-slate-400 mt-2">
                Update your profile and account information.
              </p>

              <Link
                href="/profile"
                className="inline-flex mt-4 text-sm font-bold text-blue-400 hover:text-blue-300"
              >
                View Profile →
              </Link>
            </div>

            {/* REQUEST CTA */}
            <div className="rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-500/10 to-blue-500/5 p-5">
              <div className="text-2xl mb-3">
                🛍️
              </div>

              <h3 className="font-bold">
                Need something sourced?
              </h3>

              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Describe what you need and let NILETEE handle the
                sourcing for you.
              </p>

              <Link
                href="/requests"
                className="inline-flex mt-4 text-sm font-bold text-emerald-300 hover:text-emerald-200"
              >
                Start a request →
              </Link>
            </div>
          </aside>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="border-t border-white/10 mt-12 pt-6 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-xs text-slate-600">
                © {new Date().getFullYear()} NILETEE. All rights reserved.
              </p>

              <p className="text-xs text-slate-700 mt-1">
                Your trusted request & sourcing platform.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <Link
                href="/"
                className="text-slate-500 hover:text-white transition"
              >
                Home
              </Link>

              <Link
                href="/requests"
                className="text-slate-500 hover:text-white transition"
              >
                Make Request
              </Link>

              <Link
                href="/orders"
                className="text-slate-500 hover:text-white transition"
              >
                My Orders
              </Link>

              <Link
                href="/profile"
                className="text-slate-500 hover:text-white transition"
              >
                Profile
              </Link>

              <Link
                href="/contact"
                className="text-slate-500 hover:text-white transition"
              >
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </div>

      {/* ================= QUICK ORDER MODAL ================= */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a1729] shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                  Order Details
                </p>

                <h3 className="text-xl font-black mt-1">
                  {selectedOrder.title ||
                    "NILETEE Request"}
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  {selectedOrder.request_number ||
                    "NILETEE ORDER"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Status
                </span>

                <span
                  className={`px-3 py-1.5 rounded-full border text-xs font-bold ${statusColor(
                    selectedOrder.status
                  )} ${statusTextColor(
                    selectedOrder.status
                  )}`}
                >
                  {statusIcon(selectedOrder.status)}{" "}
                  {statusLabel(selectedOrder.status)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Submitted
                </span>

                <span className="text-sm font-semibold">
                  {formatDate(selectedOrder.created_at)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Total
                </span>

                <span className="text-lg font-black">
                  {formatMoney(
                    selectedOrder.total_final_amount
                  )}
                </span>
              </div>

              {selectedOrder.delivery_location && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">
                    Delivery Location
                  </p>

                  <p className="text-sm text-slate-300 mt-2">
                    📍 {selectedOrder.delivery_location}
                  </p>
                </div>
              )}

              {selectedOrder.description && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">
                    Request Description
                  </p>

                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    {selectedOrder.description}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Link
                  href={`/orders/${selectedOrder.id}`}
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-bold transition"
                >
                  Open Full Order
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}