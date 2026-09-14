"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Unable to sign in.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      await supabase.auth.signOut();

      setError(
        "Access denied. This account does not have administrator privileges."
      );

      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="adminLoginPage">
      <div className="glow glowOne" />
      <div className="glow glowTwo" />

      <section className="loginCard">
        <div className="logoBox">
          <img src="/logo.jpeg" alt="NILETEE" />
        </div>

        <p className="eyebrow">NILETEE MANAGEMENT SYSTEM</p>

        <h1>Admin Portal</h1>

        <p className="subtitle">
          Sign in to manage orders, customers, payments, purchasing and
          deliveries.
        </p>

        {error && <div className="errorBox">{error}</div>}

        <form onSubmit={handleLogin}>
          <label htmlFor="email">Email Address</label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter admin email"
            required
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In to Admin Portal"}
          </button>
        </form>

        <div className="securityNote">
          🔒 Administrator access is restricted to authorized accounts.
        </div>

        <a href="/" className="backLink">
          ← Back to NILETEE website
        </a>
      </section>

      <style jsx>{`
        .adminLoginPage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at top left,
              rgba(0, 180, 140, 0.18),
              transparent 35%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(20, 100, 255, 0.2),
              transparent 35%
            ),
            #07111f;
        }

        .glow {
          position: absolute;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }

        .glowOne {
          top: -150px;
          left: -100px;
          background: rgba(0, 220, 170, 0.2);
        }

        .glowTwo {
          bottom: -150px;
          right: -100px;
          background: rgba(40, 110, 255, 0.2);
        }

        .loginCard {
          width: 100%;
          max-width: 480px;
          padding: 42px;
          position: relative;
          z-index: 2;
          border-radius: 28px;
          background: rgba(10, 23, 40, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(20px);
        }

        .logoBox {
          width: 82px;
          height: 82px;
          margin: 0 auto 20px;
          border-radius: 22px;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.15);
        }

        .logoBox img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .eyebrow {
          text-align: center;
          color: #32d6a2;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }

        h1 {
          color: white;
          text-align: center;
          font-size: 34px;
          margin: 0;
        }

        .subtitle {
          color: #9caec3;
          text-align: center;
          line-height: 1.6;
          margin: 14px 0 30px;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        label {
          color: #dbe7f4;
          font-size: 14px;
          font-weight: 700;
          margin-top: 8px;
        }

        input {
          width: 100%;
          box-sizing: border-box;
          padding: 15px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
          color: white;
          outline: none;
          font-size: 15px;
        }

        input:focus {
          border-color: #32d6a2;
          box-shadow: 0 0 0 3px rgba(50, 214, 162, 0.1);
        }

        input::placeholder {
          color: #718399;
        }

        button {
          margin-top: 18px;
          padding: 16px;
          border: none;
          border-radius: 13px;
          background: linear-gradient(135deg, #19c995, #1677ff);
          color: white;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }

        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(22, 119, 255, 0.25);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .errorBox {
          padding: 13px 15px;
          margin-bottom: 18px;
          border-radius: 12px;
          background: rgba(255, 70, 70, 0.1);
          border: 1px solid rgba(255, 70, 70, 0.25);
          color: #ff9a9a;
          font-size: 14px;
          line-height: 1.5;
        }

        .securityNote {
          margin-top: 24px;
          padding: 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          color: #8ea1b8;
          text-align: center;
          font-size: 13px;
        }

        .backLink {
          display: block;
          text-align: center;
          margin-top: 24px;
          color: #32d6a2;
          text-decoration: none;
          font-size: 14px;
        }

        .backLink:hover {
          text-decoration: underline;
        }

        @media (max-width: 520px) {
          .loginCard {
            padding: 30px 22px;
            border-radius: 22px;
          }

          h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </main>
  );
}