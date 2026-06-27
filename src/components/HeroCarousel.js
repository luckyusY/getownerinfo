"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

function money(n) {
  return n == null ? "" : new Intl.NumberFormat("en-RW").format(n) + " Rwf";
}

export default function HeroCarousel({ slides = [] }) {
  if (slides.length === 0) return null;

  return (
    <section className="adorama-hero relative border-b border-line bg-white">
      <Swiper
        modules={[Autoplay, Navigation, Pagination, A11y]}
        loop={slides.length > 1}
        speed={600}
        autoplay={{ delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        navigation={{ prevEl: ".hero-prev", nextEl: ".hero-next" }}
        pagination={{ clickable: true }}
        className="h-[clamp(360px,38vw,460px)]"
      >
        {slides.map((s, i) => (
          <SwiperSlide key={i}>
            <div className="relative h-full w-full bg-gradient-to-r from-[#fdf0e6] via-[#eaf3fb] to-[#e6f7f3]">
              <div className="mx-auto grid h-full max-w-6xl grid-cols-1 items-center gap-6 px-6 sm:px-10 md:grid-cols-2">
                <div className="z-10">
                  {s.eyebrow && <p className="text-sm font-extrabold uppercase tracking-wide text-[#0b6c87]">{s.eyebrow}</p>}
                  <h2 className="mt-2 font-display text-3xl font-extrabold leading-[1.05] text-[#071c1f] sm:text-4xl lg:text-5xl">{s.title}</h2>
                  {s.body && <p className="mt-3 max-w-md text-sm text-[#071c1f]/75 sm:text-base">{s.body}</p>}
                  {s.price != null && <p className="mt-2 font-display text-2xl font-bold text-[#0b5f86]">{money(s.price)}</p>}
                  <Link href={s.href} className="mt-5 inline-flex items-center rounded-md bg-[#0b5f86] px-7 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-md transition hover:bg-[#094f6b]">
                    {s.ctaLabel || "Shop now"}
                  </Link>
                </div>
                <div className="relative hidden h-full items-center justify-center md:flex">
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image} alt={s.title} loading={i === 0 ? "eager" : "lazy"} className="max-h-[78%] w-auto rounded-xl object-cover shadow-2xl" />
                  ) : null}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Arrows */}
      <button className="hero-prev absolute left-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/70 text-[#071c1f] shadow-md backdrop-blur transition hover:bg-white" aria-label="Previous">
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button className="hero-next absolute right-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/70 text-[#071c1f] shadow-md backdrop-blur transition hover:bg-white" aria-label="Next">
        <ChevronRight className="h-6 w-6" />
      </button>
    </section>
  );
}
