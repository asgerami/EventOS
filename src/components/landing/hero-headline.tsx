"use client";

import * as React from "react";

const WEIGHT_MAX = 800;
const WEIGHT_MIN = 300;

interface HeroHeadlineProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * The one signature moment in the product.
 *
 * The hero headline is set in a variable display face, and its `wght` axis is
 * tied to how far the hero has been scrolled: it starts at the full 800 and
 * thins to 300 as the headline leaves. Nothing else on the page animates on
 * scroll except the single opacity reveal, so this is the thing you notice.
 *
 * Three deliberate constraints keep it cheap and safe:
 *
 *  1. The weight only ever travels *downward* from the server-rendered 800,
 *     and lighter cuts are narrower — so a line that fits at 800 can never
 *     re-wrap partway through the interaction and shift the page under the
 *     reader.
 *  2. It writes one custom property on one element per animation frame,
 *     coalesced through rAF off a passive scroll listener, and stops entirely
 *     once the headline is out of view. There is no per-frame layout of the
 *     document, no transform, no canvas.
 *  3. The server-rendered markup already carries `--hero-wght: 800`, so the
 *     first client paint is byte-identical and nothing mutates the DOM before
 *     hydration.
 *
 * Under `prefers-reduced-motion: reduce` the listener is never attached and
 * the headline simply stays at 800 (also pinned in CSS).
 */
export function HeroHeadline({ id, className, children }: HeroHeadlineProps) {
  const ref = React.useRef<HTMLHeadingElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let frame = 0;
    let active = true;
    let last = WEIGHT_MAX;

    const apply = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const scrollY = window.scrollY;
      // Measured against the headline's own position and height, so the
      // interpolation starts on the very first pixel of scroll and finishes
      // as the headline clears the top of the viewport — at any width, with
      // no hard-coded distances.
      const travel = Math.max(rect.top + scrollY + rect.height, 1);
      const progress = Math.min(Math.max(scrollY / travel, 0), 1);
      const weight = Math.round(
        WEIGHT_MAX - (WEIGHT_MAX - WEIGHT_MIN) * progress
      );
      if (weight !== last) {
        last = weight;
        el.style.setProperty("--hero-wght", String(weight));
      }
    };

    const onScroll = () => {
      if (!active || frame) return;
      frame = window.requestAnimationFrame(apply);
    };

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              active = entry.isIntersecting;
              // Settle on the correct weight on the way out too, so the
              // headline is never left mid-interpolation when it returns.
              apply();
            },
            { rootMargin: "0px 0px -10% 0px" }
          );

    observer?.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    apply();

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <h1
      ref={ref}
      id={id}
      className={className}
      style={{ "--hero-wght": WEIGHT_MAX } as React.CSSProperties}
    >
      {children}
    </h1>
  );
}
