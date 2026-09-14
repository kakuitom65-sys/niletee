"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type OrderRow = {
  id: string;
  request_number: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  total_final_amount: number | null;
  created_at: string;
};

const statusOptions = [
  "all",
  "pending",
  "approved",
  "purchased",
  "shipping",
  "delivered",
  "completed",
  "cancelled",
];

function getStatusStyle(status: string | null) {
  switch (status) {
    case "approved":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";

    case "purchased":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";

    case "shipping":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";

    case "delivered":
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";

    case "completed":
      return "bg-green-500/10 text-green-400 border-green-500/20";

    case "cancelled":
      return "bg-red-500/10 text-red-400 border-red-500/20";

    default:
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  }
}

function formatStatus(status: string | null) {
  if (!status) return "Pending";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [userName, setUserName] = useState("Customer");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Get customer's profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const name =
        profile?.full_name ||
        profile?.name ||
        user.email?.split("@")[0] ||
        "Customer";

      setUserName(name);

      // Get only this customer's orders
      const { data, error } = await supabase
        .from("requests")
        .select(`
          id,
          request_number,
          title,
          description,
          status,
          total_final_amount,
          created_at
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading orders:", error);
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        selectedStatus === "all" ||
        (order.status || "pending") === selectedStatus;

      const matchesSearch =
        !searchText ||
        (order.request_number || "").toLowerCase().includes(searchText) ||
        (order.title || "").toLowerCase().includes(searchText) ||
        (order.description || "").toLowerCase().includes(searchText) ||
        (order.status || "").toLowerCase().includes(searchText);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, selectedStatus]);

  const totalOrders = orders.length;

  const activeOrders = orders.filter(
    (order) =>
      !["completed", "cancelled"].includes(order.status || "pending")
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "completed"
  ).length;

  const totalValue = orders.reduce(
    (sum, order) => sum + Number(order.total_final_amount || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between gap-4">
            
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="font-black text-lg">N</span>
              </div>

              <div className="hidden sm:block">
                <h1 className="font-black text-lg tracking-wide">
                  NILETEE
                </h1>
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  Customer Portal
                </p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                Dashboard
              </Link>

              <Link
                href="/orders"
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"
              >
                My Orders
              </Link>

              <Link
                href="/requests"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                New Request
              </Link>
            </nav>

            {/* User */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold">{userName}</p>
                <p className="text-xs text-slate-500">Customer</p>
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center font-black">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page heading */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition mb-4"
            >
              ← Back to Dashboard
            </Link>

            <p className="text-sm text-blue-400 font-semibold uppercase tracking-widest mb-2">
              Order Center
            </p>

            <h2 className="text-3xl sm:text-4xl font-black">
              My Orders
            </h2>

            <p className="text-slate-400 mt-2 max-w-2xl">
              View, search and track all your NILETEE requests in one place.
            </p>
          </div>

          <Link
            href="/requests"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-green-500 px-5 py-3 font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition"
          >
            <span className="text-lg">+</span>
            New Request
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total Orders
            </p>
            <p className="text-3xl font-black mt-2">
              {totalOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Active Orders
            </p>
            <p className="text-3xl font-black mt-2 text-blue-400">
              {activeOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Completed
            </p>
            <p className="text-3xl font-black mt-2 text-green-400">
              {completedOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total Value
            </p>
            <p className="text-2xl font-black mt-2 text-white">
              KSh {totalValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order number, title or status..."
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/50"
              />
            </div>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "all"
                    ? "All Statuses"
                    : formatStatus(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-black">All Orders</h3>
              <p className="text-sm text-slate-500 mt-1">
                {filteredOrders.length} order
                {filteredOrders.length !== 1 ? "s" : ""} shown
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
              <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">
                Loading your orders...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 sm:p-14 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">📦</span>
              </div>

              <h3 className="text-xl font-black">
                {orders.length === 0
                  ? "You have no orders yet"
                  : "No matching orders"}
              </h3>

              <p className="text-slate-400 max-w-md mx-auto mt-2">
                {orders.length === 0
                  ? "Once you submit a request, it will appear here so you can follow its progress."
                  : "Try changing your search or status filter."}
              </p>

              {orders.length === 0 && (
                <Link
                  href="/requests"
                  className="inline-flex items-center gap-2 mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-green-500 px-5 py-3 font-bold"
                >
                  Create Your First Request →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 hover:bg-white/[0.05] hover:border-blue-500/20 transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                    
                    {/* Order icon */}
                    <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-green-500/20 border border-white/10 items-center justify-center text-2xl shrink-0">
                      📦
                    </div>

                    {/* Main information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-400">
                          {order.request_number || "Order"}
                        </span>

                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(
                            order.status
                          )}`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </div>

                      <h4 className="text-lg font-black truncate">
                        {order.title || "NILETEE Request"}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-xs text-slate-500">
                        <span>
                          📅 {formatDate(order.created_at)}
                        </span>

                        {order.total_final_amount !== null && (
                          <span className="font-semibold text-slate-300">
                            KSh{" "}
                            {Number(
                              order.total_final_amount
                            ).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="lg:w-auto w-full">
                      <Link
                        href={`/orders/${order.id}`}
                        className="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-5 py-3 text-sm font-bold text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition"
                      >
                        View & Track
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom information */}
        <div className="grid md:grid-cols-2 gap-5 mt-8">
          <div className="rounded-2xl border border-blue-500/10 bg-blue-500/[0.04] p-6">
            <div className="text-2xl mb-3">🔔</div>
            <h3 className="font-black mb-2">
              Stay Updated
            </h3>
            <p className="text-sm text-slate-400 leading-6">
              Your order status changes as NILETEE processes your request.
              Open an order to see its latest progress and any notes from
              our team.
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/10 bg-green-500/[0.04] p-6">
            <div className="text-2xl mb-3">💬</div>
            <h3 className="font-black mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-slate-400 leading-6">
              If you have a question about an order, open its details and
              use the support option to contact the NILETEE team.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>
              © {new Date().getFullYear()} NILETEE. All rights reserved.
            </p>

            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="hover:text-white transition"
              >
                Dashboard
              </Link>

              <Link
                href="/requests"
                className="hover:text-white transition"
              >
                New Request
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}