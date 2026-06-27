"use client";

import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Navigation, Pagination } from "swiper/modules";

const SLIDES = [
  {
    title: "Kagarama family house with balcony",
    href: "/listings?category=real-estate&location=Kagarama",
    image: "/hero-banners/generated-kagarama-property.png",
    mobileImage: "/hero-banners/generated-kagarama-property.png",
    imageOnly: true,
    tone: "dark",
  },
  {
    title: "Kinigi plot near hotel corridor",
    href: "/listings?category=real-estate&location=Kinigi",
    image: "/hero-banners/generated-kinigi-plot.png",
    mobileImage: "/hero-banners/generated-kinigi-plot.png",
    imageOnly: true,
    tone: "dark",
  },
  {
    title: "Verified assets without broker noise",
    href: "/listings?category=vehicles",
    image: "/hero-banners/generated-assets-vehicles.png",
    mobileImage: "/hero-banners/generated-assets-vehicles.png",
    imageOnly: true,
    tone: "dark",
  },
];

export default function HeroSlider() {
  return (
    <section className="hero-swiper relative isolate overflow-hidden border-b border-[#8b641e] bg-white">
      <Swiper
        modules={[Autoplay, Navigation, Pagination, A11y]}
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
  const dark = slide.tone === "dark";
  const imageClass = slide.imageOnly
    ? "object-contain object-center"
    : "object-cover object-center";

  return (
    <Link
      href={slide.href}
      aria-label={slide.title}
      className={`absolute inset-0 block ${dark ? "bg-black" : "bg-white"}`}
    >
      <Image
        src={slide.image}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        className={`hidden ${imageClass} sm:block`}
      />
      <Image
        src={slide.mobileImage ?? slide.image}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        className="object-contain object-center sm:hidden"
      />
    </Link>
  );
}
