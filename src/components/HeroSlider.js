"use client";

import Image from "next/image";
import Link from "next/link";
import { Autoplay, Pagination, Navigation, A11y } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const SLIDES = [
  {
    title: "Kagarama family house with balcony",
    href: "/listings?category=real-estate&location=Kagarama",
    image: "/hero-banners/generated-kagarama-property.png",
    mobileImage: "/hero-banners/generated-kagarama-property.png",
  },
  {
    title: "Kinigi plot near hotel corridor",
    href: "/listings?category=real-estate&location=Kinigi",
    image: "/hero-banners/generated-kinigi-plot.png",
    mobileImage: "/hero-banners/generated-kinigi-plot.png",
  },
  {
    title: "Verified assets without broker noise",
    href: "/listings?category=vehicles",
    image: "/hero-banners/generated-assets-vehicles.png",
    mobileImage: "/hero-banners/generated-assets-vehicles.png",
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
            <Link href={slide.href} aria-label={slide.title} className="absolute inset-0 block bg-[#042f34]">
              <Image
                src={slide.image}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="hidden object-contain object-center sm:block"
              />
              <Image
                src={slide.mobileImage}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-contain object-center sm:hidden"
              />
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
