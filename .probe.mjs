import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
console.log(await p.evaluate(() => {
  const cs = getComputedStyle(document.body);
  return {
    fontSourceSans: cs.getPropertyValue("--font-source-sans"),
    fontFraunces: cs.getPropertyValue("--font-fraunces"),
    fontSansTok: cs.getPropertyValue("--font-sans"),
    bodyClass: document.body.className,
    sheets: [...document.styleSheets].map(s => s.href || "inline").slice(0,20),
    fontsLoaded: [...document.fonts].map(f=>f.family+"/"+f.weight+"/"+f.status).slice(0,20),
  };
}));
await b.close();
