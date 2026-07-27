"use client";

import * as React from "react";

interface RevealProps {
  /** Stagger, in milliseconds. */
  delay?: number;
  as?: "div" | "li" | "section";
  className?: string;
  children?: React.ReactNode;
}

/**
 * The page's only scroll-driven reveal: opacity plus fourteen pixels of
 * travel, one duration, one easing curve, used identically in every section.
 *
 * All of the motion lives in CSS (`[data-reveal]` in globals.css); this
 * component flips a single attribute once, so there is no per-frame
 * JavaScript. The hidden start state is scoped to `@media (scripting:
 * enabled)`, which means a client with scripting off — or with this bundle
 * blocked — is served the finished layout by CSS alone. Reduced-motion users
 * get the finished layout too, via the media query in globals.css.
 */
export function Reveal({
  delay = 0,
  as: Tag = "div",
  className,
  children,
}: RevealProps) {
  const [shown, setShown] = React.useState(false);
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-reveal={shown ? "shown" : ""}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className={className}
    >
      {children}
    </Tag>
  );
}
