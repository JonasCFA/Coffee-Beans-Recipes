const urls = ["https://www.honest-rare.de/kaffeebohnen/", "https://www.roastmarket.de/kaffee/kaffeebohnen.html"];
for (const url of urls) {
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 daily-pour" }, signal: AbortSignal.timeout(25000) });
  const html = await r.text();
  console.log(`PROBE ${url} len=${html.length}`);
  const idx = [...html.matchAll(/class="[^"]*product[^"]*"/g)].map((m) => m.index);
  console.log("PROBE classes " + [...new Set([...html.matchAll(/class="([^"]*product[^"]*)"/g)].map((m) => m[1]))].slice(0, 25).join(" || "));
  for (const i of idx.slice(2, 4)) console.log("PROBE SNIP " + html.slice(Math.max(0, i - 200), i + 1200).replace(/\s+/g, " "));
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  ld.forEach((x) => console.log("PROBE LDTYPES " + [...x.matchAll(/"@type":\s*"([^"]+)"/g)].map((m) => m[1]).slice(0, 8).join(",") + " len=" + x.length));
  console.log("PROBE pagination " + [...html.matchAll(/href="([^"]*(?:p=|page=|seite)[^"]*)"/g)].map((m) => m[1]).slice(0, 4).join(" | "));
}
