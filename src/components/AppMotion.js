"use client";

import { useEffect } from "react";

export default function AppMotion() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return undefined;

    let lenis;
    let rafId;
    let ctx;
    let ScrollTrigger;
    let mounted = true;

    async function setupMotion() {
      const [{ default: Lenis }, gsapModule, scrollTriggerModule] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (!mounted) return;

      const gsap = gsapModule.default || gsapModule.gsap;
      ScrollTrigger = scrollTriggerModule.ScrollTrigger;

      lenis = new Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.9,
      });

      const raf = (time) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      gsap.registerPlugin(ScrollTrigger);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.lagSmoothing(0);

      ctx = gsap.context(() => {
        gsap.utils.toArray("[data-reveal], .page-hero, .dashboard-reveal").forEach((node) => {
          gsap.fromTo(
            node,
            { autoAlpha: 0, y: 24 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.72,
              ease: "power3.out",
              scrollTrigger: {
                trigger: node,
                start: "top 88%",
                once: true,
              },
            }
          );
        });
      });
    }

    setupMotion();

    return () => {
      mounted = false;
      ctx?.revert();
      ScrollTrigger?.getAll().forEach((trigger) => trigger.kill());
      if (rafId) cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, []);

  return null;
}
