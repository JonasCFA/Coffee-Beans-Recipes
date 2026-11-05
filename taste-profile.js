const STORAGE_KEY = "daily-pour-coffee-journal-v4";
const LEGACY_KEYS = ["daily-pour-coffee-journal-v3", "daily-pour-coffee-journal-v2", "daily-pour-coffee-journal-v1"];
const STYLES = ["black", "milk", "oat"];
const STYLE_INFO = {
  black: { label: "Espresso · black", subtitle: "Clarity, acidity and the bean on its own", icon: "◉", className: "map-black", color: "#5c7059" },
  milk: { label: "Espresso · dairy milk", subtitle: "Milk can soften sharper edges and add sweetness", icon: "◒", className: "map-milk", color: "#b67b50" },
  oat: { label: "Espresso · oat milk", subtitle: "Oat adds its own sweetness and cereal-like notes", icon: "◍", className: "map-oat", color: "#858653" }
};
const $ = (selector) => document.querySelector(selector);
const mapRoot = $("#profileMaps");
const predictionRoot = $("#predictionList");
let beans = loadBeans();
let activeBeanId = null;

function loadBeans() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return normalize(JSON.parse(current));
    for (const key of LEGACY_KEYS) {
      const previous = localStorage.getItem(key);
      if (previous) return normalize(JSON.parse(previous));
    }
  } catch (error) {
    console.warn("Could not load Daily Pour coffees", error);
  }
  return [];
}
function normalize(items) {
  if (!Array.isArray(items)) return [];
  return items.map((bean) => ({ ...bean, profile: Array.isArray(bean.profile) ? bean.profile : [], brews: Array.isArray(bean.brews) ? bean.brews : [] }));
}
function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}
function getNotes(bean) { return (bean.profile || []).map((note) => String(note).trim()).filter(Boolean); }
function getRating(bean, style) {
  const scores = (bean.brews || []).filter((brew) => brew.drinkStyle === style && brew.rating !== null && brew.rating !== undefined && brew.rating !== "" && Number.isFinite(Number(brew.rating))).map((brew) => Number(brew.rating));
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
}
function features(bean) {
  const text = getNotes(bean).join(" ").toLowerCase();
  const contains = (words) => words.some((word) => text.includes(word));
  const bright = contains(["citrus", "lemon", "lime", "orange", "berry", "grape", "apple", "peach", "cherry", "floral", "jasmine", "bergamot", "zitrus", "beere", "kirsche", "pfirsich", "blüte"]);
  const floral = contains(["floral", "jasmine", "bergamot", "tea", "blossom", "blüte", "tee"]);
  const fruit = contains(["citrus", "lemon", "lime", "orange", "berry", "grape", "apple", "peach", "cherry", "fruit", "zitrus", "beere", "kirsche", "pfirsich"]);
  const chocolate = contains(["chocolate", "cocoa", "cacao", "caramel", "toffee", "chocolade", "kakao", "karamell"]);
  const nut = contains(["nut", "hazelnut", "almond", "peanut", "nuss", "haselnuss", "mandel"]);
  const sweetness = contains(["honey", "sweet", "sugar", "caramel", "toffee", "maple", "honig", "süß", "karamell"]);
  const bitter = contains(["bitter", "roasty", "smoky", "tobacco", "dark chocolate", "herbal", "rauchig", "bitterkeit"]);
  const roast = (bean.roastLevel || "medium").toLowerCase();
  const darkRoast = roast.includes("dark") || roast.includes("dunkel");
  const lightRoast = roast.includes("light") || roast.includes("hell");
  const bodyWords = contains(["full body", "syrupy", "creamy", "heavy", "round", "body", "körper", "sirup", "vollmundig"]);
  return { text, bright, floral, fruit, chocolate, nut, sweetness, bitter, darkRoast, lightRoast, bodyWords };
}
function estimate(bean, style) {
  const f = features(bean);
  const personal = getRating(bean, style);
  if (personal !== null) return { score: personal, source: "your logged cup", taste: tasteSentence(f, style, true), confidence: "Based on your own rated brew(s) for this drink style." };
  let score = 6;
  if (style === "black") score += (f.bright ? 1.1 : 0) + (f.floral ? 0.9 : 0) + (f.chocolate ? 0.3 : 0) - (f.bitter ? 0.7 : 0);
  if (style === "milk") score += (f.chocolate ? 1.2 : 0) + (f.nut ? 0.8 : 0) + (f.sweetness ? 0.7 : 0) - (f.floral ? 0.4 : 0);
  if (style === "oat") score += (f.chocolate ? 0.9 : 0) + (f.nut ? 0.8 : 0) + (f.sweetness ? 0.5 : 0) - (f.bright ? 0.25 : 0) - (f.bitter ? 0.8 : 0);
  if (f.darkRoast && style !== "black") score += 0.25;
  if (!getNotes(bean).length) score = 5.5;
  score = Math.max(0, Math.min(10, score));
  const certainty = getNotes(bean).length >= 3 && bean.roastLevel ? "Some clues: roast level and saved roaster notes are available." : "Low confidence: add the roaster’s official taste notes and roast level for a more useful estimate.";
  return { score, source: "flavour-note estimate", taste: tasteSentence(f, style, false), confidence: certainty };
}
function tasteSentence(f, style, personal) {
  if (personal) return "Your own cup ratings replace the estimate for this style. Keep logging to refine your personal score.";
  if (style === "black") {
    if (f.floral || f.fruit) return "Likely to show more of its fruit, citrus or floral character, with less milk to soften acidity.";
    if (f.chocolate || f.nut) return "Likely to lean toward cocoa, nuts or sweetness, with the bean’s roast character up front.";
    return "A starting guess from the saved notes; try a shot and record what you actually taste.";
  }
  if (style === "milk") {
    if (f.chocolate || f.nut || f.sweetness) return "Chocolate, nut or sweet notes may pair well; dairy can round acidity and add a creamy texture.";
    if (f.fruit || f.bright) return "Milk may soften bright notes; depending on the shot, fruit can become mellow or fade behind the milk.";
    return "Milk adds creaminess and sweetness; the balance depends strongly on espresso strength and milk quantity.";
  }
  if (f.bitter || (f.darkRoast && !f.sweetness)) return "Watch for a bitter or roasty finish: oat’s cereal-like flavour can amplify some dark or bitter notes. A shorter, sweeter shot may help.";
  if (f.chocolate || f.nut || f.sweetness) return "Chocolate, nut and sweet notes may complement oat’s cereal-like sweetness; check whether the finish stays balanced.";
  if (f.fruit || f.bright) return "Bright fruit may contrast with oat’s cereal notes. It can be lively, but some pairings may taste sharp—your own test is key.";
  return "Oat milk adds its own cereal-like sweetness. This is an uncertain starting guess until you log a cup.";
}
function position(bean, style) {
  const f = features(bean);
  let x = 50;
  if (f.fruit) x -= 20;
  if (f.floral) x -= 12;
  if (f.chocolate) x += 16;
  if (f.nut) x += 10;
  if (f.darkRoast) x += 12;
  if (f.sweetness) x += 2;
  if (style === "milk") x += f.chocolate || f.nut ? 6 : 1;
  if (style === "oat") x += f.bitter || f.darkRoast ? 8 : f.sweetness ? 2 : 0;
  let y = 52;
  if (f.lightRoast) y -= 13;
  if (f.darkRoast) y += 14;
  if (f.bodyWords) y += 12;
  if (style === "milk") y += 8;
  if (style === "oat") y += 6;
  return { x: Math.max(9, Math.min(91, x)), y: Math.max(12, Math.min(88, y)) };
}
function pointColor(index) { return ["#58705a", "#b6754f", "#7b7994", "#a18a4d", "#568494", "#a76060", "#6e8878", "#94709c"][index % 8]; }
function plotSVG(style) {
  const info = STYLE_INFO[style];
  const left = 44, right = 436, top = 27, bottom = 250;
  const coords = beans.map((bean, index) => {
    const p = position(bean, style);
    return { bean, index, x: left + (p.x / 100) * (right - left), y: bottom - (p.y / 100) * (bottom - top), color: pointColor(index) };
  });
  const points = coords.map(({ bean, index, x, y, color }) => `<g class="plot-bean-point" data-bean-id="${esc(bean.id)}" tabindex="0" role="button" aria-label="Highlight ${esc(bean.name)}"><circle class="point-halo" cx="${x}" cy="${y}" r="10"/><circle class="point" cx="${x}" cy="${y}" r="7" fill="${color}"/><text class="point-index" x="${x}" y="${y}">${index + 1}</text><title>${esc(bean.name)} · ${esc(bean.roaster)}</title></g>`).join("");
  return `<svg class="taste-plot" viewBox="0 0 480 292" role="img" aria-label="${esc(info.label)} coffee taste map. Horizontal axis ranges from bright and fruity to chocolate and nutty. Vertical axis ranges from delicate to full-bodied."><rect class="plot-bg" x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" rx="12"/><line class="grid-line" x1="${left + (right-left)/3}" y1="${top}" x2="${left + (right-left)/3}" y2="${bottom}"/><line class="grid-line" x1="${left + 2*(right-left)/3}" y1="${top}" x2="${left + 2*(right-left)/3}" y2="${bottom}"/><line class="grid-line" x1="${left}" y1="${top + (bottom-top)/3}" x2="${right}" y2="${top + (bottom-top)/3}"/><line class="grid-line" x1="${left}" y1="${top + 2*(bottom-top)/3}" x2="${right}" y2="${top + 2*(bottom-top)/3}"/><text class="axis-label" x="${left}" y="267">Delicate</text><text class="axis-label" x="${right}" y="267" text-anchor="end">Full-bodied</text><text class="axis-title" x="${(left+right)/2}" y="282" text-anchor="middle">BODY / ROAST IMPRESSION</text><text class="axis-label" x="${left}" y="17">Bright · fruit · floral</text><text class="axis-label" x="${right}" y="17" text-anchor="end">Chocolate · nut</text>${points || '<text class="plot-empty" x="240" y="145">Add coffees to place your beans here</text>'}</svg>`;
}
function mapCard(style) {
  const info = STYLE_INFO[style];
  const scores = beans.map((bean) => estimate(bean, style).score).filter(Number.isFinite);
  const avg = scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : "—";
  const legend = beans.map((bean, index) => `<div class="plot-bean" data-bean-id="${esc(bean.id)}"><span class="legend-dot" style="background:${pointColor(index)}"></span><button type="button" data-action="highlight" data-bean-id="${esc(bean.id)}">${index + 1}. ${esc(bean.name)} · ${estimate(bean, style).score.toFixed(1)}/10</button>${bean.productUrl ? `<a class="legend-source" href="${esc(safeUrl(bean.productUrl))}" target="_blank" rel="noopener noreferrer" title="Open saved roaster / product page">source ↗</a>` : ""}</div>`).join("");
  return `<article class="profile-map-card ${info.className}"><div class="profile-map-top"><div><h3>${esc(info.label)}</h3><p>${esc(info.subtitle)}</p></div><span class="map-illustration" aria-hidden="true">${info.icon}</span></div><div class="plot-wrap">${plotSVG(style)}</div><div class="map-score-note"><strong>${avg}/10</strong> average predicted compatibility for saved beans. Individual scores are guesses until you log a cup.</div><div class="plot-legend">${legend || '<span class="plot-bean">No saved beans yet.</span>'}</div></article>`;
}
function predictionCard(bean) {
  const source = safeUrl(bean.productUrl || "");
  const styles = STYLES.map((style) => {
    const result = estimate(bean, style);
    return `<article class="prediction-drink"><small>${esc(STYLE_INFO[style].label)}</small><strong>${result.score.toFixed(1)} / 10 · ${result.source === "your logged cup" ? "your score" : "estimate"}</strong><p>${esc(result.taste)}</p></article>`;
  }).join("");
  const notes = getNotes(bean).map((note) => `<span class="tag">${esc(note)}</span>`).join("") || '<span class="tag">No official notes saved yet</span>';
  const confidence = STYLES.map((style) => estimate(bean, style).confidence)[0];
  return `<article class="prediction-card" data-bean-id="${esc(bean.id)}"><div class="prediction-header"><div><h3>${esc(bean.name)}</h3><p>${esc(bean.roaster)}${bean.roasterLocation ? ` · ${esc(bean.roasterLocation)}` : ""}${bean.roastLevel ? ` · ${esc(bean.roastLevel)} roast` : ""}</p></div>${source ? `<a class="prediction-source" href="${esc(source)}" target="_blank" rel="noopener noreferrer">Open saved source ↗</a>` : "<span class=\"prediction-source\">No source URL saved</span>"}</div><div class="prediction-notes">${notes}</div><div class="prediction-drinks">${styles}</div><p class="prediction-confidence">${esc(confidence)} Estimates use only saved flavor notes and roast level. The product URL is shown as a reference link; GitHub Pages does not fetch or verify that website.</p></article>`;
}
function highlightBean(id) {
  activeBeanId = id;
  document.querySelectorAll("[data-bean-id]").forEach((element) => element.classList.toggle("is-filtered-out", element.dataset.beanId !== id));
  document.querySelectorAll(".prediction-card").forEach((element) => element.classList.toggle("is-highlighted", element.dataset.beanId === id));
}
function render() {
  $("#mapCount").textContent = beans.length ? `${beans.length} ${beans.length === 1 ? "saved coffee" : "saved coffees"} plotted on each map` : "Add beans to see your personal taste maps";
  if (!beans.length) {
    const message = '<div class="empty-map-state">No saved coffees yet. Add a bean from your collection first; it will appear here automatically.<br /><a href="./index.html#library">Go to My collection →</a></div>';
    mapRoot.innerHTML = STYLES.map((style) => `<article class="profile-map-card ${STYLE_INFO[style].className}"><div class="profile-map-top"><div><h3>${esc(STYLE_INFO[style].label)}</h3><p>${esc(STYLE_INFO[style].subtitle)}</p></div><span class="map-illustration">${STYLE_INFO[style].icon}</span></div>${message}</article>`).join("");
    predictionRoot.innerHTML = message;
    return;
  }
  mapRoot.innerHTML = STYLES.map(mapCard).join("");
  predictionRoot.innerHTML = beans.map(predictionCard).join("");
  if (activeBeanId && beans.some((bean) => bean.id === activeBeanId)) highlightBean(activeBeanId);
}
function safeUrl(value) {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : ""; }
  catch { return ""; }
}
mapRoot.addEventListener("click", (event) => {
  const control = event.target.closest('[data-action="highlight"], .plot-bean-point');
  if (control) highlightBean(control.dataset.beanId);
});
mapRoot.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches(".plot-bean-point")) { event.preventDefault(); highlightBean(event.target.dataset.beanId); }
});
predictionRoot.addEventListener("click", (event) => {
  const card = event.target.closest(".prediction-card");
  if (card && !event.target.closest("a")) highlightBean(card.dataset.beanId);
});
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY || LEGACY_KEYS.includes(event.key)) { beans = loadBeans(); render(); }
});
render();
