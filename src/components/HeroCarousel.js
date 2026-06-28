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
        className="h-[clamp(520px,66vh,620px)] sm:h-[clamp(430px,38vw,520px)]"
      >
        {slides.map((s, i) => {
          const gallery = s.images?.length ? s.images : s.image ? [s.image] : [];
          const hasGallery = gallery.length > 1;

          return (
          <SwiperSlide key={i}>
            {s.layout === "banner" ? (
              <div className="relative h-full w-full overflow-hidden bg-[#041c22]">
                {s.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.image}
                    alt=""
                    loading={i === 0 ? "eager" : "lazy"}
                    className="absolute inset-0 h-full w-full object-cover object-[66%_center] sm:object-center"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-b from-[#02181d]/54 via-[#02181d]/78 to-[#02181d]/92 sm:bg-gradient-to-r sm:from-[#02181d]/98 sm:via-[#02181d]/86 sm:to-[#02181d]/10" />
                <div className="absolute inset-y-0 left-0 w-full bg-[radial-gradient(circle_at_12%_22%,rgba(22,163,204,0.26),transparent_36%)] sm:w-[62%]" />
                <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#041c22]/88 to-transparent" />
                <div className="mx-auto flex h-full max-w-6xl items-end px-5 pb-24 pt-8 sm:items-center sm:px-8 sm:pb-8 sm:pt-8">
                  <div className="relative z-10 max-w-[560px] border-l-4 border-[#16a3cc] pl-4 text-white sm:pl-6">
                    {s.eyebrow && (
                      <p className="inline-flex rounded-full border border-cyan-200/25 bg-cyan-300/14 px-3 py-1 text-[11px] font-black uppercase leading-none text-cyan-50 shadow-sm backdrop-blur">
                        {s.eyebrow}
                      </p>
                    )}
                    <h2 className="mt-3 max-w-[12.5ch] text-balance font-display text-[clamp(2rem,9vw,3.2rem)] font-black leading-[1.02] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.28)] sm:mt-4 sm:max-w-[11.5ch] sm:text-[clamp(2.15rem,3.55vw,4.05rem)]">
                      {s.title}
                    </h2>
                    {s.body && <p className="mt-3 max-w-[320px] text-sm font-semibold leading-6 text-cyan-50/88 sm:mt-4 sm:max-w-[500px] sm:text-base sm:leading-7">{s.body}</p>}
                    <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-6">
                      <span className="rounded-lg border border-cyan-200/25 bg-white/9 px-4 py-3 shadow-md backdrop-blur-md">
                        <span className="block text-[10px] font-black uppercase leading-none text-cyan-100">{s.metaLabel || "Access"}</span>
                        <span className="mt-1 block font-display text-[1.45rem] font-black leading-none text-white">{s.metaValue || "Verified"}</span>
                      </span>
                      <Link href={s.href} className="inline-flex min-h-12 items-center rounded-md bg-[#16a3cc] px-6 text-sm font-black uppercase text-white shadow-[0_14px_34px_rgba(22,163,204,0.28)] transition hover:-translate-y-0.5 hover:bg-[#0b8db4] hover:shadow-[0_18px_40px_rgba(22,163,204,0.34)] sm:px-7">
                        {s.ctaLabel || "Shop now"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-full w-full overflow-hidden bg-[#f8fbf6]">
                {gallery[0] ? (
                  <img src={gallery[0]} alt="" loading={i === 0 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover md:hidden" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-b from-[#02181d]/40 via-[#02181d]/72 to-[#02181d]/94 md:hidden" />
                <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_16%_22%,rgba(22,163,204,0.16),transparent_26%),radial-gradient(circle_at_84%_28%,rgba(11,95,134,0.14),transparent_27%),linear-gradient(135deg,rgba(21,176,221,0.10)_0,transparent_42%)]" />
                <div className="mx-auto grid h-full max-w-6xl grid-cols-1 items-end gap-6 px-5 pb-24 pt-8 sm:px-8 md:grid-cols-[0.9fr_1.1fr] md:items-center md:pb-8 md:pt-8">
                  <div className="z-10 max-w-xl">
                    {s.eyebrow && <p className="w-fit rounded-full bg-white/92 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#071c1f] shadow-sm">{s.eyebrow}</p>}
                    <h2 className="mt-3 max-w-[12ch] font-display text-[clamp(2rem,9vw,3.2rem)] font-black leading-[0.98] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.32)] md:max-w-none md:text-[clamp(2.25rem,4.2vw,4.8rem)] md:leading-[0.92] md:text-[#071c1f] md:drop-shadow-none">{s.title}</h2>
                    {s.body && <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-white/84 sm:text-base md:text-[#071c1f]/72">{s.body}</p>}
                    <div className="mt-5 grid max-w-[360px] grid-cols-2 gap-3 md:flex md:max-w-none md:flex-wrap">
                      {s.price != null && (
                        <span className="min-w-0 rounded-md bg-white/95 px-4 py-3 shadow-md backdrop-blur md:px-5">
                          <span className="block text-[10px] font-black uppercase tracking-wide text-[#607280]">Price</span>
                          <span className="block truncate font-display text-[1.35rem] font-black leading-none text-[#071c1f] md:text-2xl">{money(s.price)}</span>
                        </span>
                      )}
                      <span className="min-w-0 rounded-md bg-white/95 px-4 py-3 shadow-md backdrop-blur md:px-5">
                        <span className="block text-[10px] font-black uppercase tracking-wide text-[#607280]">Access</span>
                        <span className="block truncate font-display text-[1.35rem] font-black leading-none text-[#071c1f] md:text-2xl">Verified</span>
                      </span>
                    </div>
                    <Link href={s.href} className="mt-5 inline-flex items-center rounded-md bg-[#16a3cc] px-7 py-3 text-sm font-black uppercase tracking-wide text-white shadow-md transition hover:bg-[#0b8db4] md:bg-[#0b5f86] md:px-8 md:hover:bg-[#094f6b]">
                      {s.ctaLabel || "Shop now"}
                    </Link>
                  </div>
                  <div className="relative hidden h-full items-center justify-center md:flex">
                    {gallery.length ? (
                      hasGallery ? (
                        <div className="relative h-[82%] w-[90%] max-w-[560px] rounded-[28px] bg-white p-3 shadow-2xl ring-1 ring-black/5">
                          <div className="grid h-full grid-cols-[1.35fr_0.65fr] gap-2 overflow-hidden rounded-[20px] bg-[#e9f6fa]">
                            <div className="relative overflow-hidden rounded-l-[20px]">
                              <img src={gallery[0]} alt={s.title} loading={i === 0 ? "eager" : "lazy"} className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#071c1f]/26 to-transparent" />
                            </div>
                            <div className="grid gap-2">
                              {gallery.slice(1, 4).map((src, idx) => (
                                <div key={`${src}-${idx}`} className="relative min-h-0 overflow-hidden bg-[#dceef3] last:rounded-br-[20px] first:rounded-tr-[20px]">
                                  <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                                  {idx === 2 && gallery.length > 4 ? (
                                    <div className="absolute inset-0 grid place-items-center bg-[#071c1f]/58 text-lg font-black text-white">
                                      +{gallery.length - 4}
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="absolute left-6 top-6 rounded-full bg-[#16a3cc] px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white shadow-lg">
                            {gallery.length} photos
                          </div>
                          <div className="absolute -bottom-4 right-5 max-w-[260px] rounded-2xl bg-white px-5 py-4 shadow-xl ring-1 ring-black/5">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0b5f86]">Gallery preview</p>
                            <p className="mt-1 text-sm font-black leading-5 text-[#071c1f]">{s.caption || "Real listing photos"}</p>
                          </div>
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <div className="relative flex h-[78%] w-[82%] items-center justify-center">
                          <div className="absolute inset-3 rounded-[28px] bg-white shadow-2xl ring-1 ring-black/5" />
                          <img src={gallery[0]} alt={s.title} loading={i === 0 ? "eager" : "lazy"} className="relative h-[88%] w-[86%] rounded-sm object-cover shadow-lg" />
                          <div className="absolute bottom-2 right-0 rounded-xl bg-white px-6 py-5 shadow-xl">
                            <p className="text-xs font-black text-[#071c1f]">{s.caption || "Real listing photos"}</p>
                          </div>
                        </div>
                      )
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </SwiperSlide>
          );
        })}
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
