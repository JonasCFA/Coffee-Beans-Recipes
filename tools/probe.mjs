const urls = ["https://www.roastmarket.de/kaffee/", "https://www.roastmarket.de/kaffee/kaffeebohnen.html", "https://www.honest-rare.de/kaffee/", "https://www.kaffeax.com/de/"];
for (const url of urls) {
  try {
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 daily-pour" }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    const html = await r.text();
    console.log(`PROBE ${url} -> ${r.status} ${r.url} len=${html.length} ldjson=${(html.match(/application\/ld\+json/g) || []).length} products=${(html.match(/class="[^"]*product[^"]*"/g) || []).length}`);
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1].slice(0, 400));
    ld.slice(0, 3).forEach((x) => console.log("PROBE LD " + x.replace(/\s+/g, " ")));
    const links = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>/g)].map((m) => m[1]).filter((h) => /kaffee|coffee|espresso|product|produkt/i.test(h) && h.length > 25);
    console.log("PROBE LINKS " + links.slice(0, 15).join(" | "));
    const p = html.match(/<(article|li|div)[^>]*class="[^"]*(product-item|product-box|product-card|item product)[^"]*"[\s\S]{0,800}/);
    console.log("PROBE CARD " + (p ? p[0].replace(/\s+/g, " ") : "none"));
  } catch (e) { console.log(`PROBE ${url} failed ${e.message}`); }
}
