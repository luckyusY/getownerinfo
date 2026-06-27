"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { BadgeCheck, Camera, ChevronLeft, ChevronRight, KeyRound, MapPin, ShieldCheck } from "lucide-react";
import HeroSearch from "@/components/HeroSearch";

const SLIDES = [
  {
    eyebrow: "Real local property examples",
    title: "Browse listings that look and feel real.",
    body: "Use verified property photos, clear prices, and protected owner contacts to move from browsing to a serious conversation.",
    image: "/sample-properties/kagarama-balcony.jfif",
    gallery: ["/sample-properties/kagarama-room.jfif", "/sample-properties/kagarama-house.jfif"],
    badge: "Kicukiro, Kagarama",
    metric: "350M Rwf",
    caption: "5 bedrooms, 5 bathrooms, parking for 4 cars",
    href: "/listings?category=real-estate",
  },
  {
    eyebrow: "Land and plots",
    title: "See the context before unlocking the owner.",
    body: "From Kinigi plots to city homes, buyers can inspect public listing details first and unlock exact contact only when ready.",
    image: "/sample-properties/kinigi-mountain.jfif",
    gallery: ["/sample-properties/kinigi-plot.jfif", "/sample-properties/kagarama-balcony.jfif"],
    badge: "Kinigi, Musanze",
    metric: "100M Rwf",
    caption: "1,800 sqm plot near hotel activity",
    href: "/listings?category=real-estate",
  },
  {
    eyebrow: "Vehicles and assets",
    title: "One marketplace for property and high-value assets.",
    body: "Cars, pickups, business assets, homes, and plots can share the same verification and token-unlock workflow.",
    image: "/sample-properties/changan-pickup.jfif",
    gallery: ["/sample-properties/kia-niro-exterior.jfif", "/sample-properties/kia-niro-interior.jfif"],
    badge: "Verified vehicle",
    metric: "57M Rwf",
    caption: "2024 Changan Hunter range extender EV",
    href: "/listings?category=vehicles",
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
          autoplay={{ delay: 6500, disableOnInteraction: false }}
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
                initial={{ scale: 1.04 }}
                animate={{ scale: active >= 0 ? 1 : 1.04 }}
                transition={{ duration: 6.5, ease: "linear" }}
              />
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(7,28,31,0.94),rgba(7,28,31,0.78)_43%,rgba(7,28,31,0.28))]" />
        <div className="absolute inset-x-0 bottom-0 z-10 h-36 bg-gradient-to-t from-paper to-transparent" />
      </div>

      <div className="relative z-20 mx-auto grid min-h-[700px] max-w-6xl items-end gap-10 px-4 pb-12 pt-16 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:pb-16 lg:pt-20">
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
              <BadgeCheck className="h-3.5 w-3.5" /> {slide.eyebrow}
            </motion.span>
            <motion.h1 variants={itemVariants} className="mt-5 max-w-3xl text-balance font-display text-4xl font-bold leading-[1.04] text-white sm:text-6xl">
              {slide.title}
            </motion.h1>
            <motion.p variants={itemVariants} className="mt-5 max-w-2xl text-base leading-relaxed text-white/84 sm:text-lg">
              {slide.body}
            </motion.p>
            <motion.div variants={itemVariants}>
              <HeroSearch />
            </motion.div>
            <motion.div variants={itemVariants} className="mt-6 flex flex-wrap gap-3">
              <Link href="/listings" className="btn-primary magnetic-link px-6 py-3 text-base">Browse listings</Link>
              <Link href="/register" className="btn-outline magnetic-link border-white/30 bg-white/10 px-6 py-3 text-base text-white hover:border-white hover:text-white">
                List your property
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <motion.div
          className="hidden lg:block"
          initial={{ opacity: 0, x: 34 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="ml-auto max-w-[440px] space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.image}
                className="overflow-hidden rounded-xl border border-white/20 bg-white shadow-lift"
                initial={{ opacity: 0, y: 22, rotate: 1.5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, y: -12, rotate: -1 }}
                transition={{ duration: 0.45 }}
              >
                <div className="relative aspect-[4/3]">
                  <img src={slide.image} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink/75 to-transparent" />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <span className="badge bg-brand text-white"><ShieldCheck className="h-3.5 w-3.5" /> Verified</span>
                    <span className="badge bg-white/92 text-ink"><Camera className="h-3.5 w-3.5" /> Real photos</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-white/78">{slide.badge}</p>
                    <p className="font-display text-2xl font-bold text-white">{slide.metric}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="inline-flex items-center gap-1.5 text-sm font-bold text-ink">
                    <MapPin className="h-4 w-4 text-brand" /> {slide.caption}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft line-clamp-2">
                    Public photos and summary stay visible. Exact owner contact is protected until token unlock.
                  </p>
                  <Link href={slide.href} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand hover:text-brand-dark">
                    Explore category <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
              {slide.gallery.map((image, index) => (
                <motion.div
                  key={`${slide.title}-${image}`}
                  className="overflow-hidden rounded-xl border border-white/20 bg-white/12 p-2 shadow-lift backdrop-blur"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.06, duration: 0.42 }}
                >
                  <img src={image} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
                </motion.div>
              ))}
              <div className="rounded-xl border border-white/18 bg-ink/72 p-3 text-sm shadow-lift backdrop-blur">
                <p className="inline-flex items-center gap-2 font-bold text-white"><KeyRound className="h-4 w-4 text-clay" /> Unlock</p>
                <p className="mt-1 max-w-28 text-xs leading-relaxed text-white/72">Private contact after token.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-4 left-4 right-4 mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="hero-swiper-pagination flex flex-1 items-center gap-2" />
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" aria-label="Previous hero slide" onClick={() => swiper?.slidePrev()} className="hero-control">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Next hero slide" onClick={() => swiper?.slideNext()} className="hero-control">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
