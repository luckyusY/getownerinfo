"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { BadgeCheck, ChevronDown, ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import HeroSearch from "@/components/HeroSearch";

const SLIDES = [
  {
    eyebrow: "Verified local listings",
    title: "Browse listings that look and feel real.",
    body: "Use verified property photos, clear prices, and protected owner contacts to move from browsing to a serious conversation.",
    image: "/sample-properties/kagarama-balcony.jfif",
    badge: "Kicukiro, Kagarama",
    metric: "350M Rwf",
  },
  {
    eyebrow: "Land and plots",
    title: "See the context before unlocking the owner.",
    body: "From Kinigi plots to city homes, inspect public details first and reveal exact contact only when you are ready.",
    image: "/sample-properties/kinigi-mountain.jfif",
    badge: "Kinigi, Musanze",
    metric: "1,800 sqm plot",
  },
  {
    eyebrow: "Vehicles and assets",
    title: "One marketplace for property and high-value assets.",
    body: "Cars, pickups, business assets, homes, and plots share the same verification and token-unlock workflow.",
    image: "/sample-properties/changan-pickup.jfif",
    badge: "Verified vehicle",
    metric: "57M Rwf",
  },
];

const copyVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.68, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } },
};

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const [swiper, setSwiper] = useState(null);
  const slide = SLIDES[active];

  return (
    <section className="relative isolate min-h-[calc(100svh-96px)] overflow-hidden bg-ink text-white">
      <Swiper
        modules={[Autoplay, EffectFade, Pagination]}
        effect="fade"
        loop
        speed={780}
        autoplay={{ delay: 5900, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ el: ".hero-swiper-pagination", clickable: true }}
        onSwiper={setSwiper}
        onSlideChange={(instance) => setActive(instance.realIndex)}
        className="absolute inset-0 h-full w-full"
      >
        {SLIDES.map((item) => (
          <SwiperSlide key={item.title}>
            <motion.img
              src={item.image}
              alt=""
              className="h-full w-full object-cover"
              initial={{ scale: 1.045 }}
              animate={{ scale: active >= 0 ? 1 : 1.045 }}
              transition={{ duration: 6.4, ease: "easeOut" }}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="absolute inset-0 z-10 bg-ink/48" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_42%,rgba(7,28,31,0.18),rgba(7,28,31,0.78)_72%)]" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-t from-paper via-paper/25 to-transparent" />

      <div className="relative z-20 mx-auto flex min-h-[calc(100svh-96px)] max-w-6xl flex-col items-center justify-center px-4 pb-24 pt-24 text-center sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.title}
            variants={copyVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -14, transition: { duration: 0.18 } }}
            className="w-full max-w-4xl"
          >
            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-2">
              <span className="badge bg-white/14 text-white ring-1 ring-white/24 backdrop-blur">
                <BadgeCheck className="h-3.5 w-3.5" /> {slide.eyebrow}
              </span>
              <span className="badge bg-brand text-white shadow-soft">
                <ShieldCheck className="h-3.5 w-3.5" /> {slide.badge}
              </span>
              <span className="badge bg-white/92 text-ink shadow-soft">{slide.metric}</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mx-auto mt-5 max-w-4xl text-balance font-display text-4xl font-black leading-[1.02] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.48)] sm:text-6xl lg:text-7xl"
            >
              {slide.title}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/88 drop-shadow sm:text-lg"
            >
              {slide.body}
            </motion.p>

            <motion.div variants={itemVariants} className="mx-auto max-w-3xl">
              <HeroSearch />
            </motion.div>

            <motion.div variants={itemVariants} className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/listings" className="btn-primary magnetic-link min-h-12 px-7 text-base">
                <Search className="h-4 w-4" /> Browse listings
              </Link>
              <Link href="/register" className="btn-outline magnetic-link min-h-12 border-white/35 bg-white/12 px-7 text-base text-white backdrop-blur hover:border-white hover:text-white">
                List your property
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <a
          href="#locations"
          aria-label="Scroll to popular locations"
          className="absolute bottom-14 hidden flex-col items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/76 transition hover:text-white md:flex"
        >
          Popular locations
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-white/14 backdrop-blur-sm transition hover:bg-white hover:text-ink">
            <ChevronDown className="h-4 w-4" />
          </span>
        </a>
      </div>

      <button
        type="button"
        aria-label="Previous hero slide"
        onClick={() => swiper?.slidePrev()}
        className="absolute left-4 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-sm transition hover:bg-white hover:text-ink md:grid"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Next hero slide"
        onClick={() => swiper?.slideNext()}
        className="absolute right-4 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-sm transition hover:bg-white hover:text-ink md:grid"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="hero-swiper-pagination absolute bottom-4 left-1/2 z-30 flex w-[min(320px,calc(100vw-32px))] -translate-x-1/2 items-center justify-center gap-2" />
    </section>
  );
}
