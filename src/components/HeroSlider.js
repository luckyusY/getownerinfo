"use client";

import Image from "next/image";
import Link from "next/link";
import { Autoplay, Pagination, Navigation, A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ArrowRight, BadgeCheck, MapPin, ShieldCheck } from "lucide-react";

const SLIDES = [
  {
    label: "Verified property",
    title: "Kagarama family house with balcony",
    body: "A polished direct-owner listing experience for serious buyers: clear photos, public details first, and protected contact unlock.",
    href: "/listings?category=real-estate&location=Kagarama",
    cta: "View property",
    meta: "Kicukiro, Kagarama",
    price: "350M Rwf",
    kicker: "Exclusive owner",
    accent: "#15b0dd",
    images: [
      "/sample-properties/kagarama-balcony.jfif",
      "/sample-properties/kagarama-room.jfif",
      "/sample-properties/kagarama-house.jfif",
    ],
  },
  {
    label: "Land opportunity",
    title: "Kinigi plot near hotel corridor",
    body: "Mountain-side development land with strong location context, clean listing details, and exact contact revealed only after token unlock.",
    href: "/listings?category=real-estate&location=Kinigi",
    cta: "Explore plot",
    meta: "Kinigi, Musanze",
    price: "100M Rwf",
    kicker: "1,800 sqm",
    accent: "#f4a300",
    images: ["/sample-properties/kinigi-plot.jfif", "/sample-properties/kinigi-mountain.jfif"],
  },
  {
    label: "Vehicles & assets",
    title: "Verified assets without broker noise",
    body: "Cars, pickups, homes, plots, and business assets in one trusted flow built for direct owner conversations.",
    href: "/listings?category=vehicles",
    cta: "Browse assets",
    meta: "Kigali",
    price: "From 20M Rwf",
    kicker: "Verified photos",
    accent: "#f4a300",
    images: [
      "/sample-properties/changan-pickup.jfif",
      "/sample-properties/kia-niro-exterior.jfif",
      "/sample-properties/kia-niro-interior.jfif",
    ],
  },
];

export default function HeroSlider() {
  return (
    <section className="hero-swiper relative isolate overflow-hidden border-b border-[#8b641e] bg-white">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, A11y]}
        loop={SLIDES.length > 1}
        speed={650}
        autoplay={{ delay: 7000, pauseOnMouseEnter: true, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        className="h-[clamp(300px,32.94vw,450px)]"
      >
        {SLIDES.map((slide, index) => (
          <SwiperSlide key={`${slide.title}-${index}`}>
            <SlideContent slide={slide} priority={index === 0} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

function SlideContent({ slide, priority }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#042f34] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(21,176,221,0.34),transparent_32%),radial-gradient(circle_at_62%_90%,rgba(244,163,0,0.22),transparent_28%)]" />
      <div className="relative mx-auto grid h-full max-w-7xl grid-cols-1 items-center gap-4 px-5 py-7 sm:grid-cols-[0.95fr_1.05fr] sm:px-12 lg:px-20">
        <div className="z-10 max-w-xl">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide text-ink"
            style={{ backgroundColor: slide.accent }}
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            {slide.label}
          </span>
          <h1 className="mt-3 max-w-[11ch] font-display text-[clamp(2rem,4.35vw,4.65rem)] font-black leading-[0.96] text-white">
            {slide.title}
          </h1>
          <p className="mt-3 max-w-lg text-sm font-semibold leading-6 text-white/86 sm:text-base">
            {slide.body}
          </p>

          <div className="mt-4 grid max-w-md grid-cols-2 gap-3">
            <InfoBox label="Price" value={slide.price} />
            <InfoBox label="Location" value={slide.meta} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={slide.href}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-5 text-sm font-black uppercase text-ink shadow-[0_3px_0_rgba(0,0,0,0.18)] transition hover:brightness-105"
              style={{ backgroundColor: slide.accent }}
            >
              {slide.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-white/78">
              <ShieldCheck className="h-4 w-4 text-white" />
              Public details first
            </span>
          </div>
        </div>

        <Link href={slide.href} aria-label={slide.title} className="relative z-10 hidden h-[82%] min-h-0 sm:block">
          <div className="absolute left-[4%] top-[2%] h-[74%] w-[72%] overflow-hidden rounded-[22px] border-[10px] border-white bg-white shadow-[0_28px_70px_rgba(0,0,0,0.28)]">
            <Image src={slide.images[0]} alt="" fill priority={priority} sizes="50vw" className="object-cover" />
          </div>
          <div className="absolute bottom-[6%] right-[4%] h-[42%] w-[42%] overflow-hidden rounded-[18px] border-[8px] border-white bg-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
            <Image src={slide.images[1] || slide.images[0]} alt="" fill priority={priority} sizes="28vw" className="object-cover" />
          </div>
          <div className="absolute bottom-[9%] left-[1%] inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-ink shadow-soft">
            <MapPin className="h-4 w-4 text-brand" />
            {slide.kicker}
          </div>
        </Link>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 text-ink shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
      <p className="text-[11px] font-black uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-0.5 truncate text-xl font-black leading-none">{value}</p>
    </div>
  );
}
