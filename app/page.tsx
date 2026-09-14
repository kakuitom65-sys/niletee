import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    name: "Tech & Electronics",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Fashion & Shoes",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Beauty & Self Care",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Room Essentials",
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Books & Stationery",
    image:
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Accessories",
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=85",
  },
];

const reviews = [
  {
    name: "University Student",
    text: "I sent NILETEE a photo of what I wanted and they handled the sourcing for me. The process was really simple.",
    rating: 5,
  },
  {
    name: "Happy Customer",
    text: "What I like most is that I don't have to search through different shops myself. I just tell them what I need.",
    rating: 5,
  },
  {
    name: "NILETEE Customer",
    text: "The payment process is clear because the item cost and delivery charges are handled separately.",
    rating: 5,
  },
];

const requestDetails = [
  "Product description",
  "Photo of the item",
  "Product link",
  "Size & colour",
  "Quantity",
  "Special instructions",
];

const processSteps = [
  {
    number: "01",
    title: "Submit",
    text: "Tell us what you want and provide any useful details.",
  },
  {
    number: "02",
    title: "Confirm",
    text: "We find the item and confirm the purchase amount.",
  },
  {
    number: "03",
    title: "Purchase",
    text: "You pay the item amount and we purchase it for you.",
  },
  {
    number: "04",
    title: "Deliver",
    text: "When ready, you pay delivery and service charges separately.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f2e8] text-[#163d2d]">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-[#ded5c5] bg-[#f7f2e8]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.jpeg"
              alt="NILETEE"
              width={150}
              height={55}
              className="h-auto max-h-12 w-auto object-contain"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex">
            <a href="#home" className="transition hover:text-[#d47b35]">
              Home
            </a>

            <a
              href="#how-it-works"
              className="transition hover:text-[#d47b35]"
            >
              How It Works
            </a>

            <a
              href="#categories"
              className="transition hover:text-[#d47b35]"
            >
              Categories
            </a>

            <a
              href="#reviews"
              className="transition hover:text-[#d47b35]"
            >
              Reviews
            </a>
          </nav>

          {/* RIGHT SIDE NAVIGATION */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* CUSTOMER PORTAL */}
            <Link
              href="/login"
              className="hidden rounded-full border-2 border-[#163d2d] px-4 py-3 text-sm font-bold text-[#163d2d] transition hover:bg-[#163d2d] hover:text-white sm:inline-flex"
            >
              <span className="mr-1">👤</span>
              Customer Portal
            </Link>

            {/* MOBILE CUSTOMER PORTAL */}
            <Link
              href="/login"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#163d2d] text-lg transition hover:bg-[#163d2d] hover:text-white sm:hidden"
              aria-label="Customer Portal"
              title="Customer Portal"
            >
              👤
            </Link>

            {/* REQUEST BUTTON */}
            <Link
              href="/request"
              className="rounded-full bg-[#163d2d] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#245541]"
            >
              <span className="hidden sm:inline">Request Anything</span>
              <span className="sm:hidden">Request</span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        id="home"
        className="px-5 pb-16 pt-12 sm:px-8 md:pb-24 md:pt-20"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#e9ddc8] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#163d2d]">
              <span className="h-2 w-2 rounded-full bg-[#d47b35]" />
              Your personal sourcing service
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Need it?
              <br />
              <span className="text-[#d47b35]">NILETEE it.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-[#5e6b62] sm:text-lg">
              Anything you need. We find it, buy it and bring it to you.
              Whether it is something you saw online, something you need for
              school, or something you simply cannot find nearby — just ask.
            </p>

            {/* HERO BUTTONS */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/request"
                className="rounded-full bg-[#163d2d] px-7 py-4 text-center font-bold text-white shadow-lg shadow-[#163d2d]/10 transition hover:-translate-y-1 hover:bg-[#245541]"
              >
                Tell us what you need →
              </Link>

              <Link
                href="/login"
                className="rounded-full border-2 border-[#163d2d] px-7 py-4 text-center font-bold transition hover:bg-[#163d2d] hover:text-white"
              >
                👤 Customer Portal
              </Link>
            </div>

            {/* EXISTING CUSTOMER MESSAGE */}
            <div className="mt-5">
              <p className="text-sm text-[#68736b]">
                Already have a NILETEE account?{" "}
                <Link
                  href="/login"
                  className="font-black text-[#d47b35] underline underline-offset-4 transition hover:text-[#bd6829]"
                >
                  Sign in to your portal
                </Link>
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#647169]">
              <span>✓ Any product</span>
              <span>✓ Simple requests</span>
              <span>✓ Clear payments</span>
            </div>
          </div>

          {/* HERO IMAGE */}
          <div className="relative">
            <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-[#e5b173]/50 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white p-2 shadow-2xl">
              <div className="relative h-[430px] overflow-hidden rounded-[1.6rem] sm:h-[520px]">
                <Image
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=90"
                  alt="Customer shopping online"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />

                <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 p-5 shadow-xl backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#d47b35]">
                        Your request
                      </p>

                      <p className="mt-1 font-black">
                        You tell us. We find it.
                      </p>
                    </div>

                    <div className="rounded-full bg-[#163d2d] px-3 py-2 text-xs font-bold text-white">
                      NILETEE
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GREEN TRUST STRIP */}
      <section className="px-5 py-5 sm:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-[#163d2d] text-white md:grid-cols-3">
          <div className="p-7 md:p-8">
            <p className="text-3xl font-black">01</p>

            <p className="mt-2 font-bold">Tell us what you need</p>

            <p className="mt-2 text-sm leading-6 text-[#d6e1da]">
              Describe it, upload a photo or send a product link.
            </p>
          </div>

          <div className="border-white/10 p-7 md:border-x md:p-8">
            <p className="text-3xl font-black">02</p>

            <p className="mt-2 font-bold">We find & confirm</p>

            <p className="mt-2 text-sm leading-6 text-[#d6e1da]">
              We source the item and confirm the purchase amount with you.
            </p>
          </div>

          <div className="p-7 md:p-8">
            <p className="text-3xl font-black">03</p>

            <p className="mt-2 font-bold">We bring it to you</p>

            <p className="mt-2 text-sm leading-6 text-[#d6e1da]">
              Once ready, delivery and service charges are handled separately.
            </p>
          </div>
        </div>
      </section>

      {/* REQUEST ANYTHING */}
      <section className="px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#d47b35]">
              No complicated catalogue
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              If you can describe it, you can NILETEE it.
            </h2>

            <p className="mt-6 max-w-xl leading-8 text-[#68736b]">
              You don't have to search through our catalogue. Tell us exactly
              what you want and give us as much information as you have.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {requestDetails.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#ded5c5] bg-white p-4 text-sm font-bold shadow-sm"
                >
                  <span className="mr-2 text-[#d47b35]">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-[#e3dacb] sm:p-7">
            <div className="rounded-[1.5rem] bg-[#f8f5ee] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#d47b35]">
                    New request
                  </p>

                  <h3 className="mt-2 text-2xl font-black">
                    What are you looking for?
                  </h3>
                </div>

                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#163d2d] text-xl text-white sm:flex">
                  +
                </div>
              </div>

              <div className="mt-6 rounded-2xl border-2 border-dashed border-[#d5ccbd] bg-white p-5">
                <p className="text-sm leading-6 text-[#7a847c]">
                  Example: “I need black Nike Air Force 1, size 39. Here is the
                  link...”
                </p>

                <div className="mt-5 h-24 rounded-xl bg-[#f7f2e8] p-4 text-sm text-[#9a9f9b]">
                  Describe your request here...
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#e9ddc8] px-3 py-2 text-xs font-bold">
                    Photo
                  </span>

                  <span className="rounded-full bg-[#e9ddc8] px-3 py-2 text-xs font-bold">
                    Product link
                  </span>

                  <span className="rounded-full bg-[#e9ddc8] px-3 py-2 text-xs font-bold">
                    Quantity
                  </span>
                </div>
              </div>

              <Link
                href="/request"
                className="mt-5 block rounded-2xl bg-[#d47b35] px-5 py-4 text-center font-black text-white transition hover:bg-[#bd6829]"
              >
                Start my request →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section
        id="categories"
        className="bg-white px-5 py-20 sm:px-8 md:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#d47b35]">
              Popular requests
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Whatever you're looking for.
            </h2>

            <p className="mt-5 leading-8 text-[#68736b]">
              These categories are only examples. NILETEE is built for
              requests that go beyond a normal online catalogue.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                href="/request"
                key={category.name}
                className="group overflow-hidden rounded-[1.5rem] bg-[#f7f2e8] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  <h3 className="absolute bottom-5 left-5 right-5 text-xl font-black text-white">
                    {category.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between p-5">
                  <span className="text-sm font-semibold text-[#69746d]">
                    Request this →
                  </span>

                  <span className="font-black text-[#d47b35]">+</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] bg-[#163d2d] p-7 text-white sm:p-9">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xl font-black">
                  Can't see what you need?
                </p>

                <p className="mt-2 text-sm leading-6 text-[#d6e1da]">
                  That's exactly why NILETEE lets you request anything.
                </p>
              </div>

              <Link
                href="/request"
                className="rounded-full bg-[#e5b173] px-6 py-3 text-center font-black text-[#163d2d] transition hover:bg-[#f0c58e]"
              >
                Request something else
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#d47b35]">
              Simple from start to finish
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              How NILETEE works
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {processSteps.map((step) => (
              <div
                key={step.number}
                className="rounded-[1.5rem] border border-[#ded5c5] bg-white p-7 shadow-sm"
              >
                <span className="text-sm font-black text-[#d47b35]">
                  {step.number}
                </span>

                <h3 className="mt-5 text-xl font-black">{step.title}</h3>

                <p className="mt-3 text-sm leading-7 text-[#68736b]">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAYMENT SECTION */}
      <section id="payments" className="px-5 py-10 sm:px-8 md:py-16">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#163d2d] text-white">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-12 lg:p-16">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#e5b173]">
                Transparent payments
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                No confusing charges.
              </h2>

              <p className="mt-6 max-w-xl leading-8 text-[#d5e0d9]">
                Your item purchase and delivery costs are separated so you can
                clearly understand what you are paying for at every stage.
              </p>
            </div>

            <div className="bg-[#1d4a37] p-8 sm:p-12 lg:p-16">
              <div className="border-b border-white/15 pb-7">
                <p className="text-xs font-black uppercase tracking-widest text-[#e5b173]">
                  First payment
                </p>

                <h3 className="mt-3 text-2xl font-black">
                  Item purchase amount
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#d5e0d9]">
                  Paid first so NILETEE can purchase your requested item.
                </p>
              </div>

              <div className="pt-7">
                <p className="text-xs font-black uppercase tracking-widest text-[#e5b173]">
                  Later
                </p>

                <h3 className="mt-3 text-2xl font-black">
                  Delivery + service fee
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#d5e0d9]">
                  Paid separately once your item is ready for delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section
        id="reviews"
        className="bg-[#f7f2e8] px-5 py-20 sm:px-8 md:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#d47b35]">
                Customer reviews
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                People tell us what they need.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-[#68736b]">
              Real customer reviews will appear here as NILETEE grows.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {reviews.map((review, reviewIndex) => (
              <div
                key={`${review.name}-${reviewIndex}`}
                className="rounded-[1.75rem] bg-white p-7 shadow-sm ring-1 ring-[#e2d8c8]"
              >
                <div
                  className="flex gap-1 text-[#d47b35]"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <span key={index}>★</span>
                  ))}
                </div>

                <p className="mt-6 text-[15px] leading-7 text-[#526057]">
                  “{review.text}”
                </p>

                <div className="mt-7 flex items-center gap-3 border-t border-[#eee7da] pt-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#163d2d] font-black text-white">
                    {review.name.charAt(0)}
                  </div>

                  <div>
                    <p className="text-sm font-black">{review.name}</p>

                    <p className="text-xs text-[#7b857e]">
                      NILETEE customer
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 py-16 sm:px-8 md:py-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-[#e5b173] px-7 py-14 text-center sm:px-12">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#163d2d]">
            Need something?
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-[#163d2d] sm:text-6xl">
            Need it? NILETEE it.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-8 text-[#355344]">
            Tell us what you need. We'll find it, buy it and bring it to you.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/request"
              className="rounded-full bg-[#163d2d] px-8 py-4 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#245541]"
            >
              Start a request →
            </Link>

            <Link
              href="/login"
              className="rounded-full border-2 border-[#163d2d] px-8 py-4 font-black text-[#163d2d] transition hover:bg-[#163d2d] hover:text-white"
            >
              👤 Customer Portal
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#ded5c5] bg-[#f7f2e8] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="inline-flex">
            <Image
              src="/logo.jpeg"
              alt="NILETEE"
              width={125}
              height={45}
              className="h-auto w-auto"
            />
          </Link>

          <p className="text-sm text-[#68736b]">
            Anything you need. We find it, buy it and bring it to you.
          </p>

          <div className="flex items-center gap-5">
            <Link
              href="/admin"
              className="text-sm font-bold text-[#68736b] transition hover:text-[#d47b35]"
            >
              Admin Portal
            </Link>

            <Link
              href="/login"
              className="text-sm font-bold text-[#163d2d] transition hover:text-[#d47b35]"
            >
              Customer Portal
            </Link>

            <p className="text-sm text-[#68736b]">
              © 2026 NILETEE
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}