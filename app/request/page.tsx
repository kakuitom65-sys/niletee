"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type PaymentStatus =
  | "idle"
  | "loading"
  | "pending"
  | "paid"
  | "failed";

export default function RequestPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [requestId, setRequestId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("idle");

  const [paymentMessage, setPaymentMessage] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [transactionCode, setTransactionCode] = useState("");

  const [paymentLoading, setPaymentLoading] = useState(false);

  /*
   * CHECK LOGIN SESSION
   */
  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          window.location.href = "/login";
          return;
        }

        if (mounted) {
          setUserId(user.id);
          setCheckingSession(false);
        }
      } catch (error) {
        console.error("Session check error:", error);

        if (mounted) {
          window.location.href = "/login";
        }
      }
    }

    checkUser();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * SUBMIT REQUEST
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setMessage(
        "Your login session could not be found. Please log in again."
      );
      return;
    }

    setMessage("");
    setLoading(true);

    setPaymentStatus("idle");
    setPaymentMessage("");

    setRequestId(null);

    setTransactionCode("");
    setPhoneNumber("");
    setPurchaseAmount("");

    const currentForm = event.currentTarget;
    const formData = new FormData(currentForm);

    const title = String(formData.get("title") || "").trim();

    const description = String(
      formData.get("description") || ""
    ).trim();

    const productLink = String(
      formData.get("productLink") || ""
    ).trim();

    const size = String(formData.get("size") || "").trim();

    const color = String(formData.get("color") || "").trim();

    const model = String(formData.get("model") || "").trim();

    const quantityValue = Number(
      formData.get("quantity") || 1
    );

    const quantity =
      Number.isFinite(quantityValue) && quantityValue > 0
        ? quantityValue
        : 1;

    const budgetValue = String(
      formData.get("budget") || ""
    ).trim();

    const deliveryLocation = String(
      formData.get("deliveryLocation") || ""
    ).trim();

    const additionalInstructions = String(
      formData.get("additionalInstructions") || ""
    ).trim();

    /*
     * REQUIRED FIELD VALIDATION
     */
    if (!title || !description || !deliveryLocation) {
      setMessage(
        "Please fill in the required fields: item name, description and delivery location."
      );

      setLoading(false);
      return;
    }

    /*
     * VALIDATE BUDGET
     */
    let budget: number | null = null;

    if (budgetValue) {
      const parsedBudget = Number(budgetValue);

      if (!Number.isFinite(parsedBudget) || parsedBudget < 0) {
        setMessage("Please enter a valid budget amount.");

        setLoading(false);
        return;
      }

      budget = parsedBudget;
    }

    /*
     * CREATE THE REQUEST ID OURSELVES
     *
     * This prevents the request submission from depending
     * on Supabase returning the inserted row.
     */
    const newRequestId = crypto.randomUUID();

    try {
      /*
       * INSERT REQUEST
       *
       * IMPORTANT:
       * We intentionally DO NOT use .select()
       * after the insert.
       */
      const { error: requestError } = await supabase
        .from("requests")
        .insert({
          id: newRequestId,

          customer_id: userId,

          title,

          description,

          product_link: productLink || null,

          size: size || null,

          color: color || null,

          model: model || null,

          quantity,

          budget,

          delivery_location: deliveryLocation,

          additional_instructions:
            additionalInstructions || null,
        });

      if (requestError) {
        console.error(
          "Request submission error:",
          requestError
        );

        setLoading(false);

        if (requestError.code === "42501") {
          setMessage(
            "NILETEE could not submit your request because your account is not currently allowed to create requests. Please log in again or contact support."
          );
        } else {
          setMessage(
            requestError.message ||
              "Unable to submit your request. Please try again."
          );
        }

        return;
      }

      /*
       * REQUEST WAS SUCCESSFULLY CREATED
       *
       * We already know the ID because we generated it above.
       */
      setRequestId(newRequestId);

      setLoading(false);

      setMessage(
        "Your request has been submitted successfully. NILETEE will review it and confirm the purchase amount before you make payment."
      );

      /*
       * Reset the form after successful submission.
       */
      try {
        currentForm.reset();
      } catch (resetError) {
        console.warn(
          "Form reset warning:",
          resetError
        );
      }
    } catch (error) {
      console.error(
        "Unexpected request submission error:",
        error
      );

      setLoading(false);

      setMessage(
        "Something went wrong while submitting your request. Please try again."
      );
    }
  }

  /*
   * SUBMIT MANUAL M-PESA PAYMENT
   */
  async function handlePayment() {
    if (!requestId) {
      setPaymentMessage(
        "Please submit your request first."
      );

      setPaymentStatus("failed");
      return;
    }

    if (!userId) {
      setPaymentMessage(
        "Your login session has expired. Please log in again."
      );

      setPaymentStatus("failed");
      return;
    }

    const cleanPhone = phoneNumber.trim();

    const cleanTransactionCode = transactionCode
      .trim()
      .toUpperCase();

    const amount = Number(purchaseAmount);

    /*
     * VALIDATE AMOUNT
     */
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentStatus("failed");

      setPaymentMessage(
        "Please enter the purchase amount confirmed by NILETEE."
      );

      return;
    }

    /*
     * VALIDATE PHONE
     */
    if (!cleanPhone) {
      setPaymentStatus("failed");

      setPaymentMessage(
        "Please enter the phone number you used to make the M-Pesa payment."
      );

      return;
    }

    /*
     * KENYAN PHONE VALIDATION
     *
     * Accepts:
     * 0712345678
     * 0112345678
     * +254712345678
     * 254712345678
     */
    const phoneRegex =
      /^(?:\+254|254|0)(7|1)\d{8}$/;

    const normalizedPhone = cleanPhone.replace(
      /[\s-]/g,
      ""
    );

    if (!phoneRegex.test(normalizedPhone)) {
      setPaymentStatus("failed");

      setPaymentMessage(
        "Please enter a valid Kenyan M-Pesa phone number."
      );

      return;
    }

    /*
     * VALIDATE TRANSACTION CODE
     */
    if (!cleanTransactionCode) {
      setPaymentStatus("failed");

      setPaymentMessage(
        "Please enter your M-Pesa transaction code."
      );

      return;
    }

    if (cleanTransactionCode.length < 6) {
      setPaymentStatus("failed");

      setPaymentMessage(
        "The M-Pesa transaction code appears to be too short. Please check your M-Pesa message."
      );

      return;
    }

    setPaymentLoading(true);
    setPaymentStatus("loading");

    setPaymentMessage(
      "Submitting your payment details..."
    );

    try {
      /*
       * CHECK LATEST PAYMENT
       */
      const {
        data: existingPayments,
        error: existingPaymentError,
      } = await supabase
        .from("payments")
        .select(
          "id, status, transaction_reference, amount"
        )
        .eq("request_id", requestId)
        .eq("customer_id", userId)
        .eq("payment_type", "purchase")
        .order("created_at", {
          ascending: false,
        })
        .limit(1);

      if (existingPaymentError) {
        console.error(
          "Existing payment check error:",
          existingPaymentError
        );

        setPaymentStatus("failed");

        setPaymentMessage(
          "We could not check your previous payment details. Please try again."
        );

        setPaymentLoading(false);

        return;
      }

      const latestPayment =
        existingPayments &&
        existingPayments.length > 0
          ? existingPayments[0]
          : null;

      /*
       * ALREADY PAID
       */
      if (latestPayment?.status === "paid") {
        setPaymentStatus("paid");

        setPaymentMessage(
          "This request already has a confirmed purchase payment."
        );

        setPaymentLoading(false);

        return;
      }

      /*
       * ALREADY PENDING
       */
      if (latestPayment?.status === "pending") {
        setPaymentStatus("pending");

        setPaymentMessage(
          "A payment for this request is already waiting for NILETEE verification."
        );

        setPaymentLoading(false);

        return;
      }

      /*
       * INSERT PAYMENT
       *
       * Payment code is kept intact because
       * you said the payment system is working.
       */
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          request_id: requestId,

          customer_id: userId,

          payment_type: "purchase",

          amount,

          status: "pending",

          payment_method: "mpesa",

          phone_number: normalizedPhone,

          transaction_reference:
            cleanTransactionCode,
        });

      if (paymentError) {
        console.error(
          "Payment submission error:",
          paymentError
        );

        setPaymentStatus("failed");

        if (paymentError.code === "42501") {
          setPaymentMessage(
            "You are not currently allowed to submit a payment for this request. Please make sure you are logged in and try again."
          );
        } else {
          setPaymentMessage(
            paymentError.message ||
              "Unable to submit your payment details. Please try again."
          );
        }

        setPaymentLoading(false);

        return;
      }

      /*
       * PAYMENT SUCCESS
       */
      setPaymentStatus("pending");

      setPaymentMessage(
        "Your M-Pesa transaction has been submitted successfully and is waiting for NILETEE verification."
      );

      setPaymentLoading(false);
    } catch (error) {
      console.error(
        "Unexpected payment error:",
        error
      );

      setPaymentStatus("failed");

      setPaymentMessage(
        "Something went wrong while submitting your payment. Please try again."
      );

      setPaymentLoading(false);
    }
  }

  /*
   * LOADING SCREEN
   */
  if (checkingSession) {
    return (
      <main className="loadingPage">
        <div className="loadingBox">
          <div className="spinner"></div>

          <h2>Loading NILETEE...</h2>

          <p>Checking your account.</p>
        </div>

        <style jsx>{`
          .loadingPage {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f3e8;
            color: #123d2b;
            font-family: Arial, sans-serif;
            padding: 20px;
          }

          .loadingBox {
            text-align: center;
          }

          .spinner {
            width: 38px;
            height: 38px;
            border: 4px solid #dcd4c5;
            border-top: 4px solid #123d2b;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 20px;
          }

          h2 {
            margin: 0 0 8px;
          }

          p {
            margin: 0;
            color: #6c746f;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <Link href="/">
            <img
              src="/logo.jpeg"
              alt="NILETEE"
              className="logo"
            />
          </Link>

          <Link
            href="/"
            className="backLink"
          >
            ← Back Home
          </Link>
        </header>

        <section className="hero">
          <p className="eyebrow">
            NEED IT? NILETEE IT.
          </p>

          <h1>Tell us what you need.</h1>

          <p className="heroText">
            Anything you need. Tell us
            what it is, add a link or
            details if you have them, and
            NILETEE will find it, buy it
            and bring it to you.
          </p>
        </section>

        <section className="formCard">
          <form onSubmit={handleSubmit}>
            <div className="grid">
              <div className="field">
                <label htmlFor="title">
                  What do you need? *
                </label>

                <input
                  id="title"
                  name="title"
                  placeholder="e.g. Nike Air Force 1"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="quantity">
                  Quantity *
                </label>

                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                />
              </div>

              <div className="field full">
                <label htmlFor="description">
                  Describe what you need *
                </label>

                <textarea
                  id="description"
                  name="description"
                  placeholder="Tell us exactly what you are looking for..."
                  rows={5}
                  required
                />
              </div>

              <div className="field full">
                <label htmlFor="productLink">
                  Product link
                </label>

                <input
                  id="productLink"
                  name="productLink"
                  type="url"
                  placeholder="Paste a link if you found the item online"
                />
              </div>

              <div className="field">
                <label htmlFor="size">
                  Size
                </label>

                <input
                  id="size"
                  name="size"
                  placeholder="e.g. Medium, Size 39"
                />
              </div>

              <div className="field">
                <label htmlFor="color">
                  Colour
                </label>

                <input
                  id="color"
                  name="color"
                  placeholder="e.g. Black"
                />
              </div>

              <div className="field">
                <label htmlFor="model">
                  Model / Brand
                </label>

                <input
                  id="model"
                  name="model"
                  placeholder="e.g. Samsung, Nike"
                />
              </div>

              <div className="field">
                <label htmlFor="budget">
                  Maximum budget (optional)
                </label>

                <input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="KES"
                />
              </div>

              <div className="field full">
                <label htmlFor="deliveryLocation">
                  Delivery location *
                </label>

                <input
                  id="deliveryLocation"
                  name="deliveryLocation"
                  placeholder="e.g. University of Embu, Main Campus"
                  required
                />
              </div>

              <div className="field full">
                <label htmlFor="additionalInstructions">
                  Additional instructions
                </label>

                <textarea
                  id="additionalInstructions"
                  name="additionalInstructions"
                  placeholder="Any other information we should know..."
                  rows={4}
                />
              </div>
            </div>

            {message && (
              <div className="message">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submitButton"
            >
              {loading
                ? "Submitting Request..."
                : "Submit My Request"}
            </button>
          </form>

          {requestId && (
            <section className="paymentCard">
              <div className="paymentHeader">
                <div>
                  <p className="paymentEyebrow">
                    PURCHASE PAYMENT
                  </p>

                  <h2>Pay for your item</h2>

                  <p>
                    NILETEE uses manual M-Pesa
                    verification. Send the
                    confirmed purchase amount
                    to the NILETEE M-Pesa number,
                    then submit your transaction
                    details below.
                  </p>
                </div>

                <div className="mpesaBadge">
                  M-PESA
                </div>
              </div>

              <div className="instructionBox">
                <div className="step">
                  <div className="stepNumber">
                    1
                  </div>

                  <div>
                    <strong>
                      Confirm the purchase amount
                    </strong>

                    <p>
                      Enter the amount confirmed
                      to you by NILETEE.
                    </p>
                  </div>
                </div>

                <div className="step">
                  <div className="stepNumber">
                    2
                  </div>

                  <div>
                    <strong>
                      Send the money through M-Pesa
                    </strong>

                    <p>
                      Use your M-Pesa menu or
                      M-Pesa App to send the
                      exact amount to the NILETEE
                      payment number provided by
                      NILETEE.
                    </p>
                  </div>
                </div>

                <div className="step">
                  <div className="stepNumber">
                    3
                  </div>

                  <div>
                    <strong>
                      Keep your M-Pesa message
                    </strong>

                    <p>
                      After payment, copy the
                      M-Pesa transaction code from
                      your confirmation message.
                    </p>
                  </div>
                </div>

                <div className="step">
                  <div className="stepNumber">
                    4
                  </div>

                  <div>
                    <strong>
                      Submit the transaction details
                    </strong>

                    <p>
                      Enter your phone number and
                      transaction code so NILETEE
                      can verify your payment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="paymentGrid">
                <div className="field">
                  <label htmlFor="purchaseAmount">
                    Confirmed purchase amount
                  </label>

                  <div className="amountInput">
                    <span>KES</span>

                    <input
                      id="purchaseAmount"
                      type="number"
                      min="1"
                      step="1"
                      value={purchaseAmount}
                      onChange={(event) =>
                        setPurchaseAmount(
                          event.target.value
                        )
                      }
                      placeholder="e.g. 2500"
                    />
                  </div>

                  <small>
                    Enter the amount confirmed
                    by NILETEE.
                  </small>
                </div>

                <div className="field">
                  <label htmlFor="phoneNumber">
                    M-Pesa phone number
                  </label>

                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) =>
                      setPhoneNumber(
                        event.target.value
                      )
                    }
                    placeholder="0712345678"
                    autoComplete="tel"
                  />

                  <small>
                    Enter the number you used
                    to make the M-Pesa payment.
                  </small>
                </div>

                <div className="field full">
                  <label htmlFor="transactionCode">
                    M-Pesa transaction code *
                  </label>

                  <input
                    id="transactionCode"
                    type="text"
                    value={transactionCode}
                    onChange={(event) =>
                      setTransactionCode(
                        event.target.value.toUpperCase()
                      )
                    }
                    placeholder="e.g. QGH7K82ABC"
                    autoComplete="off"
                  />

                  <small>
                    Enter the transaction code
                    exactly as shown in your
                    M-Pesa confirmation message.
                  </small>
                </div>
              </div>

              <div className="paymentNotice">
                <span className="noticeIcon">
                  🔒
                </span>

                <div>
                  <strong>
                    Manual payment verification
                  </strong>

                  <p>
                    NILETEE will verify your
                    transaction code, phone number
                    and payment amount before
                    marking the payment as received.
                  </p>
                </div>
              </div>

              {paymentMessage && (
                <div
                  className={`paymentMessage ${paymentStatus}`}
                >
                  {paymentStatus === "loading" && (
                    <span className="miniSpinner"></span>
                  )}

                  {paymentStatus === "pending" && (
                    <span className="statusIcon">
                      ⏳
                    </span>
                  )}

                  {paymentStatus === "paid" && (
                    <span className="statusIcon">
                      ✓
                    </span>
                  )}

                  {paymentStatus === "failed" && (
                    <span className="statusIcon">
                      !
                    </span>
                  )}

                  <span>{paymentMessage}</span>
                </div>
              )}

              {paymentStatus !== "paid" && (
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={
                    paymentLoading ||
                    paymentStatus === "pending"
                  }
                  className="mpesaButton"
                >
                  {paymentLoading
                    ? "Submitting Payment..."
                    : paymentStatus === "pending"
                    ? "Payment Awaiting Verification"
                    : "Submit M-Pesa Payment"}
                </button>
              )}

              {paymentStatus === "pending" && (
                <div className="pendingBox">
                  <div className="pendingIcon">
                    ⏳
                  </div>

                  <div>
                    <strong>
                      Payment Pending Verification
                    </strong>

                    <p>
                      Your transaction details
                      have been received. NILETEE
                      will verify the payment and
                      update your order status.
                    </p>
                  </div>
                </div>
              )}

              {paymentStatus === "paid" && (
                <div className="paidBox">
                  <div className="paidIcon">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Payment Received
                    </strong>

                    <p>
                      Your purchase payment has
                      been successfully confirmed.
                      NILETEE can now proceed with
                      purchasing your item.
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}
        </section>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f8f3e8;
          padding: 30px 20px 60px;
          font-family: Arial, sans-serif;
        }

        .container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 35px;
        }

        .logo {
          width: 130px;
          height: auto;
          border-radius: 12px;
        }

        .backLink {
          text-decoration: none;
          color: #123d2b;
          font-weight: 700;
        }

        .hero {
          background: #123d2b;
          color: white;
          border-radius: 28px;
          padding: 45px 30px;
          margin-bottom: 25px;
        }

        .eyebrow,
        .paymentEyebrow {
          color: #e6a04b;
          font-weight: 800;
          letter-spacing: 1px;
          margin: 0 0 10px;
        }

        h1 {
          font-size: clamp(32px, 5vw, 52px);
          line-height: 1.05;
          margin: 0 0 15px;
        }

        .heroText {
          max-width: 700px;
          font-size: 17px;
          line-height: 1.7;
          margin: 0;
          color: #f5efe3;
        }

        .formCard {
          background: white;
          border-radius: 28px;
          padding: 35px;
          box-shadow:
            0 15px 45px
            rgba(18, 61, 43, 0.08);
        }

        .grid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fit,
              minmax(250px, 1fr)
            );
          gap: 20px;
        }

        .field {
          min-width: 0;
        }

        .full {
          grid-column: 1 / -1;
        }

        label {
          display: block;
          margin-bottom: 8px;
          color: #123d2b;
          font-weight: 700;
        }

        input,
        textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #ddd5c6;
          border-radius: 12px;
          padding: 14px 15px;
          font-size: 15px;
          outline: none;
          background: #fffdf9;
          color: #222;
        }

        input:focus,
        textarea:focus {
          border-color: #123d2b;
          box-shadow:
            0 0 0 3px
            rgba(18, 61, 43, 0.08);
        }

        textarea {
          resize: vertical;
        }

        small {
          display: block;
          margin-top: 7px;
          color: #777;
          line-height: 1.4;
        }

        .message {
          margin-top: 25px;
          padding: 15px 18px;
          border-radius: 12px;
          background: #f1eadc;
          color: #123d2b;
          line-height: 1.5;
        }

        .submitButton {
          margin-top: 25px;
          width: 100%;
          padding: 17px 24px;
          border: none;
          border-radius: 14px;
          background: #123d2b;
          color: white;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
        }

        .submitButton:disabled {
          background: #789487;
          cursor: not-allowed;
        }

        .paymentCard {
          margin-top: 30px;
          border-radius: 24px;
          padding: 30px;
          background:
            linear-gradient(
              135deg,
              #123d2b,
              #1d5c40
            );
          color: white;
        }

        .paymentHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 25px;
        }

        .paymentHeader h2 {
          font-size: 28px;
          margin: 0 0 8px;
        }

        .paymentHeader p:not(.paymentEyebrow) {
          margin: 0;
          color: #e5eee8;
          line-height: 1.6;
          max-width: 650px;
        }

        .mpesaBadge {
          background: #e6a04b;
          color: #123d2b;
          padding: 12px 18px;
          border-radius: 12px;
          font-weight: 900;
          white-space: nowrap;
        }

        .instructionBox {
          display: grid;
          gap: 14px;
          margin-bottom: 25px;
        }

        .step {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 16px;
          border-radius: 14px;
          background:
            rgba(255, 255, 255, 0.08);
        }

        .stepNumber {
          width: 32px;
          height: 32px;
          min-width: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e6a04b;
          color: #123d2b;
          font-weight: 900;
        }

        .step strong {
          display: block;
          margin-bottom: 5px;
        }

        .step p {
          margin: 0;
          color: #dce9e2;
          line-height: 1.5;
        }

        .paymentGrid {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 20px;
        }

        .paymentGrid label {
          color: white;
        }

        .amountInput {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 12px;
          overflow: hidden;
        }

        .amountInput span {
          padding-left: 15px;
          color: #123d2b;
          font-weight: 800;
        }

        .amountInput input {
          border: none;
          background: white;
        }

        .amountInput input:focus {
          box-shadow: none;
        }

        .paymentNotice {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          margin-top: 25px;
          padding: 17px;
          border-radius: 14px;
          background:
            rgba(255, 255, 255, 0.1);
        }

        .noticeIcon {
          font-size: 22px;
        }

        .paymentNotice strong {
          display: block;
          margin-bottom: 4px;
        }

        .paymentNotice p {
          margin: 0;
          color: #dce9e2;
          line-height: 1.5;
        }

        .mpesaButton {
          width: 100%;
          margin-top: 22px;
          padding: 17px;
          border: none;
          border-radius: 13px;
          background: #e6a04b;
          color: #123d2b;
          font-size: 17px;
          font-weight: 900;
          cursor: pointer;
        }

        .mpesaButton:hover {
          transform: translateY(-1px);
        }

        .mpesaButton:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .paymentMessage {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
          padding: 15px;
          border-radius: 12px;
          line-height: 1.5;
        }

        .paymentMessage.loading,
        .paymentMessage.pending {
          background:
            rgba(255, 255, 255, 0.12);
        }

        .paymentMessage.paid {
          background: #d8f3df;
          color: #145c2f;
        }

        .paymentMessage.failed {
          background: #ffe0df;
          color: #8a2724;
        }

        .statusIcon {
          font-size: 20px;
          font-weight: 900;
        }

        .miniSpinner {
          width: 18px;
          height: 18px;
          border: 3px solid
            rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        .pendingBox {
          display: flex;
          gap: 15px;
          align-items: flex-start;
          margin-top: 22px;
          padding: 18px;
          border-radius: 14px;
          background: #fff3cd;
          color: #664d03;
        }

        .pendingIcon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e6a04b;
          color: #123d2b;
          font-weight: 900;
          flex-shrink: 0;
        }

        .pendingBox strong {
          display: block;
          margin-bottom: 5px;
        }

        .pendingBox p {
          margin: 0;
          line-height: 1.5;
        }

        .paidBox {
          display: flex;
          gap: 15px;
          align-items: flex-start;
          margin-top: 22px;
          padding: 18px;
          border-radius: 14px;
          background: #d8f3df;
          color: #145c2f;
        }

        .paidIcon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #1f7a3f;
          color: white;
          font-weight: 900;
          flex-shrink: 0;
        }

        .paidBox strong {
          display: block;
          margin-bottom: 5px;
        }

        .paidBox p {
          margin: 0;
          line-height: 1.5;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 650px) {
          .formCard {
            padding: 22px;
          }

          .hero {
            padding: 35px 25px;
          }

          .paymentCard {
            padding: 22px;
          }

          .paymentGrid {
            grid-template-columns: 1fr;
          }

          .paymentHeader {
            flex-direction: column;
          }

          .mpesaBadge {
            align-self: flex-start;
          }
        }
      `}</style>
    </main>
  );
}