import { chromium } from "@playwright/test";

const OUT = process.env.OUT_DIR;
const BASE = process.env.BASE_URL || "http://localhost:3000";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const browser = await chromium.launch();
let fail = false;

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const msgs = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      msgs.push(`[${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => msgs.push(`[pageerror] ${e.message}`));

  const resp = await page.goto(BASE + "/", { waitUntil: "networkidle" });
  console.log(`\n=== ${vp.name} ${vp.width}x${vp.height} — status ${resp.status()}`);

  // scroll the whole page to trigger reveals
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 45));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });

  const info = await page.evaluate(() => {
    const de = document.documentElement;
    const vw = de.clientWidth;
    const offenders = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        offenders.push({
          tag: el.tagName,
          cls: (el.className || "").toString().slice(0, 160),
          left: Math.round(r.left),
          right: Math.round(r.right),
          w: Math.round(r.width),
        });
      }
    }
    const bodyStyle = getComputedStyle(document.body);
    const htmlStyle = getComputedStyle(de);
    return {
      scrollWidth: de.scrollWidth,
      clientWidth: de.clientWidth,
      overflow: de.scrollWidth - de.clientWidth,
      bodyBg: bodyStyle.backgroundColor,
      bodyColor: bodyStyle.color,
      htmlBg: htmlStyle.backgroundColor,
      colorScheme: htmlStyle.colorScheme,
      bodyFont: bodyStyle.fontFamily,
      h1Font: document.querySelector("h1")
        ? getComputedStyle(document.querySelector("h1")).fontFamily
        : null,
      h1Weight: document.querySelector("h1")
        ? getComputedStyle(document.querySelector("h1")).fontWeight
        : null,
      offenders: offenders.slice(0, 12),
      offenderCount: offenders.length,
      docHeight: de.scrollHeight,
    };
  });

  console.log(JSON.stringify(info, null, 2));
  if (info.overflow !== 0) fail = true;
  if (msgs.length) {
    fail = true;
    console.log("CONSOLE MESSAGES:", msgs);
  } else {
    console.log("console: clean");
  }

  if (OUT) {
    await page.screenshot({
      path: `${OUT}/${vp.name}-full.png`,
      fullPage: true,
    });
    await page.screenshot({ path: `${OUT}/${vp.name}-hero.png` });
  }
  await ctx.close();
}

// route status checks
const ctx = await browser.newContext();
const page = await ctx.newPage();
for (const r of ["/", "/sign-in", "/sign-up", "/dashboard", "/events"]) {
  const resp = await page.goto(BASE + r, { waitUntil: "domcontentloaded" });
  console.log(`route ${r} -> ${resp.status()}`);
  if (resp.status() !== 200) fail = true;
}
await ctx.close();
await browser.close();
console.log(fail ? "\nRESULT: FAIL" : "\nRESULT: PASS");
