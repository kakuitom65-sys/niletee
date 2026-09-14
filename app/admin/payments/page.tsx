"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type Payment = {
  id: string;
  request_id: string;
  customer_id: string;
  payment_type: "purchase" | "shipping" | "delivery" | "service" | "other";
  amount: number;
  payment_method: string | null;
  transaction_reference: string | null;
  status: "pending" | "paid" | "failed" | "refunded" | "cancelled";
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

const paymentTypes = [
  "purchase",
  "shipping",
  "delivery",
  "service",
  "other",
] as const;

const paymentStatuses = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "cancelled",
] as const;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [form, setForm] = useState({
    request_id: "",
    customer_id: "",
    payment_type: "purchase",
    amount: "",
    payment_method: "",
    transaction_reference: "",
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    initializePage();
  }, []);

  async function initializePage() {
    try {
      setLoading(true);
      setMessage("");

      /*
       * Use getSession() instead of immediately relying on getUser().
       * This is more reliable when the page is opened directly.
       */
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      console.log("PAYMENTS SESSION:", session);
      console.log("SESSION ERROR:", sessionError);

      if (sessionError) {
        console.error("Session error:", sessionError);
        setMessage("Unable to verify your login session.");
        setLoading(false);
        return;
      }

      if (!session?.user) {
        window.location.href = "/admin/login";
        return;
      }

      const userId = session.user.id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      console.log("PAYMENTS PROFILE:", profile);
      console.log("PROFILE ERROR:", profileError);

      if (profileError) {
        console.error("Profile error:", profileError);

        setMessage(
          "Could not verify administrator access: " +
            profileError.message
        );

        setLoading(false);
        return;
      }

      if (!profile || profile.role !== "admin") {
        setMessage(
          "This account does not have administrator access."
        );
        setLoading(false);
        return;
      }

      await loadPayments();
    } catch (error) {
      console.error("INITIALIZATION ERROR:", error);

      setMessage(
        "Something went wrong while loading the payments page."
      );

      setLoading(false);
    }
  }

  async function loadPayments() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("LOAD PAYMENTS ERROR:", error);

        setMessage(
          "Could not load payments: " + error.message
        );

        setLoading(false);
        return;
      }

      setPayments((data || []) as Payment[]);
      setLoading(false);
    } catch (error) {
      console.error("PAYMENTS LOAD ERROR:", error);

      setMessage("Failed to load payments.");
      setLoading(false);
    }
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      if (!form.request_id.trim()) {
        setMessage("Request ID is required.");
        setSaving(false);
        return;
      }

      if (!form.customer_id.trim()) {
        setMessage("Customer ID is required.");
        setSaving(false);
        return;
      }

      if (!form.amount || Number(form.amount) <= 0) {
        setMessage("Enter a valid payment amount.");
        setSaving(false);
        return;
      }

      const { data: sessionData } =
        await supabase.auth.getSession();

      if (!sessionData.session?.user) {
        setMessage("Your session has expired. Please log in again.");
        setSaving(false);
        return;
      }

      const paymentData = {
        request_id: form.request_id.trim(),
        customer_id: form.customer_id.trim(),
        payment_type: form.payment_type,
        amount: Number(form.amount),
        payment_method:
          form.payment_method.trim() || null,
        transaction_reference:
          form.transaction_reference.trim() || null,
        status: form.status,
        notes: form.notes.trim() || null,
        paid_at:
          form.status === "paid"
            ? new Date().toISOString()
            : null,
      };

      const { error } = await supabase
        .from("payments")
        .insert(paymentData);

      if (error) {
        console.error("ADD PAYMENT ERROR:", error);

        setMessage(
          "Could not add payment: " + error.message
        );

        setSaving(false);
        return;
      }

      setForm({
        request_id: "",
        customer_id: "",
        payment_type: "purchase",
        amount: "",
        payment_method: "",
        transaction_reference: "",
        status: "pending",
        notes: "",
      });

      setMessage("Payment added successfully.");

      await loadPayments();
    } catch (error) {
      console.error("ADD PAYMENT EXCEPTION:", error);
      setMessage("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  async function updatePaymentStatus(
    id: string,
    status: Payment["status"]
  ) {
    try {
      setMessage("");

      const updateData: {
        status: Payment["status"];
        paid_at?: string | null;
        updated_at: string;
      } = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "paid") {
        updateData.paid_at = new Date().toISOString();
      }

      if (status !== "paid") {
        updateData.paid_at = null;
      }

      const { error } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", id);

      if (error) {
        console.error("UPDATE PAYMENT ERROR:", error);

        setMessage(
          "Could not update payment: " + error.message
        );

        return;
      }

      setPayments((current) =>
        current.map((payment) =>
          payment.id === id
            ? {
                ...payment,
                status,
                paid_at:
                  status === "paid"
                    ? new Date().toISOString()
                    : null,
                updated_at:
                  new Date().toISOString(),
              }
            : payment
        )
      );

      setMessage("Payment status updated.");
    } catch (error) {
      console.error("UPDATE PAYMENT EXCEPTION:", error);
      setMessage("Failed to update payment.");
    }
  }

  async function deletePayment(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payment?"
    );

    if (!confirmed) return;

    try {
      setMessage("");

      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("DELETE PAYMENT ERROR:", error);

        setMessage(
          "Could not delete payment: " + error.message
        );

        return;
      }

      setPayments((current) =>
        current.filter((payment) => payment.id !== id)
      );

      setMessage("Payment deleted successfully.");
    } catch (error) {
      console.error("DELETE PAYMENT EXCEPTION:", error);
      setMessage("Failed to delete payment.");
    }
  }

  const filteredPayments = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return payments.filter((payment) => {
      const matchesSearch =
        !searchValue ||
        payment.id.toLowerCase().includes(searchValue) ||
        payment.request_id
          .toLowerCase()
          .includes(searchValue) ||
        payment.customer_id
          .toLowerCase()
          .includes(searchValue) ||
        (payment.transaction_reference || "")
          .toLowerCase()
          .includes(searchValue) ||
        (payment.payment_method || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        payment.status === statusFilter;

      const matchesType =
        typeFilter === "all" ||
        payment.payment_type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    payments,
    search,
    statusFilter,
    typeFilter,
  ]);

  const totalAmount = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const paidAmount = payments
    .filter((payment) => payment.status === "paid")
    .reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

  const pendingAmount = payments
    .filter((payment) => payment.status === "pending")
    .reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

  const failedAmount = payments
    .filter((payment) => payment.status === "failed")
    .reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

  function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(date: string | null) {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function statusClass(status: Payment["status"]) {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "failed":
        return "bg-red-100 text-red-700";

      case "refunded":
        return "bg-purple-100 text-purple-700";

      case "cancelled":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <h2 className="text-xl font-semibold">
            Loading Payments
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Verifying administrator access...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* TOP NAVIGATION */}
      <header className="border-b border-slate-800 bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <Link
              href="/admin"
              className="text-2xl font-black tracking-wide text-blue-400"
            >
              NILETEE
            </Link>

            <p className="text-xs text-slate-400">
              Administration Panel
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
            >
              Dashboard
            </Link>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/admin/login";
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold transition hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* PAGE */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* TITLE */}
        <div className="mb-8">
          <h1 className="text-3xl font-black">
            Payments Management
          </h1>

          <p className="mt-2 text-slate-400">
            Manage purchase, shipping, delivery and service
            payments for NILETEE orders.
          </p>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-4 text-sm text-blue-200">
            {message}
          </div>
        )}

        {/* STATS */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total Payments
            </p>

            <p className="mt-2 text-3xl font-black">
              {payments.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {formatMoney(totalAmount)}
            </p>
          </div>

          <div className="rounded-2xl border border-green-900/50 bg-green-950/30 p-5">
            <p className="text-sm text-green-300">
              Paid
            </p>

            <p className="mt-2 text-3xl font-black text-green-400">
              {formatMoney(paidAmount)}
            </p>

            <p className="mt-1 text-xs text-green-500/70">
              Successfully collected
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-900/50 bg-yellow-950/30 p-5">
            <p className="text-sm text-yellow-300">
              Pending
            </p>

            <p className="mt-2 text-3xl font-black text-yellow-400">
              {formatMoney(pendingAmount)}
            </p>

            <p className="mt-1 text-xs text-yellow-500/70">
              Awaiting payment
            </p>
          </div>

          <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-5">
            <p className="text-sm text-red-300">
              Failed
            </p>

            <p className="mt-2 text-3xl font-black text-red-400">
              {formatMoney(failedAmount)}
            </p>

            <p className="mt-1 text-xs text-red-500/70">
              Failed transactions
            </p>
          </div>
        </section>

        {/* ADD PAYMENT */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              Add Payment
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Record a payment received from a customer.
            </p>
          </div>

          <form
            onSubmit={addPayment}
            className="grid gap-5 md:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Request ID
              </label>

              <input
                value={form.request_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    request_id: e.target.value,
                  })
                }
                placeholder="Enter request UUID"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Customer ID
              </label>

              <input
                value={form.customer_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customer_id: e.target.value,
                  })
                }
                placeholder="Enter customer UUID"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Payment Type
              </label>

              <select
                value={form.payment_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    payment_type: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {paymentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() +
                      type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Amount (KES)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount: e.target.value,
                  })
                }
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Payment Method
              </label>

              <input
                value={form.payment_method}
                onChange={(e) =>
                  setForm({
                    ...form,
                    payment_method: e.target.value,
                  })
                }
                placeholder="M-Pesa, Bank, Cash..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Transaction Reference
              </label>

              <input
                value={form.transaction_reference}
                onChange={(e) =>
                  setForm({
                    ...form,
                    transaction_reference: e.target.value,
                  })
                }
                placeholder="e.g. MPESA123456"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Status
              </label>

              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {paymentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Notes
              </label>

              <input
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes: e.target.value,
                  })
                }
                placeholder="Optional notes"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Add Payment"}
              </button>
            </div>
          </form>
        </section>

        {/* FILTERS */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search payment, request, customer or reference..."
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">
                All Payment Statuses
              </option>

              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() +
                    status.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">
                All Payment Types
              </option>

              {paymentTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() +
                    type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* PAYMENTS TABLE */}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold">
                Payment Records
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Showing {filteredPayments.length} of{" "}
                {payments.length} payments
              </p>
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-5xl">💳</div>

              <h3 className="mt-4 text-lg font-bold">
                No payments found
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Payment records will appear here once
                they are added.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-950">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Payment
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Request
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Type
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Amount
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Method
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Date
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-slate-800/50"
                    >
                      <td className="px-5 py-5">
                        <div className="max-w-[180px]">
                          <p className="truncate text-sm font-semibold">
                            {payment.id}
                          </p>

                          {payment.transaction_reference && (
                            <p className="mt-1 truncate text-xs text-slate-500">
                              Ref:{" "}
                              {
                                payment.transaction_reference
                              }
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <p className="max-w-[180px] truncate text-sm text-blue-300">
                          {payment.request_id}
                        </p>

                        <p className="mt-1 max-w-[180px] truncate text-xs text-slate-500">
                          Customer:{" "}
                          {payment.customer_id}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <span className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium capitalize text-slate-200">
                          {payment.payment_type}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-bold">
                          {formatMoney(
                            Number(payment.amount)
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-5 text-sm text-slate-300">
                        {payment.payment_method ||
                          "—"}
                      </td>

                      <td className="px-5 py-5">
                        <select
                          value={payment.status}
                          onChange={(e) =>
                            updatePaymentStatus(
                              payment.id,
                              e.target
                                .value as Payment["status"]
                            )
                          }
                          className={`rounded-lg border-0 px-3 py-2 text-xs font-semibold capitalize outline-none ${statusClass(
                            payment.status
                          )}`}
                        >
                          {paymentStatuses.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                                className="bg-slate-900 text-white"
                              >
                                {status}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-400">
                        {formatDate(
                          payment.created_at
                        )}
                      </td>

                      <td className="px-5 py-5 text-right">
                        <button
                          onClick={() =>
                            deletePayment(
                              payment.id
                            )
                          }
                          className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-900/40"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}