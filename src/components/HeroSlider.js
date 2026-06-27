"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import HeroSearch from "@/components/HeroSearch";

const SLIDES = [
  {
    eyebrow: "Verified owner access",
    title: "Find the real owner. Skip the brokers.",
    body: "Browse verified property, vehicles, and assets across Rwanda. Unlock trusted owner details only when you are ready to move.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    badge: "Real Estate",
    metric: "Owner verified",
    href: "/listings?category=real-estate",
  },
  {
    eyebrow: "Direct vehicle deals",
    title: "Contact verified sellers without the runaround.",
    body: "Find cars, motorcycles, and business assets with clear listing details and protected owner information.",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=80",
    badge: "Vehicles",
    metric: "Token unlock",
    href: "/listings?category=vehicles",
  },
  {
    eyebrow: "Privacy built in",
    title: "Reveal exact contacts only after a secure unlock.",
    body: "getownerinfo keeps owner details private until a serious buyer pays the token fee and creates an access log.",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80",
    badge: "Protected",
    metric: "Access logged",
    href: "/register",
  },
];

const copyVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } },
};

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const [swiper, setSwiper] = useState(null);
  const slide = SLIDES[active];

  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="absolute inset-0">
        <Swiper
          modules={[Autoplay, EffectFade, Pagination]}
          effect="fade"
          loop
          speed={850}
          allowTouchMove={false}
          autoplay={{ delay: 6200, disableOnInteraction: false }}
          pagination={{ el: ".hero-swiper-pagination", clickable: true }}
          onSwiper={setSwiper}
          onSlideChange={(instance) => setActive(instance.realIndex)}
          className="h-full"
        >
          {SLIDES.map((item) => (
            <SwiperSlide key={item.title}>
              <motion.img
                src={item.image}
                alt=""
                className="h-full w-full object-cover"
                initial={{ scale: 1.06 }}
                animate={{ scale: active >= 0 ? 1 : 1.06 }}
                transition={{ duration: 6.2, ease: "linear" }}
              />
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-ink via-ink/78 to-ink/28" />
        <div className="absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-paper to-transparent" />
      </div>

      <div className="relative z-20 mx-auto grid min-h-[680px] max-w-6xl items-end gap-10 px-4 pb-12 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-16 lg:pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.title}
            variants={copyVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            className="max-w-3xl"
          >
            <motion.span variants={itemVariants} className="badge bg-white/10 text-white ring-1 ring-white/20">
              {slide.eyebrow}
            </motion.span>
            <motion.h1 variants={itemVariants} className="mt-5 max-w-3xl text-balance font-display text-4xl font-bold leading-[1.05] text-white sm:text-6xl">
              {slide.title}
            </motion.h1>
            <motion.p variants={itemVariants} className="mt-5 max-w-2xl text-base leading-relaxed text-white/82 sm:text-lg">
              {slide.body}
            </motion.p>
            <motion.div variants={itemVariants}>
              <HeroSearch />
            </motion.div>
            <motion.div variants={itemVariants} className="mt-6 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary magnetic-link px-6 py-3 text-base">List your property</Link>
              <Link href="/listings" className="btn-outline magnetic-link border-white/30 bg-white/10 px-6 py-3 text-base text-white hover:border-white hover:text-white">
                Browse listings
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <motion.div
          className="hidden lg:block"
          initial={{ opacity: 0, x: 32, rotate: 1 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="premium-hover ml-auto max-w-md rounded-xl border border-white/20 bg-white/10 p-4 shadow-lift backdrop-blur-md">
            <div className="overflow-hidden rounded-lg bg-white">
              <div className="relative aspect-[4/3]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={slide.image}
                    src={slide.image}
                    alt=""
                    className="h-full w-full object-cover"
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.45 }}
                  />
                </AnimatePresence>
                <div className="absolute left-3 top-3 flex gap-2">
                  <span className="badge bg-brand text-white">{slide.badge}</span>
                  <span className="badge bg-gold text-ink">{slide.metric}</span>
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Featured flow</p>
                <h3 className="mt-1 font-display text-xl font-bold text-ink">Unlock direct owner information</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Review the listing, pay the token fee, then use verified contact details to negotiate directly.
                </p>
                <Link href={slide.href} className="mt-4 inline-flex text-sm font-bold text-brand hover:text-brand-dark">
                  Explore this category
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-4 left-4 right-4 mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="hero-swiper-pagination flex flex-1 items-center gap-2" />
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" aria-label="Previous hero slide" onClick={() => swiper?.slidePrev()} className="hero-control">{"<"}</button>
            <button type="button" aria-label="Next hero slide" onClick={() => swiper?.slideNext()} className="hero-control">{">"}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
