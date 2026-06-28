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
    <section className="adorama-hero relative border-b border-[#d5e2ee] bg-[#f4f8fb]">
      <Swiper
        modules={[Autoplay, Navigation, Pagination, A11y]}
        loop={slides.length > 1}
        speed={600}
        autoplay={{ delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        navigation={{ prevEl: ".hero-prev", nextEl: ".hero-next" }}
        pagination={{ clickable: true }}
        className="h-[clamp(360px,34vw,430px)]"
      >
        {slides.map((s, i) => (
          <SwiperSlide key={i}>
            {s.layout === "banner" ? (
              <div className="relative h-full w-full overflow-hidden bg-[#041c22]">
                {s.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.image}
                    alt=""
                    loading={i === 0 ? "eager" : "lazy"}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-[#02181d]/96 via-[#02181d]/78 to-[#02181d]/8" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#041c22]/50 to-transparent" />
                <div className="mx-auto flex h-full max-w-6xl items-center px-5 sm:px-8">
                  <div className="relative z-10 max-w-xl text-white">
                    {s.eyebrow && <p className="w-fit rounded-full bg-white/92 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#071c1f] shadow-sm">{s.eyebrow}</p>}
                    <h2 className="mt-3 font-display text-[clamp(2.2rem,4.2vw,4.75rem)] font-black leading-[0.92] text-white">{s.title}</h2>
                    {s.body && <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-white/78 sm:text-base">{s.body}</p>}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <span className="rounded-md border border-cyan-200/25 bg-white/10 px-5 py-3 shadow-md backdrop-blur">
                        <span className="block text-[10px] font-black uppercase tracking-wide text-cyan-100">{s.metaLabel || "Access"}</span>
                        <span className="font-display text-2xl font-black leading-none text-white">{s.metaValue || "Verified"}</span>
                      </span>
                    </div>
                    <Link href={s.href} className="mt-5 inline-flex items-center rounded-md bg-[#16a3cc] px-8 py-3 text-sm font-black uppercase tracking-wide text-white shadow-md transition hover:bg-[#0b8db4]">
                      {s.ctaLabel || "Shop now"}
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-full w-full overflow-hidden bg-[#f8fbf6]">
                <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_16%_22%,rgba(22,163,204,0.16),transparent_26%),radial-gradient(circle_at_84%_28%,rgba(11,95,134,0.14),transparent_27%),linear-gradient(135deg,rgba(21,176,221,0.10)_0,transparent_42%)]" />
                <div className="mx-auto grid h-full max-w-6xl grid-cols-1 items-center gap-6 px-5 sm:px-8 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="z-10 max-w-xl">
                    {s.eyebrow && <p className="w-fit rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#071c1f] shadow-sm">{s.eyebrow}</p>}
                    <h2 className="mt-3 font-display text-[clamp(2.25rem,4.2vw,4.8rem)] font-black leading-[0.92] text-[#071c1f]">{s.title}</h2>
                    {s.body && <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-[#071c1f]/72 sm:text-base">{s.body}</p>}
                    <div className="mt-5 flex flex-wrap gap-3">
                      {s.price != null && (
                        <span className="rounded-md bg-white px-5 py-3 shadow-md">
                          <span className="block text-[10px] font-black uppercase tracking-wide text-[#607280]">Price</span>
                          <span className="font-display text-2xl font-black leading-none text-[#071c1f]">{money(s.price)}</span>
                        </span>
                      )}
                      <span className="rounded-md bg-white px-5 py-3 shadow-md">
                        <span className="block text-[10px] font-black uppercase tracking-wide text-[#607280]">Access</span>
                        <span className="font-display text-2xl font-black leading-none text-[#071c1f]">Verified</span>
                      </span>
                    </div>
                    <Link href={s.href} className="mt-5 inline-flex items-center rounded-md bg-[#0b5f86] px-8 py-3 text-sm font-black uppercase tracking-wide text-white shadow-md transition hover:bg-[#094f6b]">
                      {s.ctaLabel || "Shop now"}
                    </Link>
                  </div>
                  <div className="relative hidden h-full items-center justify-center md:flex">
                    {s.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <div className="relative flex h-[78%] w-[82%] items-center justify-center">
                        <div className="absolute inset-3 rounded-[28px] bg-white shadow-2xl ring-1 ring-black/5" />
                        <img src={s.image} alt={s.title} loading={i === 0 ? "eager" : "lazy"} className="relative h-[88%] w-[86%] rounded-sm object-cover shadow-lg" />
                        <div className="absolute bottom-2 right-0 rounded-xl bg-white px-6 py-5 shadow-xl">
                          <p className="text-xs font-black text-[#071c1f]">Real listing photos</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Arrows */}
      <button className="hero-prev absolute left-0 top-1/2 z-20 grid h-14 w-10 -translate-y-1/2 place-items-center rounded-r-full bg-[#071c1f]/28 text-white shadow-md backdrop-blur transition hover:bg-[#071c1f]/42" aria-label="Previous">
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button className="hero-next absolute right-0 top-1/2 z-20 grid h-14 w-10 -translate-y-1/2 place-items-center rounded-l-full bg-[#071c1f]/28 text-white shadow-md backdrop-blur transition hover:bg-[#071c1f]/42" aria-label="Next">
        <ChevronRight className="h-6 w-6" />
      </button>
    </section>
  );
}
