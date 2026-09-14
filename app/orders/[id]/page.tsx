"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Order = {
  id: string;
  customer_id: string;
  request_number: string | null;
  title: string | null;
  description: string | null;
  product_link: string | null;
  photo_url: string | null;
  size: string | null;
  color: string | null;
  model: string | null;
  quantity: number | null;
  budget: number | null;
  delivery_location: string | null;
  additional_instructions: string | null;
  status: string | null;
  item_price: number | null;
  shipping_fee: number | null;
  service_fee: number | null;
  delivery_fee: number | null;
  total_item_amount: number | null;
  total_final_amount: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
};

const trackingSteps = [
  {
    status: "pending",
    title: "Request Submitted",
    description: "Your request has been received by NILETEE.",
  },
  {
    status: "approved",
    title: "Request Approved",
    description: "NILETEE has reviewed and approved your request.",
  },
  {
    status: "purchased",
    title: "Purchased",
    description: "Your requested item has been purchased.",
  },
  {
    status: "shipping",
    title: "Shipping",
    description: "Your order is currently being shipped.",
  },
  {
    status: "delivered",
    title: "Delivered",
    description: "Your order has been delivered.",
  },
  {
    status: "completed",
    title: "Completed",
    description: "Your order has been completed successfully.",
  },
];

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * Next.js dynamic route:
         * /orders/[id]
         *
         * We safely convert the parameter to a string.
         */
        const rawId = params?.id;

        const orderId = Array.isArray(rawId)
          ? rawId[0]
          : rawId;

        if (!orderId) {
          setError("No order ID was provided.");
          setLoading(false);
          return;
        }

        // Check logged-in customer
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("User error:", userError);
          setError("Unable to verify your account.");
          setLoading(false);
          return;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        // Load only the order belonging to the logged-in customer
        const { data, error: orderError } = await supabase
          .from("requests")
          .select("*")
          .eq("id", orderId)
          .eq("customer_id", user.id)
          .maybeSingle();

        if (orderError) {
          console.error("Order loading error:", orderError);

          setError(
            `Unable to load this order. ${orderError.message}`
          );

          setLoading(false);
          return;
        }

        if (!data) {
          setError(
            "This order could not be found or does not belong to your account."
          );

          setLoading(false);
          return;
        }

        setOrder(data as Order);
      } catch (err) {
        console.error("Unexpected order error:", err);
        setError("Something went wrong while loading this order.");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [params, router]);

  function formatMoney(amount: number | null) {
    return `KSh ${Number(amount || 0).toLocaleString("en-KE")}`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function statusLabel(status: string | null) {
    if (!status) return "Pending";

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getStatusIndex(status: string | null) {
    if (!status) return 0;

    const index = trackingSteps.findIndex(
      (step) => step.status === status
    );

    return index === -1 ? 0 : index;
  }

  function statusColor(status: string | null) {
    switch (status) {
      case "approved":
        return "bg-blue-500/15 text-blue-300 border-blue-500/20";

      case "purchased":
        return "bg-purple-500/15 text-purple-300 border-purple-500/20";

      case "shipping":
        return "bg-orange-500/15 text-orange-300 border-orange-500/20";

      case "delivered":
        return "bg-green-500/15 text-green-300 border-green-500/20";

      case "completed":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";

      case "cancelled":
        return "bg-red-500/15 text-red-300 border-red-500/20";

      default:
        return "bg-yellow-500/15 text-yellow-300 border-yellow-500/20";
    }
  }

  /*
   * LOADING
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-[#07111f] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-5" />

          <p className="text-slate-300 font-medium">
            Loading your order...
          </p>

          <p className="text-xs text-slate-600 mt-2">
            Please wait a moment.
          </p>
        </div>
      </main>
    );
  }

  /*
   * ERROR
   */
  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#07111f] text-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">

          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl mx-auto mb-6">
            ⚠️
          </div>

          <p className="text-xs uppercase tracking-widest text-red-400 font-bold mb-2">
            Order Error
          </p>

          <h1 className="text-2xl sm:text-3xl font-black">
            Order unavailable
          </h1>

          <p className="text-slate-400 mt-3 leading-6">
            {error || "We could not find this order."}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7">

            <Link
              href="/orders"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold transition"
            >
              ← My Orders
            </Link>

            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold transition"
            >
              Dashboard
            </Link>

          </div>
        </div>
      </main>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <main className="min-h-screen bg-[#07111f] text-white">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="min-h-20 py-4 flex items-center justify-between gap-4">

            <Link
              href="/dashboard"
              className="flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">
                N
              </div>

              <div className="hidden sm:block">
                <h1 className="font-black tracking-wide">
                  NILETEE
                </h1>

                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">
                  Order Details
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">

              <Link
                href="/orders"
                className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-sm font-semibold transition"
              >
                ← My Orders
              </Link>

              <Link
                href="/dashboard"
                className="hidden sm:block px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition"
              >
                Dashboard
              </Link>

            </div>

          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* BREADCRUMB */}
        <div className="mb-5">

          <Link
            href="/orders"
            className="text-sm text-slate-500 hover:text-blue-400 transition"
          >
            My Orders
          </Link>

          <span className="text-slate-700 mx-2">
            /
          </span>

          <span className="text-sm text-slate-400">
            Order Details
          </span>

        </div>

        {/* ORDER HEADER */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/15 via-slate-900 to-cyan-500/5 p-6 sm:p-8 mb-6">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>

              <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">
                {order.request_number || "NILETEE ORDER"}
              </p>

              <h2 className="text-3xl sm:text-4xl font-black mt-2">
                {order.title || "Untitled Request"}
              </h2>

              <p className="text-slate-400 mt-2 text-sm">
                Submitted {formatDate(order.created_at)}
              </p>

            </div>

            <div>
              <span
                className={`inline-flex px-4 py-2 rounded-full border text-sm font-bold ${statusColor(
                  order.status
                )}`}
              >
                {statusLabel(order.status)}
              </span>
            </div>

          </div>

        </section>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">

          {/* LEFT */}
          <div className="space-y-6">

            {/* PRODUCT INFORMATION */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">

              <div className="flex items-center gap-3 mb-6">

                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  📦
                </div>

                <div>
                  <h3 className="font-bold text-lg">
                    Order Information
                  </h3>

                  <p className="text-xs text-slate-500">
                    Details of your request
                  </p>
                </div>

              </div>

              <div className="grid sm:grid-cols-2 gap-5">

                <div>
                  <p className="text-xs text-slate-500">
                    Product / Service
                  </p>

                  <p className="font-semibold mt-1">
                    {order.title || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Quantity
                  </p>

                  <p className="font-semibold mt-1">
                    {order.quantity || 1}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Size
                  </p>

                  <p className="font-semibold mt-1">
                    {order.size || "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Color
                  </p>

                  <p className="font-semibold mt-1">
                    {order.color || "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Model
                  </p>

                  <p className="font-semibold mt-1">
                    {order.model || "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Delivery Location
                  </p>

                  <p className="font-semibold mt-1">
                    {order.delivery_location || "Not specified"}
                  </p>
                </div>

              </div>

              {order.description && (
                <div className="mt-6 pt-6 border-t border-white/10">

                  <p className="text-xs text-slate-500 mb-2">
                    Description
                  </p>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {order.description}
                  </p>

                </div>
              )}

              {order.additional_instructions && (
                <div className="mt-5">

                  <p className="text-xs text-slate-500 mb-2">
                    Additional Instructions
                  </p>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {order.additional_instructions}
                  </p>

                </div>
              )}

              {order.product_link && (
                <div className="mt-5">

                  <p className="text-xs text-slate-500 mb-2">
                    Product Link
                  </p>

                  <a
                    href={order.product_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm break-all"
                  >
                    {order.product_link}
                  </a>

                </div>
              )}

            </section>

            {/* PRICING */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">

              <div className="flex items-center gap-3 mb-6">

                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  💰
                </div>

                <div>
                  <h3 className="font-bold text-lg">
                    Order Pricing
                  </h3>

                  <p className="text-xs text-slate-500">
                    Current quotation
                  </p>
                </div>

              </div>

              <div className="space-y-4">

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-400">
                    Item Price
                  </span>

                  <span className="font-semibold">
                    {formatMoney(order.item_price)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-400">
                    Shipping Fee
                  </span>

                  <span className="font-semibold">
                    {formatMoney(order.shipping_fee)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-400">
                    Service Fee
                  </span>

                  <span className="font-semibold">
                    {formatMoney(order.service_fee)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-400">
                    Delivery Fee
                  </span>

                  <span className="font-semibold">
                    {formatMoney(order.delivery_fee)}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-4 flex justify-between gap-4">

                  <span className="font-bold">
                    Total Amount
                  </span>

                  <span className="text-xl font-black text-blue-400">
                    {formatMoney(order.total_final_amount)}
                  </span>

                </div>

              </div>

            </section>

            {/* ADMIN NOTES */}
            {order.admin_notes && (
              <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">

                <div className="flex items-center gap-3 mb-4">

                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    💬
                  </div>

                  <div>
                    <h3 className="font-bold">
                      Message from NILETEE
                    </h3>

                    <p className="text-xs text-slate-500">
                      Information from our team
                    </p>
                  </div>

                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {order.admin_notes}
                </p>

              </section>
            )}

          </div>

          {/* RIGHT */}
          <aside>

            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-28">

              <div className="mb-7">

                <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                  Order Tracking
                </p>

                <h3 className="text-xl font-black mt-1">
                  Your Order Progress
                </h3>

              </div>

              {order.status === "cancelled" ? (

                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-center">

                  <div className="text-3xl mb-3">
                    ⚠️
                  </div>

                  <h4 className="font-bold text-red-300">
                    Order Cancelled
                  </h4>

                  <p className="text-xs text-slate-400 mt-2">
                    This order is no longer being processed.
                  </p>

                </div>

              ) : (

                <div className="relative">

                  <div className="absolute left-[19px] top-5 bottom-5 w-px bg-white/10" />

                  <div className="space-y-7">

                    {trackingSteps.map((step, index) => {

                      const completed =
                        index < currentStatusIndex;

                      const current =
                        index === currentStatusIndex;

                      return (
                        <div
                          key={step.status}
                          className="relative flex gap-4"
                        >

                          <div
                            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${
                              completed || current
                                ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                                : "bg-[#0b1727] border-white/10 text-slate-600"
                            }`}
                          >
                            {completed ? "✓" : index + 1}
                          </div>

                          <div className="flex-1 pt-1">

                            <p
                              className={`font-bold text-sm ${
                                current
                                  ? "text-blue-400"
                                  : completed
                                  ? "text-white"
                                  : "text-slate-500"
                              }`}
                            >
                              {step.title}
                            </p>

                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {step.description}
                            </p>

                          </div>

                        </div>
                      );
                    })}

                  </div>

                </div>
              )}

              {/* SUPPORT */}
              <div className="border-t border-white/10 mt-8 pt-6">

                <p className="text-sm font-bold">
                  Need help with this order?
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Contact the NILETEE team about this order.
                </p>

                <a
                  href="mailto:technesttechnolgies67@gmail.com"
                  className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm transition flex items-center justify-center"
                >
                  💬 Contact Support
                </a>

              </div>

            </section>

          </aside>

        </div>
      </div>
    </main>
  );
}