"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type RequestRow = {
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

type PaymentRow = {
  id: string;
  request_id: string;
  customer_id: string;
  payment_type: string;
  amount: number;
  status: string;
  payment_method: string | null;
  transaction_reference: string | null;
  phone_number: string | null;
  paid_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
};

type ContactMessageRow = {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string | null;
  status: string | null;
  created_at: string;
};

type CustomerSummary = { id:string; name:string; email:string; phone:string; orders:number; activeOrders:number; completedOrders:number; totalValue:number; lastOrder:string|null; };

const STATUS_OPTIONS = [
  "pending",
  "approved",
  "purchased",
  "shipping",
  "delivered",
  "completed",
  "cancelled",
];

export default function AdminPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessageRow[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerSearch, setCustomerSearch] = useState("");

  const [selectedRequest, setSelectedRequest] =
    useState<RequestRow | null>(null);

  const [selectedMessage, setSelectedMessage] =
    useState<ContactMessageRow | null>(null);

  const [editStatus, setEditStatus] = useState("");
  const [editItemPrice, setEditItemPrice] = useState("");
  const [editShippingFee, setEditShippingFee] = useState("");
  const [editServiceFee, setEditServiceFee] = useState("");
  const [editDeliveryFee, setEditDeliveryFee] = useState("");
  const [editAdminNotes, setEditAdminNotes] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Authentication error:", userError);

        setMessageType("error");
        setMessage(`Authentication error: ${userError.message}`);
        return;
      }

      if (!user) {
        window.location.href = "/login";
        return;
      }

      console.log("NILETEE ADMIN CHECK");
      console.log("LOGGED IN USER ID:", user.id);
      console.log("LOGGED IN EMAIL:", user.email);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      console.log("PROFILE RESULT:", profile);
      console.log("PROFILE ERROR:", profileError);

      if (profileError) {
        console.error("Profile lookup error:", profileError);

        setMessageType("error");
        setMessage(
          `Could not verify admin access: ${profileError.message}`
        );

        return;
      }

      if (!profile) {
        setMessageType("error");
        setMessage(
          "Your account is logged in, but Supabase could not read your admin profile. Check the profiles table RLS policy."
        );

        return;
      }

      if (profile.role !== "admin") {
        setMessageType("error");
        setMessage(
          `Your account does not have admin access. Current role: ${
            profile.role || "not assigned"
          }`
        );

        return;
      }

      console.log("ADMIN ACCESS CONFIRMED");

      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setRequests((data || []) as RequestRow[]);

      await loadPayments();
      await loadContactMessages();
    } catch (error) {
      console.error("ADMIN DASHBOARD ERROR:", error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPayments() {
    setPaymentsLoading(true);

    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setPayments((data || []) as PaymentRow[]);
    } catch (error) {
      console.error("PAYMENTS ERROR:", error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? `Could not load payments: ${error.message}`
          : "Could not load payments."
      );
    } finally {
      setPaymentsLoading(false);
    }
  }

  async function loadContactMessages() {
    setMessagesLoading(true);

    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select(
          "id, user_id, name, email, phone, subject, message, status, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setContactMessages((data || []) as ContactMessageRow[]);
    } catch (error) {
      console.error("CONTACT MESSAGES ERROR:", error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? `Could not load contact messages: ${error.message}`
          : "Could not load contact messages."
      );
    } finally {
      setMessagesLoading(false);
    }
  }

  async function verifyPayment(payment: PaymentRow) {
    if (payment.status.toLowerCase() === "paid") {
      setMessageType("success");
      setMessage("This payment has already been verified.");
      return;
    }

    const confirmed = window.confirm(
      `Verify this M-Pesa payment?\n\nAmount: ${money(
        payment.amount
      )}\nTransaction: ${
        payment.transaction_reference || "No transaction code"
      }\nPhone: ${payment.phone_number || "Not provided"}`
    );

    if (!confirmed) {
      return;
    }

    setVerifyingPayment(payment.id);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your admin session has expired. Please log in again."
        );
      }

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_at: now,
          verified_at: now,
          verified_by: user.id,
        })
        .eq("id", payment.id)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error(
          "Payment was not updated. The payment may no longer exist or you may not have permission to update it."
        );
      }

      setPayments((currentPayments) =>
        currentPayments.map((item) =>
          item.id === payment.id ? (data as PaymentRow) : item
        )
      );

      setMessageType("success");
      setMessage("Payment verified successfully.");
    } catch (error) {
      console.error(error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not verify payment."
      );
    } finally {
      setVerifyingPayment(null);
    }
  }

  function money(value: number | string | null | undefined) {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(value: string | null | undefined) {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function openRequest(request: RequestRow) {
    setSelectedRequest(request);

    setEditStatus(request.status || "pending");
    setEditItemPrice(String(request.item_price ?? ""));
    setEditShippingFee(String(request.shipping_fee ?? ""));
    setEditServiceFee(String(request.service_fee ?? ""));
    setEditDeliveryFee(String(request.delivery_fee ?? ""));
    setEditAdminNotes(request.admin_notes || "");

    setMessage("");
  }

  function closeRequest() {
    setSelectedRequest(null);
  }

  function openMessage(contactMessage: ContactMessageRow) {
    setSelectedMessage(contactMessage);
  }

  function closeMessage() {
    setSelectedMessage(null);
  }

  function isUnreadMessage(status: string | null) {
    const normalized = (status || "").toLowerCase();

    return ["unread", "new", "pending"].includes(normalized);
  }

  function messageStatusLabel(status: string | null) {
    const normalized = (status || "new").toLowerCase();

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  const calculatedTotal = useMemo(() => {
    const itemPrice = Number(editItemPrice || 0);
    const quantity = Number(selectedRequest?.quantity || 1);
    const shipping = Number(editShippingFee || 0);
    const service = Number(editServiceFee || 0);
    const delivery = Number(editDeliveryFee || 0);

    return itemPrice * quantity + shipping + service + delivery;
  }, [
    selectedRequest,
    editItemPrice,
    editShippingFee,
    editServiceFee,
    editDeliveryFee,
  ]);

  async function saveRequestChanges() {
    if (!selectedRequest) return;

    setSaving(true);
    setMessage("");

    try {
      const itemPrice = Number(editItemPrice || 0);
      const shippingFee = Number(editShippingFee || 0);
      const serviceFee = Number(editServiceFee || 0);
      const deliveryFee = Number(editDeliveryFee || 0);
      const quantity = Number(selectedRequest.quantity || 1);

      const totalItemAmount = itemPrice * quantity;

      const totalFinalAmount =
        totalItemAmount + shippingFee + serviceFee + deliveryFee;

      const { data, error } = await supabase
        .from("requests")
        .update({
          status: editStatus,
          item_price: itemPrice,
          shipping_fee: shippingFee,
          service_fee: serviceFee,
          delivery_fee: deliveryFee,
          total_item_amount: totalItemAmount,
          total_final_amount: totalFinalAmount,
          admin_notes: editAdminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error(
          "Request was not updated. The request may no longer exist or you may not have permission to update it."
        );
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === selectedRequest.id
            ? (data as RequestRow)
            : request
        )
      );

      setSelectedRequest(data as RequestRow);

      setMessageType("success");
      setMessage("Request updated successfully.");
    } catch (error) {
      console.error(error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update request."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "all" ||
        (request.status || "").toLowerCase() === statusFilter;

      if (!matchesStatus) return false;

      if (!query) return true;

      return (
        (request.request_number || "").toLowerCase().includes(query) ||
        (request.title || "").toLowerCase().includes(query) ||
        (request.description || "").toLowerCase().includes(query) ||
        (request.delivery_location || "").toLowerCase().includes(query) ||
        (request.customer_id || "").toLowerCase().includes(query)
      );
    });
  }, [requests, search, statusFilter]);

  const stats = useMemo(() => {
    const total = requests.length;

    const pending = requests.filter(
      (request) => request.status?.toLowerCase() === "pending"
    ).length;

    const active = requests.filter((request) =>
      ["approved", "purchased", "shipping"].includes(
        request.status?.toLowerCase() || ""
      )
    ).length;

    const completed = requests.filter((request) =>
      ["delivered", "completed"].includes(
        request.status?.toLowerCase() || ""
      )
    ).length;

    return {
      total,
      pending,
      active,
      completed,
    };
  }, [requests]);

  const financialStats = useMemo(() => {
    const itemValue = requests.reduce(
      (sum, request) => sum + Number(request.total_item_amount || 0),
      0
    );

    const shipping = requests.reduce(
      (sum, request) => sum + Number(request.shipping_fee || 0),
      0
    );

    const finalValue = requests.reduce(
      (sum, request) => sum + Number(request.total_final_amount || 0),
      0
    );

    return {
      itemValue,
      shipping,
      finalValue,
    };
  }, [requests]);

  const paymentStats = useMemo(() => {
    const pendingPayments = payments.filter(
      (payment) => payment.status.toLowerCase() === "pending"
    );

    const verifiedPayments = payments.filter(
      (payment) => payment.status.toLowerCase() === "paid"
    );

    const pendingPaymentValue = pendingPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const verifiedPaymentValue = verifiedPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const totalPaymentValue = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    return {
      total: payments.length,
      pending: pendingPayments.length,
      verified: verifiedPayments.length,
      pendingValue: pendingPaymentValue,
      verifiedValue: verifiedPaymentValue,
      totalValue: totalPaymentValue,
    };
  }, [payments]);

  const messageStats = useMemo(() => {
    const unread = contactMessages.filter((contactMessage) =>
      isUnreadMessage(contactMessage.status)
    ).length;

    return {
      total: contactMessages.length,
      unread,
    };
  }, [contactMessages]);

  const customers = useMemo<CustomerSummary[]>(() => {
    const map = new Map<string, CustomerSummary>();
    requests.forEach((request) => {
      const id = request.customer_id; if (!id) return;
      const status = (request.status || "pending").toLowerCase();
      const value = Number(request.total_final_amount || request.total_item_amount || 0);
      const existing = map.get(id);
      if (existing) {
        existing.orders += 1; existing.totalValue += value;
        if (["approved","purchased","shipping"].includes(status)) existing.activeOrders += 1;
        if (["delivered","completed"].includes(status)) existing.completedOrders += 1;
        if (!existing.lastOrder || new Date(request.created_at) > new Date(existing.lastOrder)) existing.lastOrder = request.created_at;
      } else {
        const contact = contactMessages.find((m) => m.user_id === id);
        map.set(id, { id, name: contact?.name || `Customer ${id.slice(0,8)}`, email: contact?.email || "Not available", phone: contact?.phone || "Not available", orders:1, activeOrders:["approved","purchased","shipping"].includes(status)?1:0, completedOrders:["delivered","completed"].includes(status)?1:0, totalValue:value, lastOrder:request.created_at });
      }
    });
    contactMessages.forEach((contact) => {
      if (!contact.user_id || map.has(contact.user_id)) return;
      map.set(contact.user_id, { id:contact.user_id, name:contact.name || `Customer ${contact.user_id.slice(0,8)}`, email:contact.email || "Not available", phone:contact.phone || "Not available", orders:0, activeOrders:0, completedOrders:0, totalValue:0, lastOrder:null });
    });
    return Array.from(map.values()).sort((a,b)=>b.totalValue-a.totalValue);
  }, [requests, contactMessages]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase(); if (!q) return customers;
    return customers.filter((c)=>[c.name,c.email,c.phone,c.id].some((v)=>v.toLowerCase().includes(q)));
  }, [customers, customerSearch]);

  const deliveryStats = useMemo(() => ({
    ready: requests.filter(r => (r.status || "").toLowerCase() === "purchased").length,
    shipping: requests.filter(r => (r.status || "").toLowerCase() === "shipping").length,
    delivered: requests.filter(r => (r.status || "").toLowerCase() === "delivered").length,
  }), [requests]);

  const statusBreakdown = useMemo(() => STATUS_OPTIONS.map(status => ({ status, count: requests.filter(r => (r.status || "pending").toLowerCase() === status).length })), [requests]);

  return (
    <main className="adminPage">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandLogo">N</div>

          <div>
            <h1>NILETEE</h1>
            <span>ADMIN PANEL</span>
          </div>
        </div>

        <nav className="sidebarNav">
          <a href="#dashboard" className="navItem active">
            <span>⌂</span>
            Dashboard
          </a>

          <a href="#requests-section" className="navItem">
            <span>▣</span>
            Requests
            <b>{requests.length}</b>
          </a>

          <a href="#customers-section" className="navItem"><span>♙</span>Customers<b>{customers.length}</b></a>
          <a href="#delivery-section" className="navItem"><span>🏍</span>Delivery{deliveryStats.shipping > 0 && <b className="navAlert">{deliveryStats.shipping}</b>}</a>
          <a href="#analytics-section" className="navItem"><span>◒</span>Analytics</a>

          <a href="#payments-section" className="navItem">
            <span>💳</span>
            Payments

            {paymentStats.pending > 0 && (
              <b className="navAlert">{paymentStats.pending}</b>
            )}
          </a>

          <a href="#messages-section" className="navItem">
            <span>✉</span>
            Messages

            {messageStats.unread > 0 && (
              <b className="navAlert">{messageStats.unread}</b>
            )}
          </a>

          <Link href="/" className="navItem">
            <span>↗</span>
            View Website
          </Link>
        </nav>

        <div className="sidebarBottom">
          <div className="adminBadge">
            <div className="adminAvatar">A</div>

            <div>
              <strong>Administrator</strong>
              <small>NILETEE Management</small>
            </div>
          </div>
        </div>
      </aside>

      <section className="dashboardContent" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">NILETEE MANAGEMENT SYSTEM</p>

            <h2>Admin Dashboard</h2>

            <p className="topbarDescription">
              Manage customer requests, pricing, sourcing, payments,
              deliveries and customer messages from one place.
            </p>
          </div>

          <button
            className="refreshButton"
            onClick={loadRequests}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh Dashboard"}
          </button>
        </header>

        {message && (
          <div className={`message ${messageType}`}>
            <span>{messageType === "success" ? "✓" : "!"}</span>
            {message}
          </div>
        )}

        <section className="statsGrid">
          <div className="statCard">
            <div className="statIcon">▣</div>

            <div>
              <span>Total Requests</span>
              <strong>{stats.total}</strong>
              <small>All customer requests</small>
            </div>
          </div>

          <div className="statCard orange">
            <div className="statIcon">⏳</div>

            <div>
              <span>Pending Requests</span>
              <strong>{stats.pending}</strong>
              <small>Waiting for action</small>
            </div>
          </div>

          <div className="statCard blue">
            <div className="statIcon">↻</div>

            <div>
              <span>Active Orders</span>
              <strong>{stats.active}</strong>
              <small>Being processed</small>
            </div>
          </div>

          <div className="statCard purple">
            <div className="statIcon">✓</div>

            <div>
              <span>Completed</span>
              <strong>{stats.completed}</strong>
              <small>Delivered or completed</small>
            </div>
          </div>
        </section>

        <section className="financialGrid">
          <div className="financeCard">
            <span>Total Item Value</span>
            <strong>{money(financialStats.itemValue)}</strong>
            <small>Customer item purchases</small>
          </div>

          <div className="financeCard">
            <span>Total Shipping</span>
            <strong>{money(financialStats.shipping)}</strong>
            <small>Shipping fees recorded</small>
          </div>

          <div className="financeCard highlight">
            <span>Total Order Value</span>
            <strong>{money(financialStats.finalValue)}</strong>
            <small>Items + fees</small>
          </div>
        </section>

        <section className="commandGrid" id="command-center">
          <div className="commandCard attentionCard"><div className="commandHeading"><div><p className="sectionLabel">COMMAND CENTER</p><h3>Needs your attention</h3></div><span className="liveDot">LIVE</span></div><div className="attentionList">
            <button onClick={()=>{setStatusFilter("pending");document.getElementById("requests-section")?.scrollIntoView({behavior:"smooth"})}}><span className="attentionIcon orange">!</span><div><strong>{stats.pending} pending requests</strong><small>Review and approve customer orders</small></div><b>→</b></button>
            <button onClick={()=>document.getElementById("payments-section")?.scrollIntoView({behavior:"smooth"})}><span className="attentionIcon gold">₵</span><div><strong>{paymentStats.pending} payments to verify</strong><small>{money(paymentStats.pendingValue)} awaiting verification</small></div><b>→</b></button>
            <button onClick={()=>document.getElementById("messages-section")?.scrollIntoView({behavior:"smooth"})}><span className="attentionIcon blue">✉</span><div><strong>{messageStats.unread} unread messages</strong><small>Customer support needs attention</small></div><b>→</b></button>
            <button onClick={()=>document.getElementById("delivery-section")?.scrollIntoView({behavior:"smooth"})}><span className="attentionIcon green">🏍</span><div><strong>{deliveryStats.ready} orders ready for delivery</strong><small>{deliveryStats.shipping} currently shipping</small></div><b>→</b></button>
          </div></div>
          <div className="commandCard pipelineCard"><div className="commandHeading"><div><p className="sectionLabel">ORDER PIPELINE</p><h3>Operations at a glance</h3></div></div><div className="pipeline">{statusBreakdown.map(item=><div className="pipelineStep" key={item.status}><strong>{item.count}</strong><span>{item.status}</span></div>)}</div><div className="pipelineBar">{statusBreakdown.map(item=><span key={item.status} className={`pipe_${item.status}`} style={{flex:Math.max(item.count,.15)}} />)}</div></div>
        </section>

        <section className="panel" id="analytics-section"><div className="panelHeader"><div><p className="sectionLabel">BUSINESS INTELLIGENCE</p><h3>Performance & statistics</h3><span>Live calculations from your current NILETEE orders and payments.</span></div></div><div className="analyticsGrid"><div className="analyticsCard"><span>Average order value</span><strong>{money(requests.length ? financialStats.finalValue / requests.length : 0)}</strong><small>Across {requests.length} orders</small></div><div className="analyticsCard"><span>Verified collections</span><strong>{money(paymentStats.verifiedValue)}</strong><small>{paymentStats.verified} verified payments</small></div><div className="analyticsCard"><span>Outstanding claims</span><strong>{money(paymentStats.pendingValue)}</strong><small>{paymentStats.pending} awaiting verification</small></div><div className="analyticsCard"><span>Completion rate</span><strong>{requests.length ? Math.round(stats.completed / requests.length * 100) : 0}%</strong><small>{stats.completed} delivered/completed</small></div></div></section>

        <section className="panel" id="customers-section"><div className="panelHeader"><div><p className="sectionLabel">CUSTOMER MANAGEMENT</p><h3>Customers & customer value</h3><span>Customer records assembled from current order and contact information.</span></div><div className="headerTools"><div className="searchBox customerSearch"><span>⌕</span><input value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} placeholder="Search customers..." /></div></div></div>{filteredCustomers.length===0?<div className="emptyState"><div className="emptyIcon">♙</div><h3>No customers found</h3><p>Customers appear here once an order or contact record exists.</p></div>:<div className="tableWrapper"><table className="customerTable"><thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Active</th><th>Completed</th><th>Customer value</th><th>Last order</th><th>Action</th></tr></thead><tbody>{filteredCustomers.slice(0,50).map(c=><tr key={c.id}><td><div className="customerCell"><div className="customerAvatar">{c.name.slice(0,1).toUpperCase()}</div><div><strong>{c.name}</strong><small className="mutedText">ID: {c.id.slice(0,12)}…</small></div></div></td><td><div className="customerContact"><span>{c.email}</span><small>{c.phone}</small></div></td><td><strong>{c.orders}</strong></td><td><span className="miniMetric activeMetric">{c.activeOrders}</span></td><td><span className="miniMetric completeMetric">{c.completedOrders}</span></td><td><strong className="customerValue">{money(c.totalValue)}</strong></td><td>{formatDate(c.lastOrder)}</td><td><button className="viewButton" onClick={()=>{const r=requests.find(x=>x.customer_id===c.id);if(r)openRequest(r);else{const m=contactMessages.find(x=>x.user_id===c.id);if(m)openMessage(m)}}}>View profile</button></td></tr>)}</tbody></table></div>}</section>

        <section className="panel" id="delivery-section"><div className="panelHeader"><div><p className="sectionLabel">DELIVERY OPERATIONS</p><h3>Delivery control board</h3><span>Track the operational delivery stage of orders.</span></div><div className="deliveryKpis"><span><b>{deliveryStats.ready}</b> Ready</span><span><b>{deliveryStats.shipping}</b> Shipping</span><span><b>{deliveryStats.delivered}</b> Delivered</span></div></div><div className="deliveryBoard">{[{key:"purchased",title:"READY FOR DELIVERY",icon:"📦"},{key:"shipping",title:"OUT FOR DELIVERY",icon:"🏍"},{key:"delivered",title:"DELIVERED",icon:"✓"}].map(col=><div className="deliveryColumn" key={col.key}><div className="deliveryColumnTitle"><span>{col.icon}</span><strong>{col.title}</strong><b>{requests.filter(r=>(r.status||"").toLowerCase()===col.key).length}</b></div>{requests.filter(r=>(r.status||"").toLowerCase()===col.key).slice(0,8).map(r=><button className="deliveryOrder" key={r.id} onClick={()=>openRequest(r)}><strong>{r.request_number||"Order"}</strong><span>{r.title||"Untitled request"}</span><small>{r.delivery_location||"Location not provided"}</small><em>{money(r.delivery_fee)}</em></button>)}{requests.filter(r=>(r.status||"").toLowerCase()===col.key).length===0&&<div className="columnEmpty">No orders</div>}</div>)}</div><div className="riderNotice"><span>🏍</span><div><strong>Rider assignment is the next database module</strong><p>We will add persistent rider profiles and delivery assignments in Supabase next. This avoids fake assignments and keeps delivery data reliable.</p></div><button onClick={()=>{setMessageType("success");setMessage("Rider database setup is the next implementation step.")}}>Rider setup</button></div></section>

        {/* REQUESTS */}
        <section className="panel" id="requests-section">
          <div className="panelHeader">
            <div>
              <p className="sectionLabel">ORDER MANAGEMENT</p>

              <h2>Customer Requests</h2>

              <p>
                Review customer requests, update pricing, manage status and
                add internal notes.
              </p>
            </div>

            <div className="requestCount">
              Showing <strong>{filteredRequests.length}</strong> of{" "}
              <strong>{requests.length}</strong>
            </div>
          </div>

          <div className="filters">
            <div className="searchBox">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search request number, title, customer..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Statuses</option>

              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="emptyState">
              <div className="loader"></div>

              <h3>Loading requests...</h3>

              <p>Please wait while the dashboard loads.</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="emptyState">
              <div className="emptyIcon">▣</div>

              <h3>No requests found</h3>

              <p>
                There are no requests matching your current search or filter.
              </p>
            </div>
          ) : (
            <div className="tableWrapper">
              <table>
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Customer</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div className="requestNumber">
                          #{request.request_number || "N/A"}
                        </div>

                        <small className="mutedText">
                          {request.id.slice(0, 8)}...
                        </small>
                      </td>

                      <td>
                        <div className="customerCell">
                          <div className="customerAvatar">
                            {request.customer_id.slice(0, 1).toUpperCase()}
                          </div>

                          <span title={request.customer_id}>
                            {request.customer_id.slice(0, 8)}...
                          </span>
                        </div>
                      </td>

                      <td>
                        <strong className="itemTitle">
                          {request.title || "Untitled request"}
                        </strong>

                        {request.delivery_location && (
                          <small className="mutedText">
                            {request.delivery_location}
                          </small>
                        )}
                      </td>

                      <td>{request.quantity || 1}</td>

                      <td>
                        <strong>
                          {money(request.total_final_amount)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`statusBadge ${
                            request.status?.toLowerCase() || "pending"
                          }`}
                        >
                          {request.status || "pending"}
                        </span>
                      </td>

                      <td>
                        <span className="dateText">
                          {formatDate(request.created_at)}
                        </span>
                      </td>

                      <td>
                        <button
                          className="viewButton"
                          onClick={() => openRequest(request)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* PAYMENTS */}
        <section className="panel paymentPanel" id="payments-section">
          <div className="panelHeader">
            <div>
              <p className="sectionLabel">PAYMENT VERIFICATION</p>

              <h2>Customer Payments</h2>

              <p>
                Review manually submitted M-Pesa payments and verify them after
                confirming the transaction.
              </p>
            </div>

            <button
              className="smallRefreshButton"
              onClick={loadPayments}
              disabled={paymentsLoading}
            >
              {paymentsLoading ? "Loading..." : "↻ Refresh Payments"}
            </button>
          </div>

          <div className="paymentSummary">
            <div className="paymentSummaryCard pendingPayment">
              <span>Pending Verification</span>

              <strong>{paymentStats.pending}</strong>

              <small>
                {money(paymentStats.pendingValue)} awaiting review
              </small>
            </div>

            <div className="paymentSummaryCard verifiedPayment">
              <span>Verified Payments</span>

              <strong>{paymentStats.verified}</strong>

              <small>{money(paymentStats.verifiedValue)} verified</small>
            </div>

            <div className="paymentSummaryCard totalPayment">
              <span>Total Payments</span>

              <strong>{paymentStats.total}</strong>

              <small>{money(paymentStats.totalValue)} total value</small>
            </div>
          </div>

          {paymentsLoading && payments.length === 0 ? (
            <div className="emptyState">
              <div className="loader"></div>

              <h3>Loading payments...</h3>
            </div>
          ) : payments.length === 0 ? (
            <div className="emptyState">
              <div className="emptyIcon">💳</div>

              <h3>No payments found</h3>

              <p>
                Customer payment submissions will appear here once they are
                submitted.
              </p>
            </div>
          ) : (
            <div className="tableWrapper">
              <table className="paymentTable">
                <thead>
                  <tr>
                    <th>Payment</th>
                    <th>Request</th>
                    <th>Customer</th>
                    <th>M-Pesa Phone</th>
                    <th>Amount</th>
                    <th>Transaction Code</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => {
                    const paymentRequest = requests.find(
                      (request) => request.id === payment.request_id
                    );

                    const paymentStatus = payment.status.toLowerCase();

                    return (
                      <tr key={payment.id}>
                        <td>
                          <strong className="paymentId">
                            #{payment.id.slice(0, 8)}
                          </strong>

                          <small className="mutedText">
                            {payment.payment_type || "purchase"}
                          </small>
                        </td>

                        <td>
                          {paymentRequest ? (
                            <div className="paymentRequestCell">
                              <strong>
                                #{paymentRequest.request_number || "N/A"}
                              </strong>

                              <small>
                                {paymentRequest.title || "Untitled request"}
                              </small>

                              <button
                                className="miniViewButton"
                                onClick={() => openRequest(paymentRequest)}
                              >
                                View Request
                              </button>
                            </div>
                          ) : (
                            <span className="mutedText">
                              Request unavailable
                            </span>
                          )}
                        </td>

                        <td>
                          <span
                            className="customerId"
                            title={payment.customer_id}
                          >
                            {payment.customer_id.slice(0, 8)}...
                          </span>
                        </td>

                        <td>
                          <strong className="phoneNumber">
                            {payment.phone_number || "Not provided"}
                          </strong>
                        </td>

                        <td>
                          <strong className="paymentAmount">
                            {money(payment.amount)}
                          </strong>
                        </td>

                        <td>
                          <span className="transactionCode">
                            {payment.transaction_reference || "—"}
                          </span>
                        </td>

                        <td>
                          <span className={`paymentStatus ${paymentStatus}`}>
                            {paymentStatus === "paid"
                              ? "✓ Paid"
                              : paymentStatus}
                          </span>
                        </td>

                        <td>
                          <span className="dateText">
                            {formatDateTime(payment.created_at)}
                          </span>

                          {payment.verified_at && (
                            <small className="verifiedDate">
                              Verified {formatDateTime(payment.verified_at)}
                            </small>
                          )}
                        </td>

                        <td>
                          {paymentStatus === "pending" ? (
                            <button
                              className="verifyButton"
                              onClick={() => verifyPayment(payment)}
                              disabled={verifyingPayment === payment.id}
                            >
                              {verifyingPayment === payment.id
                                ? "Verifying..."
                                : "Verify Payment"}
                            </button>
                          ) : paymentStatus === "paid" ? (
                            <span className="verifiedLabel">✓ Verified</span>
                          ) : (
                            <span className="mutedText">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* CONTACT MESSAGES */}
        <section className="panel messagesPanel" id="messages-section">
          <div className="panelHeader">
            <div>
              <p className="sectionLabel">CUSTOMER SUPPORT</p>

              <h2>Contact Messages</h2>

              <p>
                Messages sent through the NILETEE contact form appear here for
                review.
              </p>
            </div>

            <div className="messageHeaderActions">
              <div className="messageCount">
                <strong>{messageStats.total}</strong>
                <span>Total Messages</span>
              </div>

              <div className="messageCount unreadCount">
                <strong>{messageStats.unread}</strong>
                <span>Unread</span>
              </div>

              <button
                className="smallRefreshButton"
                onClick={loadContactMessages}
                disabled={messagesLoading}
              >
                {messagesLoading ? "Loading..." : "↻ Refresh Messages"}
              </button>
            </div>
          </div>

          {messagesLoading && contactMessages.length === 0 ? (
            <div className="emptyState">
              <div className="loader"></div>

              <h3>Loading messages...</h3>

              <p>Please wait while customer messages are loaded.</p>
            </div>
          ) : contactMessages.length === 0 ? (
            <div className="emptyState">
              <div className="emptyIcon">✉</div>

              <h3>No contact messages</h3>

              <p>
                Customer messages submitted through the contact form will
                appear here.
              </p>
            </div>
          ) : (
            <div className="tableWrapper">
              <table className="messageTable">
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Contact</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {contactMessages.map((contactMessage) => {
                    const messageStatus = (
                      contactMessage.status || "new"
                    ).toLowerCase();

                    return (
                      <tr key={contactMessage.id}>
                        <td>
                          <div className="messageSender">
                            <div className="messageAvatar">
                              {(contactMessage.name || "C")
                                .slice(0, 1)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {contactMessage.name || "Unknown customer"}
                              </strong>

                              <small className="mutedText">
                                {contactMessage.user_id
                                  ? `${contactMessage.user_id.slice(0, 8)}...`
                                  : "Guest"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="messageContact">
                            <span>
                              {contactMessage.email || "No email"}
                            </span>

                            <small>
                              {contactMessage.phone || "No phone"}
                            </small>
                          </div>
                        </td>

                        <td>
                          <strong className="messageSubject">
                            {contactMessage.subject || "No subject"}
                          </strong>
                        </td>

                        <td>
                          <p className="messagePreview">
                            {contactMessage.message ||
                              "No message content."}
                          </p>
                        </td>

                        <td>
                          <span
                            className={`messageStatus ${messageStatus}`}
                          >
                            {messageStatusLabel(contactMessage.status)}
                          </span>
                        </td>

                        <td>
                          <span className="dateText">
                            {formatDateTime(contactMessage.created_at)}
                          </span>
                        </td>

                        <td>
                          <button
                            className="viewButton"
                            onClick={() => openMessage(contactMessage)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {/* REQUEST MODAL */}
      {selectedRequest && (
        <div className="modalOverlay" onClick={closeRequest}>
          <div
            className="requestModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modalHeader">
              <div>
                <p className="sectionLabel">REQUEST DETAILS</p>

                <h2>
                  #{selectedRequest.request_number || "N/A"}
                </h2>

                <span>
                  Created {formatDateTime(selectedRequest.created_at)}
                </span>
              </div>

              <button className="closeButton" onClick={closeRequest}>
                ×
              </button>
            </div>

            <div className="modalBody">
              <div className="requestInfoGrid">
                <div className="infoBox">
                  <span>Customer ID</span>
                  <strong>{selectedRequest.customer_id}</strong>
                </div>

                <div className="infoBox">
                  <span>Request Title</span>
                  <strong>
                    {selectedRequest.title || "Untitled request"}
                  </strong>
                </div>

                <div className="infoBox">
                  <span>Quantity</span>
                  <strong>{selectedRequest.quantity || 1}</strong>
                </div>

                <div className="infoBox">
                  <span>Delivery Location</span>
                  <strong>
                    {selectedRequest.delivery_location || "Not provided"}
                  </strong>
                </div>
              </div>

              <div className="detailSection">
                <h3>Customer Request</h3>

                <p className="descriptionText">
                  {selectedRequest.description ||
                    "No description provided."}
                </p>

                {selectedRequest.product_link && (
                  <a
                    href={selectedRequest.product_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="productLink"
                  >
                    🔗 Open Product Link
                  </a>
                )}

                <div className="productDetails">
                  <div>
                    <span>Size</span>
                    <strong>{selectedRequest.size || "—"}</strong>
                  </div>

                  <div>
                    <span>Color</span>
                    <strong>{selectedRequest.color || "—"}</strong>
                  </div>

                  <div>
                    <span>Model</span>
                    <strong>{selectedRequest.model || "—"}</strong>
                  </div>

                  <div>
                    <span>Budget</span>
                    <strong>{money(selectedRequest.budget)}</strong>
                  </div>
                </div>

                {selectedRequest.additional_instructions && (
                  <div className="instructionsBox">
                    <span>Customer Instructions</span>

                    <p>{selectedRequest.additional_instructions}</p>
                  </div>
                )}
              </div>

              <div className="detailSection">
                <h3>Admin Processing</h3>

                <div className="editGrid">
                  <label>
                    <span>Status</span>

                    <select
                      value={editStatus}
                      onChange={(event) =>
                        setEditStatus(event.target.value)
                      }
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() +
                            status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Item Price</span>

                    <input
                      type="number"
                      min="0"
                      value={editItemPrice}
                      onChange={(event) =>
                        setEditItemPrice(event.target.value)
                      }
                      placeholder="0"
                    />
                  </label>

                  <label>
                    <span>Shipping Fee</span>

                    <input
                      type="number"
                      min="0"
                      value={editShippingFee}
                      onChange={(event) =>
                        setEditShippingFee(event.target.value)
                      }
                      placeholder="0"
                    />
                  </label>

                  <label>
                    <span>Service Fee</span>

                    <input
                      type="number"
                      min="0"
                      value={editServiceFee}
                      onChange={(event) =>
                        setEditServiceFee(event.target.value)
                      }
                      placeholder="0"
                    />
                  </label>

                  <label>
                    <span>Delivery Fee</span>

                    <input
                      type="number"
                      min="0"
                      value={editDeliveryFee}
                      onChange={(event) =>
                        setEditDeliveryFee(event.target.value)
                      }
                      placeholder="0"
                    />
                  </label>
                </div>

                <label className="notesField">
                  <span>Admin Notes</span>

                  <textarea
                    rows={4}
                    value={editAdminNotes}
                    onChange={(event) =>
                      setEditAdminNotes(event.target.value)
                    }
                    placeholder="Add internal notes about sourcing, purchasing, delivery, customer communication..."
                  />
                </label>
              </div>

              <div className="calculationBox">
                <div>
                  <span>Quantity</span>
                  <strong>{selectedRequest.quantity || 1}</strong>
                </div>

                <div>
                  <span>Item Amount</span>
                  <strong>
                    {money(
                      Number(editItemPrice || 0) *
                        Number(selectedRequest.quantity || 1)
                    )}
                  </strong>
                </div>

                <div>
                  <span>Shipping</span>
                  <strong>{money(editShippingFee)}</strong>
                </div>

                <div>
                  <span>Service</span>
                  <strong>{money(editServiceFee)}</strong>
                </div>

                <div>
                  <span>Delivery</span>
                  <strong>{money(editDeliveryFee)}</strong>
                </div>

                <div className="totalCalculation">
                  <span>Final Total</span>
                  <strong>{money(calculatedTotal)}</strong>
                </div>
              </div>
            </div>

            <div className="modalFooter">
              <button
                className="cancelButton"
                onClick={closeRequest}
              >
                Close
              </button>

              <button
                className="saveButton"
                onClick={saveRequestChanges}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT MESSAGE MODAL */}
      {selectedMessage && (
        <div className="modalOverlay" onClick={closeMessage}>
          <div
            className="requestModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modalHeader">
              <div>
                <p className="sectionLabel">CONTACT MESSAGE</p>

                <h2>
                  {selectedMessage.subject || "No subject"}
                </h2>

                <span>
                  Received {formatDateTime(selectedMessage.created_at)}
                </span>
              </div>

              <button className="closeButton" onClick={closeMessage}>
                ×
              </button>
            </div>

            <div className="modalBody">
              <div className="requestInfoGrid">
                <div className="infoBox">
                  <span>Name</span>

                  <strong>
                    {selectedMessage.name || "Not provided"}
                  </strong>
                </div>

                <div className="infoBox">
                  <span>Email</span>

                  <strong>
                    {selectedMessage.email || "Not provided"}
                  </strong>
                </div>

                <div className="infoBox">
                  <span>Phone</span>

                  <strong>
                    {selectedMessage.phone || "Not provided"}
                  </strong>
                </div>

                <div className="infoBox">
                  <span>Status</span>

                  <strong>
                    {messageStatusLabel(selectedMessage.status)}
                  </strong>
                </div>
              </div>

              <div className="detailSection">
                <h3>Customer Message</h3>

                <p className="descriptionText messageFullText">
                  {selectedMessage.message || "No message content."}
                </p>
              </div>

              {selectedMessage.user_id && (
                <div className="detailSection">
                  <h3>Customer Account</h3>

                  <div className="infoBox">
                    <span>User ID</span>

                    <strong>{selectedMessage.user_id}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="modalFooter">
              <button
                className="cancelButton"
                onClick={closeMessage}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .adminPage {
          min-height: 100vh;
          background: #f5f8f7;
          color: #20332b;
          display: flex;
          font-family: Arial, Helvetica, sans-serif;
        }

        .sidebar {
          width: 235px;
          min-height: 100vh;
          background: #102d24;
          color: white;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          z-index: 20;
        }

        .brand {
          padding: 25px 20px;
          display: flex;
          align-items: center;
          gap: 11px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .brandLogo {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #0a9e4c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
          font-weight: 900;
        }

        .brand h1 {
          margin: 0;
          font-size: 18px;
          letter-spacing: 1px;
        }

        .brand span {
          font-size: 8px;
          color: #a9c0b7;
          font-weight: 800;
        }

        .sidebarNav {
          padding: 22px 12px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .navItem {
          color: #bdd0c9;
          text-decoration: none;
          padding: 12px 13px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          transition: 0.2s;
        }

        .navItem span {
          width: 20px;
          text-align: center;
        }

        .navItem b {
          margin-left: auto;
          background: #dfeae5;
          color: #19372d;
          min-width: 21px;
          height: 21px;
          padding: 0 5px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
        }

        .navItem .navAlert {
          background: #f08b32;
          color: white;
        }

        .navItem:hover,
        .navItem.active {
          background: #1a4a3a;
          color: white;
        }

        .sidebarBottom {
          margin-top: auto;
          padding: 15px;
        }

        .adminBadge {
          display: flex;
          align-items: center;
          gap: 9px;
          background: rgba(255,255,255,0.06);
          padding: 10px;
          border-radius: 10px;
        }

        .adminAvatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #0a9e4c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
        }

        .adminBadge strong {
          display: block;
          font-size: 10px;
        }

        .adminBadge small {
          display: block;
          margin-top: 3px;
          font-size: 8px;
          color: #9eb4ab;
        }

        .dashboardContent {
          width: calc(100% - 235px);
          margin-left: 235px;
          padding: 28px;
        }

        .topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .eyebrow,
        .sectionLabel {
          margin: 0 0 6px;
          color: #0a9e4c;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.4px;
        }

        .topbar h2 {
          margin: 0;
          font-size: 28px;
          color: #17362c;
        }

        .topbarDescription {
          margin: 7px 0 0;
          color: #718078;
          font-size: 11px;
        }

        button {
          font-family: inherit;
          cursor: pointer;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .refreshButton,
        .smallRefreshButton {
          border: none;
          background: #0a9e4c;
          color: white;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 10px;
          font-weight: 800;
        }

        .refreshButton:hover,
        .smallRefreshButton:hover {
          background: #087e3d;
        }

        .message {
          padding: 11px 14px;
          border-radius: 9px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 11px;
          font-weight: 700;
        }

        .message.success {
          background: #e8f8ee;
          color: #087c3c;
        }

        .message.error {
          background: #ffeded;
          color: #c73636;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 14px;
        }

        .statCard {
          background: white;
          border: 1px solid #e4ebe7;
          border-radius: 12px;
          padding: 17px;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .statIcon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          background: #e7f7ed;
          color: #0a9e4c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
        }

        .statCard.orange .statIcon {
          background: #fff1df;
          color: #df741e;
        }

        .statCard.blue .statIcon {
          background: #e8f1ff;
          color: #3172c7;
        }

        .statCard.purple .statIcon {
          background: #f0eaff;
          color: #7352c5;
        }

        .statCard span,
        .financeCard span {
          display: block;
          color: #77847e;
          font-size: 9px;
          font-weight: 700;
        }

        .statCard strong {
          display: block;
          color: #17362c;
          font-size: 22px;
          margin-top: 3px;
        }

        .statCard small,
        .financeCard small {
          color: #98a39e;
          font-size: 8px;
        }

        .financialGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 22px;
        }

        .financeCard {
          background: white;
          border: 1px solid #e4ebe7;
          border-radius: 12px;
          padding: 17px;
        }

        .financeCard strong {
          display: block;
          margin: 5px 0 2px;
          font-size: 20px;
          color: #17362c;
        }

        .financeCard.highlight {
          background: #eaf8ef;
          border-color: #cfeedd;
        }

        .panel {
          background: white;
          border: 1px solid #e4ebe7;
          border-radius: 13px;
          margin-bottom: 22px;
          overflow: hidden;
        }

        .panelHeader {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          border-bottom: 1px solid #edf1ef;
        }

        .panelHeader h2 {
          margin: 0;
          font-size: 18px;
          color: #17362c;
        }

        .panelHeader p:not(.sectionLabel) {
          margin: 5px 0 0;
          color: #7d8984;
          font-size: 10px;
        }

        .requestCount {
          color: #8a9690;
          font-size: 9px;
        }

        .filters {
          padding: 13px 20px;
          display: flex;
          gap: 10px;
          border-bottom: 1px solid #edf1ef;
        }

        .searchBox {
          flex: 1;
          max-width: 380px;
          display: flex;
          align-items: center;
          gap: 7px;
          border: 1px solid #dde6e1;
          border-radius: 8px;
          padding: 0 10px;
        }

        .searchBox input {
          width: 100%;
          border: none;
          outline: none;
          padding: 9px 0;
          font-size: 10px;
        }

        .filters select {
          border: 1px solid #dde6e1;
          border-radius: 8px;
          padding: 0 10px;
          background: white;
          color: #46554e;
          font-size: 10px;
          outline: none;
        }

        .tableWrapper {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        th {
          background: #f8faf9;
          color: #7c8983;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          text-align: left;
          padding: 11px 14px;
          white-space: nowrap;
        }

        td {
          padding: 13px 14px;
          border-top: 1px solid #eef2f0;
          color: #45534d;
          font-size: 10px;
          vertical-align: middle;
        }

        tbody tr:hover {
          background: #fbfdfc;
        }

        .requestNumber,
        .paymentId {
          color: #17362c;
          font-weight: 900;
        }

        .mutedText {
          display: block;
          margin-top: 3px;
          color: #9aa49f;
          font-size: 8px;
        }

        .customerCell {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .customerAvatar {
          width: 27px;
          height: 27px;
          border-radius: 8px;
          background: #e7f7ed;
          color: #0a9e4c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 900;
        }

        .itemTitle {
          display: block;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #273931;
        }

        .statusBadge,
        .paymentStatus,
        .messageStatus {
          display: inline-flex;
          align-items: center;
          padding: 6px 9px;
          border-radius: 20px;
          font-size: 8px;
          font-weight: 900;
          text-transform: capitalize;
          white-space: nowrap;
        }

        .statusBadge {
          background: #edf2ef;
          color: #5f6d66;
        }

        .statusBadge.pending {
          background: #fff1df;
          color: #d76d16;
        }

        .statusBadge.approved {
          background: #e8f1ff;
          color: #276bc6;
        }

        .statusBadge.purchased,
        .statusBadge.shipping {
          background: #e9f5ff;
          color: #2873a7;
        }

        .statusBadge.delivered,
        .statusBadge.completed {
          background: #e5f8ed;
          color: #087c3c;
        }

        .statusBadge.cancelled {
          background: #ffeded;
          color: #c73636;
        }

        .viewButton,
        .miniViewButton {
          border: 1px solid #cfe0d8;
          background: white;
          color: #0a8d45;
          border-radius: 7px;
          padding: 7px 10px;
          font-size: 9px;
          font-weight: 800;
        }

        .viewButton:hover,
        .miniViewButton:hover {
          background: #eaf8ef;
        }

        .emptyState {
          padding: 55px 20px;
          text-align: center;
        }

        .emptyIcon {
          font-size: 30px;
          margin-bottom: 10px;
        }

        .emptyState h3 {
          margin: 0;
          color: #263a31;
          font-size: 15px;
        }

        .emptyState p {
          color: #8a9690;
          font-size: 10px;
        }

        .loader {
          width: 30px;
          height: 30px;
          border: 3px solid #dce9e2;
          border-top-color: #0a9e4c;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .paymentPanel {
          margin-top: 22px;
        }

        .paymentSummary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 15px 20px;
        }

        .paymentSummaryCard {
          padding: 12px;
          border-radius: 10px;
          background: #f7faf8;
          border: 1px solid #e5ece8;
        }

        .paymentSummaryCard span {
          display: block;
          color: #78857f;
          font-size: 8px;
          font-weight: 800;
        }

        .paymentSummaryCard strong {
          display: block;
          color: #17362c;
          font-size: 19px;
          margin: 4px 0 2px;
        }

        .paymentSummaryCard small {
          color: #99a49f;
          font-size: 8px;
        }

        .pendingPayment {
          background: #fff8ef;
          border-color: #f5e1c6;
        }

        .verifiedPayment {
          background: #edf9f2;
          border-color: #d6eddf;
        }

        .totalPayment {
          background: #eef5ff;
          border-color: #dce8f8;
        }

        .paymentRequestCell small {
          display: block;
          margin: 3px 0 6px;
          color: #8b9691;
          font-size: 8px;
        }

        .phoneNumber {
          white-space: nowrap;
          color: #263b32;
        }

        .paymentAmount {
          color: #087c3c;
          white-space: nowrap;
        }

        .transactionCode {
          font-family: monospace;
          font-weight: 700;
          color: #34463d;
        }

        .paymentStatus.pending {
          background: #fff1df;
          color: #d76d16;
        }

        .paymentStatus.paid {
          background: #e5f8ed;
          color: #087c3c;
        }

        .paymentStatus.failed,
        .paymentStatus.cancelled {
          background: #ffeded;
          color: #c73636;
        }

        .verifiedDate {
          display: block;
          color: #0a9e4c;
          font-size: 7px;
          margin-top: 3px;
        }

        .verifyButton {
          border: none;
          background: #0a9e4c;
          color: white;
          padding: 8px 10px;
          border-radius: 7px;
          font-size: 8px;
          font-weight: 900;
          white-space: nowrap;
        }

        .verifyButton:hover {
          background: #087e3d;
        }

        .verifiedLabel {
          color: #087c3c;
          font-size: 9px;
          font-weight: 900;
        }

        .messagesPanel {
          margin-bottom: 40px;
        }

        .messageHeaderActions {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .messageCount {
          min-width: 92px;
          padding: 8px 11px;
          border-radius: 9px;
          background: #f5f8f7;
          border: 1px solid #e6ece9;
          text-align: center;
        }

        .messageCount strong {
          display: block;
          color: #17362c;
          font-size: 16px;
        }

        .messageCount span {
          display: block;
          color: #7d8984;
          font-size: 8px;
          font-weight: 800;
          margin-top: 2px;
        }

        .messageCount.unreadCount {
          background: #fff5e8;
          border-color: #f5dfc1;
        }

        .messageCount.unreadCount strong {
          color: #d46e17;
        }

        .messageTable {
          min-width: 1100px;
        }

        .messageSender {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 150px;
        }

        .messageAvatar {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #e7f7ed;
          color: #0a9e4c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .messageSender strong {
          display: block;
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .messageContact {
          min-width: 145px;
        }

        .messageContact span {
          display: block;
          color: #34433d;
          font-size: 10px;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .messageContact small {
          display: block;
          color: #8d9994;
          font-size: 9px;
          margin-top: 4px;
        }

        .messageSubject {
          display: block;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #25372f;
        }

        .messagePreview {
          margin: 0;
          max-width: 230px;
          color: #68766f;
          font-size: 10px;
          line-height: 1.5;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .messageStatus {
          background: #edf2ef;
          color: #5e6b65;
        }

        .messageStatus.new,
        .messageStatus.unread,
        .messageStatus.pending {
          background: #fff1df;
          color: #d76d16;
        }

        .messageStatus.read {
          background: #e7f1ff;
          color: #276bc6;
        }

        .messageStatus.resolved,
        .messageStatus.closed,
        .messageStatus.replied {
          background: #e5f8ed;
          color: #087c3c;
        }

        .messageFullText {
          white-space: pre-wrap;
          word-break: break-word;
        }

        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(8, 28, 22, 0.62);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow-y: auto;
        }

        .requestModal {
          width: min(850px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          background: white;
          border-radius: 15px;
          box-shadow: 0 25px 70px rgba(0,0,0,0.25);
        }

        .modalHeader {
          padding: 20px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid #edf1ef;
        }

        .modalHeader h2 {
          margin: 0;
          color: #17362c;
          font-size: 21px;
        }

        .modalHeader span {
          display: block;
          color: #929d98;
          font-size: 9px;
          margin-top: 4px;
        }

        .closeButton {
          border: none;
          background: #f1f5f3;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 21px;
          color: #52635b;
        }

        .modalBody {
          padding: 20px;
        }

        .requestInfoGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        .infoBox {
          padding: 12px;
          border-radius: 9px;
          background: #f7faf8;
          border: 1px solid #e6ede9;
        }

        .infoBox span {
          display: block;
          color: #8a9690;
          font-size: 8px;
          font-weight: 800;
          margin-bottom: 5px;
        }

        .infoBox strong {
          color: #2a3d34;
          font-size: 10px;
          word-break: break-word;
        }

        .detailSection {
          border-top: 1px solid #edf1ef;
          padding-top: 18px;
          margin-top: 18px;
        }

        .detailSection h3 {
          margin: 0 0 10px;
          color: #24382f;
          font-size: 13px;
        }

        .descriptionText {
          margin: 0;
          color: #596860;
          font-size: 11px;
          line-height: 1.7;
        }

        .productLink {
          display: inline-block;
          margin-top: 12px;
          color: #087c3c;
          font-size: 10px;
          font-weight: 800;
        }

        .productDetails {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 15px;
        }

        .productDetails > div {
          background: #f7faf8;
          border-radius: 8px;
          padding: 10px;
        }

        .productDetails span {
          display: block;
          color: #8c9792;
          font-size: 8px;
        }

        .productDetails strong {
          display: block;
          color: #304139;
          font-size: 10px;
          margin-top: 4px;
        }

        .instructionsBox {
          background: #fff8ec;
          border: 1px solid #f5e2c1;
          border-radius: 9px;
          padding: 12px;
          margin-top: 12px;
        }

        .instructionsBox span {
          color: #c96c18;
          font-size: 8px;
          font-weight: 900;
        }

        .instructionsBox p {
          color: #6f6251;
          font-size: 10px;
          line-height: 1.6;
          margin: 5px 0 0;
        }

        .editGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 11px;
        }

        .editGrid label,
        .notesField {
          display: block;
        }

        .editGrid label span,
        .notesField span {
          display: block;
          color: #66746d;
          font-size: 9px;
          font-weight: 800;
          margin-bottom: 5px;
        }

        .editGrid input,
        .editGrid select,
        .notesField textarea {
          width: 100%;
          border: 1px solid #dce6e1;
          border-radius: 8px;
          padding: 9px;
          outline: none;
          font-size: 10px;
          background: white;
        }

        .editGrid input:focus,
        .editGrid select:focus,
        .notesField textarea:focus {
          border-color: #0a9e4c;
        }

        .notesField {
          margin-top: 11px;
        }

        .notesField textarea {
          resize: vertical;
        }

        .calculationBox {
          margin-top: 18px;
          padding: 14px;
          background: #f4f9f6;
          border: 1px solid #dcebe3;
          border-radius: 10px;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
        }

        .calculationBox div {
          padding: 8px;
        }

        .calculationBox span {
          display: block;
          color: #84918b;
          font-size: 8px;
        }

        .calculationBox strong {
          display: block;
          color: #304139;
          font-size: 10px;
          margin-top: 4px;
        }

        .totalCalculation {
          background: #0a9e4c;
          border-radius: 8px;
        }

        .totalCalculation span,
        .totalCalculation strong {
          color: white;
        }

        .modalFooter {
          padding: 15px 20px;
          border-top: 1px solid #edf1ef;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .cancelButton,
        .saveButton {
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 10px;
          font-weight: 800;
        }

        .cancelButton {
          background: #edf2ef;
          color: #52635b;
        }

        .saveButton {
          background: #0a9e4c;
          color: white;
        }

        .saveButton:hover {
          background: #087e3d;
        }


        .commandGrid{display:grid;grid-template-columns:1.05fr 1fr;gap:16px;margin-bottom:18px}.commandCard{background:#fff;border:1px solid #e4ece8;border-radius:18px;box-shadow:0 12px 35px rgba(26,59,45,.06);overflow:hidden}.attentionCard{background:linear-gradient(135deg,#fff,#f4fbf6)}.commandHeading{display:flex;align-items:flex-start;justify-content:space-between;padding:20px 20px 12px}.commandHeading h3{margin:3px 0 0;color:#17362c;font-size:17px}.liveDot{font-size:8px;font-weight:900;color:#087c3c;background:#e5f8ed;padding:6px 9px;border-radius:20px}.liveDot:before{content:'';display:inline-block;width:6px;height:6px;background:#0a9e4c;border-radius:50%;margin-right:5px}.attentionList{padding:4px 12px 14px}.attentionList button{width:100%;display:grid;grid-template-columns:34px 1fr 20px;gap:11px;align-items:center;text-align:left;border:0;background:transparent;padding:12px 8px;border-radius:12px}.attentionList button:hover{background:#fff}.attentionIcon{width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-weight:900}.attentionIcon.orange{background:#fff0df;color:#d76d16}.attentionIcon.gold{background:#fff7df;color:#bd7b0d}.attentionIcon.blue{background:#eaf2ff;color:#276bc6}.attentionIcon.green{background:#e7f8ee;color:#087c3c}.attentionList strong{display:block;font-size:10px;color:#263a31}.attentionList small{display:block;color:#87938d;font-size:8px;margin-top:3px}.attentionList button>b{color:#0a9e4c}.pipeline{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;padding:8px 18px 16px}.pipelineStep{text-align:center;padding:11px 4px;border-radius:10px;background:#f7faf8}.pipelineStep strong{display:block;color:#17362c;font-size:17px}.pipelineStep span{display:block;margin-top:4px;color:#82908a;font-size:7px;text-transform:capitalize;overflow:hidden;text-overflow:ellipsis}.pipelineBar{display:flex;gap:2px;height:8px;margin:0 18px 20px;border-radius:99px;overflow:hidden;background:#edf2ef}.pipelineBar span{display:block;min-width:2px}.pipe_pending{background:#f0a34b}.pipe_approved{background:#5d8fd6}.pipe_purchased{background:#55a8d3}.pipe_shipping{background:#377fbd}.pipe_delivered{background:#41ad72}.pipe_completed{background:#087c3c}.pipe_cancelled{background:#c73636}.analyticsGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:18px 20px 20px}.analyticsCard{padding:16px;border-radius:14px;background:linear-gradient(135deg,#f8fbf9,#fff);border:1px solid #e4ece8}.analyticsCard span,.analyticsCard small{display:block;color:#7e8b85;font-size:8px}.analyticsCard strong{display:block;margin:7px 0 3px;color:#17362c;font-size:21px}.headerTools{display:flex;align-items:center;gap:8px}.customerSearch{width:250px}.customerContact span,.customerContact small{display:block;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.customerContact small{color:#89958f;margin-top:3px;font-size:8px}.miniMetric{display:inline-flex;min-width:27px;justify-content:center;padding:5px 8px;border-radius:15px;font-size:8px;font-weight:900}.activeMetric{background:#eef5ff;color:#276bc6}.completeMetric{background:#e7f8ee;color:#087c3c}.customerValue{color:#087c3c}.deliveryKpis{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.deliveryKpis span{background:#f6faf8;border:1px solid #e3ebe7;padding:7px 10px;border-radius:9px;font-size:8px;color:#718078}.deliveryKpis b{color:#17362c;font-size:12px;margin-right:3px}.deliveryBoard{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:0 20px 18px}.deliveryColumn{background:#f7faf8;border:1px solid #e3ebe7;border-radius:13px;padding:10px;min-height:150px}.deliveryColumnTitle{display:flex;align-items:center;gap:6px;padding:5px 4px 9px;border-bottom:1px solid #e3ebe7}.deliveryColumnTitle strong{font-size:8px;color:#53635b;flex:1}.deliveryColumnTitle b{font-size:9px;color:#087c3c;background:#e4f7eb;padding:4px 7px;border-radius:10px}.deliveryOrder{width:100%;text-align:left;border:1px solid #e4ebe8;background:#fff;margin-top:7px;border-radius:10px;padding:10px}.deliveryOrder:hover{border-color:#9fd2b4}.deliveryOrder strong,.deliveryOrder span,.deliveryOrder small,.deliveryOrder em{display:block}.deliveryOrder strong{font-size:9px;color:#17362c}.deliveryOrder span{font-size:9px;color:#53635b;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.deliveryOrder small{font-size:8px;color:#909b96;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.deliveryOrder em{font-style:normal;color:#087c3c;font-weight:900;font-size:9px;margin-top:6px}.columnEmpty{text-align:center;color:#9aa49f;font-size:9px;padding:35px 10px}.riderNotice{margin:0 20px 20px;padding:14px 16px;border:1px dashed #bcd9c8;background:#f2fbf5;border-radius:12px;display:flex;align-items:center;gap:12px}.riderNotice>span{font-size:24px}.riderNotice strong{font-size:10px;color:#17362c}.riderNotice p{font-size:8px;color:#73817a;margin:4px 0 0;line-height:1.5}.riderNotice div{flex:1}.riderNotice button{border:0;background:#0a9e4c;color:#fff;border-radius:8px;padding:9px 12px;font-size:8px;font-weight:900}

        @media (max-width: 1100px) {
          .statsGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .financialGrid { grid-template-columns: 1fr; }
          .commandGrid { grid-template-columns: 1fr; }
          .analyticsGrid { grid-template-columns: repeat(2,1fr); }
          .deliveryBoard { grid-template-columns: 1fr; }

          .paymentSummary {
            grid-template-columns: 1fr;
          }

          .calculationBox {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 800px) {
          .sidebar {
            width: 65px;
          }

          .brand {
            padding: 15px 12px;
            justify-content: center;
          }

          .brand > div:last-child,
          .navItem:not(.active)::after,
          .navItem b,
          .adminBadge > div:last-child {
            display: none;
          }

          .sidebarNav {
            padding: 15px 8px;
          }

          .navItem {
            justify-content: center;
            padding: 12px;
          }

          .dashboardContent {
            width: calc(100% - 65px);
            margin-left: 65px;
            padding: 18px;
          }

          .topbar {
            flex-direction: column;
          }

          .refreshButton {
            width: 100%;
          }

          .panelHeader { flex-direction: column; }
          .headerTools, .customerSearch { width: 100%; }
          .deliveryKpis { width:100%; justify-content:flex-start; }

          .messageHeaderActions {
            width: 100%;
            justify-content: flex-start;
          }

          .messageCount {
            flex: 1;
          }

          .messageHeaderActions .smallRefreshButton {
            width: 100%;
          }
        }

        @media (max-width: 600px) {
          .statsGrid { grid-template-columns: 1fr; }
          .analyticsGrid { grid-template-columns: 1fr; }
          .pipeline { grid-template-columns: repeat(2,1fr); }
          .riderNotice { align-items:flex-start; flex-wrap:wrap; }
          .riderNotice button { width:100%; }

          .requestInfoGrid,
          .editGrid,
          .productDetails {
            grid-template-columns: 1fr;
          }

          .calculationBox {
            grid-template-columns: repeat(2, 1fr);
          }

          .filters {
            flex-direction: column;
          }

          .searchBox {
            max-width: none;
          }

          .filters select {
            height: 35px;
          }

          .dashboardContent {
            padding: 12px;
          }

          .topbar h2 {
            font-size: 23px;
          }
        }
      `}</style>
    </main>
  );
}