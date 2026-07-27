import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";

/* Display voice — and the whole identity. Bricolage Grotesque is a variable
   grotesque with genuine character (flat-sided bowls, a cut-in "e", a real
   800 weight) and a `wght` axis wide enough to interpolate against. The hero
   headline drives that axis; every other heading sits at a fixed cut. */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

/* Text and UI voice. Instrument Sans is a quiet, slightly narrow grotesque
   that gets out of the display face's way, with lining/tabular figures so
   numbers still align in a column. */
const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EventOS",
  description:
    "Registration, ticketing, QR check-in, attendance and analytics for the people who actually run the event.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* One light theme, declared once. `dark` is never toggled by anything in
       the product — it is present only so the `dark:` variants already written
       across the not-yet-redesigned screens resolve against this same palette
       rather than an unmaintained second one. Nothing mutates this element
       before hydration, so no suppressHydrationWarning is needed. */
    /* The font variables are declared on <html>, not <body>: `--font-display`
       and `--font-sans` are themselves declared at `:root` by `@theme`, and a
       var() inside a custom property resolves against the element that
       declares it — so a `--font-bricolage` living on <body> would never be
       visible to them and every heading would silently fall back to
       ui-sans-serif. */
    <html
      lang="en"
      className={`dark ${instrument.variable} ${bricolage.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
