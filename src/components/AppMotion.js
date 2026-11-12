"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Smooth wheel scrolling (Lenis) and scroll-in reveals (GSAP).
 *
 * This sits in the root layout, so it mounts once and survives every
 * client-side navigation. Lenis keeps its own idea of where the page is
 * scrolled to and writes it back to the window on every animation frame while
 * it is moving. Next.js scrolls the window to the top on navigation, but
 * Lenis did not hear about it: with a smooth scroll still in flight it carried
 * on toward its old target, and the next page opened halfway down, at roughly
 * where the previous one had been. The effect below tells Lenis about every
 * route change.
 */
export default function AppMotion() {
  const pathname = usePathname();
  const lenisRef = useRef(null);
  const motionRef = useRef(null); // { gsap, ScrollTrigger }
  const revealCtx = useRef(null);
  // Back/forward should restore where the reader was, not jump to the top.
  const poppedRef = useRef(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return undefined;

    let rafId;
    let mounted = true;
    const onPop = () => {
      poppedRef.current = true;
    };
    window.addEventListener("popstate", onPop);

    async function setupMotion() {
      const [{ default: Lenis }, gsapModule, scrollTriggerModule] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (!mounted) return;

      const gsap = gsapModule.default || gsapModule.gsap;
      const { ScrollTrigger } = scrollTriggerModule;
      gsap.registerPlugin(ScrollTrigger);
      gsap.ticker.lagSmoothing(0);

      const lenis = new Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.9,
      });
      lenis.on("scroll", ScrollTrigger.update);
      lenisRef.current = lenis;
      motionRef.current = { gsap, ScrollTrigger };

      const raf = (time) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      setupReveals();
    }

    setupMotion();

    return () => {
      mounted = false;
      window.removeEventListener("popstate", onPop);
      revealCtx.current?.revert();
      motionRef.current?.ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      if (rafId) cancelAnimationFrame(rafId);
      lenisRef.current?.destroy();
      lenisRef.current = null;
      motionRef.current = null;
    };
  }, []);

  // Every navigation: settle the scroll position, then set up reveals for the
  // new page's elements (the old triggers pointed at nodes that are gone).
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return undefined;

    const popped = poppedRef.current;
    poppedRef.current = false;

    if (popped) {
      // The browser restores the old position itself; stop any glide in
      // flight and adopt wherever the window now is.
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    } else if (window.location.hash) {
      // An in-page anchor (/#how): let the browser go to it, and follow.
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    } else {
      lenis.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
    }

    // The new page's content has to be in the DOM before reveals are wired.
    const id = requestAnimationFrame(() => {
      setupReveals();
      motionRef.current?.ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function setupReveals() {
    const motion = motionRef.current;
    if (!motion) return;
    const { gsap } = motion;
    revealCtx.current?.revert();
    revealCtx.current = gsap.context(() => {
      // .dashboard-reveal is left to its CSS entrance (globals.css). Driving it
      // from here as well hid any panel below the fold until it was scrolled
      // to, and fought the CSS animation over the same properties.
      gsap.utils.toArray("[data-reveal], .page-hero").forEach((node) => {
        gsap.fromTo(
          node,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            ease: "power3.out",
            scrollTrigger: { trigger: node, start: "top 88%", once: true },
          }
        );
      });
    });
  }

  return null;
}
