const base = "https://www.roastmarket.de/api/catalog/vue_storefront_catalog/product/_search";
for (const q of [{ query: { match_all: {} }, size: 2 }, { query: { query_string: { query: "Kaffeebohnen Äthiopien" } }, size: 2 }]) {
  try {
    const r = await fetch(base + "?request=" + encodeURIComponent(JSON.stringify(q)), { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(25000) });
    const t = await r.text();
    console.log("PROBE RM " + r.status + " " + t.slice(0, 1800).replace(/\s+/g, " "));
  } catch (e) { console.log("PROBE RM failed " + e.message); }
}
const r2 = await fetch("https://www.honest-rare.de/kaffeebohnen/", { headers: { "user-agent": "Mozilla/5.0" } });
const html = await r2.text();
const i = html.indexOf("ty-grid-list__item");
console.log("PROBE HR " + html.slice(i - 100, i + 2200).replace(/\s+/g, " "));
console.log("PROBE HR pages " + [...html.matchAll(/href="([^"]*page-\d+[^"]*)"/g)].map((m) => m[1]).slice(0, 4).join(" | "));
