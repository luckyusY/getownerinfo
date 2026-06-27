"use client";

import Image from "next/image";
import Link from "next/link";
import { Autoplay, Pagination, Navigation, A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const SLIDES = [
  {
    title: "Verified Kagarama house",
    href: "/listings?category=real-estate&location=Kagarama",
    image: "/hero-banners/verified-home-desktop.svg",
    mobileImage: "/hero-banners/verified-home-mobile.svg",
    tone: "dark",
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
            <Link
              href={slide.href}
              aria-label={slide.title}
              className={`absolute inset-0 block ${slide.tone === "dark" ? "bg-black" : "bg-white"}`}
            >
              <Image
                src={slide.image}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="hidden h-full w-full object-contain object-center sm:block"
              />
              <Image
                src={slide.mobileImage}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="h-full w-full object-contain object-center sm:hidden"
              />
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
