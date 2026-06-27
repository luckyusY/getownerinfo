"use client";

import Link from "next/link";
import { Autoplay, Pagination, Navigation, A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    title: "Verified Kagarama house",
    href: "/listings?category=real-estate&location=Kagarama",
    image: "/hero-banners/verified-home-desktop.svg",
    mobileImage: "/hero-banners/verified-home-mobile.svg",
    tone: "light",
  },
  {
    title: "Kinigi plot near hotel activity",
    href: "/listings?category=real-estate&location=Kinigi",
    image: "/hero-banners/kinigi-plot-desktop.svg",
    mobileImage: "/hero-banners/kinigi-plot-mobile.svg",
    tone: "dark",
  },
  {
    title: "Verified vehicles and high-value assets",
    href: "/listings?category=vehicles",
    image: "/hero-banners/assets-vehicle-desktop.svg",
    mobileImage: "/hero-banners/assets-vehicle-mobile.svg",
    tone: "dark",
  },
];

export default function HeroSlider() {
  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-white">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, A11y]}
        loop={SLIDES.length > 1}
        speed={650}
        autoplay={{ delay: 7000, pauseOnMouseEnter: true, disableOnInteraction: false }}
        navigation={{ prevEl: ".hero-prev", nextEl: ".hero-next" }}
        pagination={{ clickable: true, el: ".hero-swiper-pagination" }}
        className="h-[clamp(320px,33.33vw,520px)]"
      >
        {SLIDES.map((slide, index) => (
          <SwiperSlide key={slide.title}>
            <Link
              href={slide.href}
              aria-label={slide.title}
              className={`absolute inset-0 block ${slide.tone === "dark" ? "bg-ink" : "bg-white"}`}
            >
              <img
                src={slide.image}
                alt=""
                loading={index === 0 ? "eager" : "lazy"}
                className="hidden h-full w-full object-contain object-center sm:block"
              />
              <img
                src={slide.mobileImage}
                alt=""
                loading={index === 0 ? "eager" : "lazy"}
                className="h-full w-full object-contain object-center sm:hidden"
              />
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

      <button
        type="button"
        className="hero-prev absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/35 bg-ink/35 text-white shadow-soft backdrop-blur transition hover:bg-white hover:text-ink md:grid"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        className="hero-next absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/35 bg-ink/35 text-white shadow-soft backdrop-blur transition hover:bg-white hover:text-ink md:grid"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="hero-swiper-pagination absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center gap-2" />
    </section>
  );
}
