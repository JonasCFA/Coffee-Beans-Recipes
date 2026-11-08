const STORAGE_KEY = "daily-pour-coffee-journal-v4";
const LEGACY_KEYS = ["daily-pour-coffee-journal-v3", "daily-pour-coffee-journal-v2", "daily-pour-coffee-journal-v1"];
const STYLES = ["black", "americano", "milk", "oat", "icedmilk", "icedoat"];
const STYLE_INFO = {
  black: { label: "Espresso · black", subtitle: "Clarity, acidity and the bean on its own", icon: "◉", className: "map-black", color: "#5c7059" },
  americano: { label: "Americano", subtitle: "Espresso diluted with hot water: longer, lighter, more transparent", icon: "◌", className: "map-black", color: "#4f7a86" },
  milk: { label: "Espresso · dairy milk", subtitle: "Milk can soften sharper edges and add sweetness", icon: "◒", className: "map-milk", color: "#b67b50" },
  icedmilk: { label: "Iced latte · dairy milk", subtitle: "Cold dilution mutes aroma and bitterness; sweetness and fruit stand out", icon: "❄", className: "map-milk", color: "#7a9aa6" },
  icedoat: { label: "Iced latte · oat milk", subtitle: "Cold oat is smooth and grainy-sweet; needs a bold, sweet shot", icon: "❅", className: "map-oat", color: "#7a9a86" },
  oat: { label: "Espresso · oat milk", subtitle: "Oat adds its own sweetness and cereal-like notes", icon: "◍", className: "map-oat", color: "#858653" }
};
const $ = (selector) => document.querySelector(selector);
const mapRoot = $("#profileMaps");
const predictionRoot = $("#predictionList");
const comparisonRoot = $("#tasteComparison");
let beans = loadBeans();
let activeBeanId = null;
let comparisonBeanId = null;
let comparisonStyle = "milk";

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
function personalTaste(bean, style) {
  const taste = bean.tasteProfiles?.[style];
  if (!taste || typeof taste !== "object") return null;
  const valid = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
  return valid(taste.flavor) && valid(taste.body) ? taste : null;
}
function getRating(bean, style) {
  const scores = (bean.brews || []).filter((brew) => brew.drinkStyle === style && brew.rating !== null && brew.rating !== undefined && brew.rating !== "" && Number.isFinite(Number(brew.rating))).map((brew) => Number(brew.rating));
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
}
function loggedInfo(bean, style) {
  const brews = (bean.brews || []).filter((brew) => brew.drinkStyle === style);
  const rated = brews.filter((brew) => brew.rating !== null && brew.rating !== undefined && brew.rating !== "" && Number.isFinite(Number(brew.rating)));
  const lastNote = [...brews].reverse().map((brew) => String(brew.notes || "").trim()).find(Boolean) || "";
  return { total: brews.length, rated: rated.length, unrated: brews.length - rated.length, lastNote };
}
function noteTaste(bean, style) {
  const note = loggedInfo(bean, style).lastNote.toLowerCase();
  if (!note) return {};
  function mentioned(pattern) {
    for (const match of note.matchAll(pattern)) {
      const before = note.slice(Math.max(0, match.index - 25), match.index);
      if (!/(?:kein(?:e|en|er|es)?|nicht|ohne|kaum|wenig|weniger|fehlende|no|not|without|less)\s+(?:\w+\s+){0,2}$/iu.test(before)) return true;
    }
    return false;
  }
  const chocolate = mentioned(/nutella|schokolad\w*|chocolate|cocoa|kakao|haselnuss|hazelnut|nussig|nutty/giu);
  const fruit = mentioned(/fruchtig|frucht|fruity|fruit|zitrus|citrus|floral|blumig|beeren|berry/giu);
  const light = /(?:weniger|fehl(?:t|ende)?|ohne|kaum|keine?)\s+(?:\w+\s+){0,2}(?:tiefe|körper|body)|(?:tiefe|körper|body)\s+fehlt|less\s+(?:\w+\s+){0,2}(?:depth|body)|(?:thin|watery|dünn|wässrig)/iu.test(note);
  const full = !light && mentioned(/cremig|creamy|vollmundig|full.bodied|samtig|syrupy|tief(?:e|er)?/giu);
  const noBitter = /(?:nicht|kein(?:e|en|er|es)?|ohne|not|no|without)\s+(?:\w+\s+){0,2}(?:bitter|bitterkeit)/iu.test(note);
  const bitter = !noBitter && mentioned(/bitter(?:keit)?/giu);
  const slight = /(?:minimal|leicht|etwas|wenig|slightly|slight|a little)\s+(?:\w+\s+){0,2}bitter/iu.test(note);
  return {
    flavor: chocolate === fruit ? null : chocolate ? 100 : 0,
    body: light === full ? null : light ? 25 : 75,
    bitterness: noBitter ? "none" : bitter ? (slight ? "slight" : "noted") : ""
  };
}
function noteAdjustment(bean, style) {
  const POS = ["delicious", "great", "good", "tasty", "smooth", "balanced", "sweet", "love", "nice", "perfect", "creamy", "juicy", "lecker", "gut", "super", "mild", "toll", "süß", "rund"];
  const NEG = ["bitter", "sour", "sauer", "thin", "watery", "burnt", "harsh", "astringent", "weak", "bad", "salty", "flat", "muddy", "dry", "schlecht", "dünn", "wässrig", "herb", "verbrannt"];
  const text = (bean.brews || []).filter((brew) => brew.drinkStyle === style).map((brew) => String(brew.notes || "").toLowerCase()).join(" ");
  if (!text) return { delta: 0, used: false };
  const count = (words) => words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
  const delta = Math.max(-2, Math.min(2, (count(POS) - count(NEG)) * 0.5));
  return { delta, used: true };
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
  if (personal !== null) return { score: personal, source: "your logged cup", taste: tasteSentence(f, style, true, bean), confidence: "Based on your own rated brew(s) for this drink style." };
  let score = 6;
  if (style === "black") score += (f.bright ? 1.1 : 0) + (f.floral ? 0.9 : 0) + (f.chocolate ? 0.3 : 0) - (f.bitter ? 0.7 : 0);
  if (style === "americano") score += (f.bright ? 1 : 0) + (f.floral ? 0.7 : 0) + (f.chocolate ? 0.2 : 0) + (f.sweetness ? 0.2 : 0) - (f.bitter ? 0.9 : 0) - (f.darkRoast ? 0.3 : 0);
  if (style === "milk") score += (f.chocolate ? 1.2 : 0) + (f.nut ? 0.8 : 0) + (f.sweetness ? 0.7 : 0) - (f.floral ? 0.4 : 0);
  if (style === "oat") score += (f.chocolate ? 0.9 : 0) + (f.nut ? 0.8 : 0) + (f.sweetness ? 0.5 : 0) - (f.bright ? 0.25 : 0) - (f.bitter ? 0.8 : 0);
  if (style === "icedmilk") score += (f.chocolate ? 1 : 0) + (f.nut ? 0.7 : 0) + (f.sweetness ? 0.7 : 0) + (f.fruit ? 0.3 : 0) - (f.bitter ? 0.4 : 0) - (f.lightRoast && !f.sweetness ? 0.3 : 0);
  if (style === "icedoat") score += (f.chocolate ? 0.8 : 0) + (f.nut ? 0.7 : 0) + (f.sweetness ? 0.5 : 0) - (f.bitter ? 0.7 : 0) - (f.floral ? 0.3 : 0);
  if (f.darkRoast && (style === "milk" || style === "oat")) score += 0.25;
  if (!getNotes(bean).length) score = 5.5;
  score += noteAdjustment(bean, style).delta;
  score = Math.max(0, Math.min(10, score));
  const certainty = getNotes(bean).length >= 3 && bean.roastLevel ? "Some clues: roast level and saved roaster notes are available." : "Low confidence: add the roaster’s official taste notes and roast level for a more useful estimate.";
  return { score, source: "flavour-note estimate", taste: tasteSentence(f, style, false, bean), confidence: certainty };
}
function tasteSentence(f, style, personal, bean) {
  const log = bean ? loggedInfo(bean, style) : { total: 0, rated: 0, unrated: 0, lastNote: "" };
  const extra = log.lastNote ? ` Your last note: “${log.lastNote}”.` : "";
  if (personal) return `Average of ${log.rated} rated cup${log.rated === 1 ? "" : "s"} for this style.${log.unrated ? ` ${log.unrated} unrated cup${log.unrated === 1 ? " is" : "s are"} ignored.` : ""}${extra}`;
  if (log.total) return `${log.total} cup${log.total === 1 ? "" : "s"} logged but not rated, so the score is a note-based estimate, adjusted by the words in your brew notes. Rate a cup (untick “Leave this cup unrated”) to update it.${extra}`;
  if (style === "black") {
    if (f.floral || f.fruit) return "Likely to show more of its fruit, citrus or floral character, with less milk to soften acidity.";
    if (f.chocolate || f.nut) return "Likely to lean toward cocoa, nuts or sweetness, with the bean’s roast character up front.";
    return "A starting guess from the saved notes; try a shot and record what you actually taste.";
  }
  if (style === "americano") {
    if (f.bitter || f.darkRoast) return "Added water thins the body and can stretch bitter or roasty notes; pull a shorter, sweeter shot and add less water.";
    if (f.floral || f.fruit || f.bright) return "Water opens up the fruit and floral notes and makes the cup tea-like and clear. Body drops, so a slightly finer grind helps.";
    if (f.chocolate || f.nut || f.sweetness) return "Cocoa and nut notes stay present but lighter and cleaner; expect less sweetness and body than the plain shot.";
    return "A longer, lighter cup that shows the bean's clarity; try about 1:3 to 1:4 shot to water and note what you taste.";
  }
  if (style === "icedmilk") {
    if (f.chocolate || f.nut || f.sweetness) return "Cold milk keeps chocolate, nut and caramel notes smooth and sweet. Pull a slightly shorter, stronger shot so ice does not wash it out.";
    if (f.fruit || f.bright || f.floral) return "Cold dilution mutes aroma, but fruit can turn juicy and refreshing; it can taste thin or sour if the shot is too short.";
    return "Ice mutes bitterness and aroma, so use a stronger, sweeter shot and note what remains.";
  }
  if (style === "icedoat") {
    if (f.bitter || (f.darkRoast && !f.sweetness)) return "Cold oat softens roast a little, but bitter notes can still read grainy; pull a shorter, sweeter shot.";
    if (f.chocolate || f.nut || f.sweetness) return "Chocolate, nut and sweet notes pair well with cold oat's smooth, grainy sweetness. Often one of the easiest ways to enjoy these beans.";
    return "Cold oat adds a smooth, cereal sweetness; bright beans can taste flat or sharp, so test with a bold shot.";
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
  const personal = personalTaste(bean, style);
  if (personal) return { x: 9 + personal.flavor * .82, y: 12 + personal.body * .76, source: "your position" };
  const f = features(bean);
  let x = 50;
  if (f.fruit) x -= 20;
  if (f.floral) x -= 12;
  if (f.chocolate) x += 16;
  if (f.nut) x += 10;
  if (f.darkRoast) x += 12;
  if (f.sweetness) x += 2;
  if (style === "americano") x -= 3;
  if (style === "icedmilk") x += f.chocolate || f.nut ? 5 : -1;
  if (style === "icedoat") x += f.bitter || f.darkRoast ? 6 : f.sweetness ? 2 : 0;
  if (style === "milk") x += f.chocolate || f.nut ? 6 : 1;
  if (style === "oat") x += f.bitter || f.darkRoast ? 8 : f.sweetness ? 2 : 0;
  let y = 52;
  if (f.lightRoast) y -= 13;
  if (f.darkRoast) y += 14;
  if (f.bodyWords) y += 12;
  if (style === "americano") y -= 10;
  if (style === "icedmilk") y += 2;
  if (style === "icedoat") y += 0;
  if (style === "milk") y += 8;
  if (style === "oat") y += 6;
  const note = noteTaste(bean, style);
  if (note.flavor !== null && note.flavor !== undefined) x = 9 + note.flavor * .82;
  if (note.body !== null && note.body !== undefined) y = 12 + note.body * .76;
  return { x: Math.max(9, Math.min(91, x)), y: Math.max(12, Math.min(88, y)), source: note.flavor != null || note.body != null ? "brew note + estimate" : "estimated position" };
}
function pointColor(index) { return ["#58705a", "#b6754f", "#7b7994", "#a18a4d", "#568494", "#a76060", "#6e8878", "#94709c"][index % 8]; }
function plotSVG(style) {
  const info = STYLE_INFO[style];
  const left = 44, right = 436, top = 27, bottom = 250;
  const coords = beans.map((bean, index) => {
    const p = position(bean, style);
    return { bean, index, x: left + (p.x / 100) * (right - left), y: bottom - (p.y / 100) * (bottom - top), color: pointColor(index) };
  });
  // Beans with similar notes land on the same spot; push overlapping dots apart so every bean stays visible.
  for (let pass = 0; pass < 60; pass++) {
    let moved = false;
    for (let a = 0; a < coords.length; a++) for (let b = a + 1; b < coords.length; b++) {
      let dx = coords[b].x - coords[a].x, dy = coords[b].y - coords[a].y;
      let dist = Math.hypot(dx, dy);
      if (dist >= 20) continue;
      if (dist < 0.01) { const angle = (b - a) * 2.4; dx = Math.cos(angle); dy = Math.sin(angle); dist = 1; }
      const push = (20 - dist) / 2 + 0.5;
      coords[a].x -= dx / dist * push; coords[a].y -= dy / dist * push;
      coords[b].x += dx / dist * push; coords[b].y += dy / dist * push;
      moved = true;
    }
    coords.forEach((c) => { c.x = Math.max(left + 10, Math.min(right - 10, c.x)); c.y = Math.max(top + 10, Math.min(bottom - 10, c.y)); });
    if (!moved) break;
  }
  const points = coords.map(({ bean, index, x, y, color }) => `<g class="plot-bean-point" data-bean-id="${esc(bean.id)}" tabindex="0" role="button" aria-label="Highlight ${esc(bean.name)}"><circle class="point-halo" cx="${x}" cy="${y}" r="10"/><circle class="point" cx="${x}" cy="${y}" r="7" fill="${color}"/><text class="point-index" x="${x}" y="${y}">${index + 1}</text><title>${esc(bean.name)} · ${esc(bean.roaster)} · ${position(bean, style).source}</title></g>`).join("");
  return `<svg class="taste-plot" viewBox="0 0 480 292" role="img" aria-label="${esc(info.label)} taste map. Left: fruit and floral. Right: chocolate and nut. Top: full-bodied. Bottom: delicate."><rect class="plot-bg" x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" rx="12"/><line class="grid-line" x1="${left + (right-left)/3}" y1="${top}" x2="${left + (right-left)/3}" y2="${bottom}"/><line class="grid-line" x1="${left + 2*(right-left)/3}" y1="${top}" x2="${left + 2*(right-left)/3}" y2="${bottom}"/><line class="grid-line" x1="${left}" y1="${top + (bottom-top)/3}" x2="${right}" y2="${top + (bottom-top)/3}"/><line class="grid-line" x1="${left}" y1="${top + 2*(bottom-top)/3}" x2="${right}" y2="${top + 2*(bottom-top)/3}"/><text class="axis-label" x="${left}" y="17">Bright · fruit · floral</text><text class="axis-label" x="${right}" y="17" text-anchor="end">Chocolate · nut</text><text class="axis-title" x="14" y="145" text-anchor="middle" transform="rotate(-90 14 145)">DELICATE ← BODY → FULL</text>${points || '<text class="plot-empty" x="240" y="145">Add coffees to place your beans here</text>'}</svg>`;
}
function mapCard(style) {
  const info = STYLE_INFO[style];
  const scores = beans.map((bean) => estimate(bean, style).score).filter(Number.isFinite);
  const avg = scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : "—";
  const legend = beans.map((bean, index) => `<div class="plot-bean" data-bean-id="${esc(bean.id)}"><span class="legend-dot" style="background:${pointColor(index)}"></span><button type="button" data-action="highlight" data-bean-id="${esc(bean.id)}">${index + 1}. ${esc(bean.name)} · ${position(bean, style).source} · ${estimate(bean, style).score.toFixed(1)}/10 ${getRating(bean, style) === null ? "estimate" : "your rating"}</button>${bean.productUrl ? `<a class="legend-source" href="${esc(safeUrl(bean.productUrl))}" target="_blank" rel="noopener noreferrer" title="Open saved roaster / product page">source ↗</a>` : ""}</div>`).join("");
  return `<article class="profile-map-card ${info.className}"><div class="profile-map-top"><div><h3>${esc(info.label)}</h3><p>${esc(info.subtitle)}</p></div><span class="map-illustration" aria-hidden="true">${info.icon}</span></div><div class="plot-wrap">${plotSVG(style)}</div><div class="map-score-note"><strong>${avg}/10</strong> average of personal scores and estimates. Ratings do not determine the position.</div><div class="plot-legend">${legend || '<span class="plot-bean">No saved beans yet.</span>'}</div></article>`;
}
function comparisonPlot(bean) {
  const left = 44, right = 436, top = 27, bottom = 250;
  const positions = STYLES.map((style) => {
    const p = position(bean, style);
    return { style, x: left + p.x / 100 * (right - left), y: bottom - p.y / 100 * (bottom - top), source: p.source };
  });
  const markers = positions.map(({ style, x, y, source }, index) => {
    const previous = positions.slice(0, index).filter((other) => Math.abs(other.x - x) < 14 && Math.abs(other.y - y) < 14).length;
    const offset = previous * 14;
    const personal = source === "your position";
    return `<g><circle cx="${x + offset}" cy="${y}" r="11" fill="${personal ? STYLE_INFO[style].color : "#fff"}" stroke="${STYLE_INFO[style].color}" stroke-width="2" ${personal ? "" : 'stroke-dasharray="3 2"'} /><text x="${x + offset}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="${personal ? "#fff" : "#333"}">${index + 1}</text><title>${esc(STYLE_INFO[style].label)}: ${source}</title></g>`;
  }).join("");
  return `<svg class="taste-plot comparison-plot" viewBox="0 0 480 280" role="img" aria-label="Drink comparison for ${esc(bean.name)}. Left fruit and floral; right chocolate and nut. Top full-bodied; bottom delicate."><rect class="plot-bg" x="${left}" y="${top}" width="${right-left}" height="${bottom-top}" rx="12"/><line class="grid-line" x1="240" y1="${top}" x2="240" y2="${bottom}"/><line class="grid-line" x1="${left}" y1="138" x2="${right}" y2="138"/><text class="axis-label" x="${left}" y="17">Bright · fruit · floral</text><text class="axis-label" x="${right}" y="17" text-anchor="end">Chocolate · nut</text><text class="axis-title" x="14" y="145" text-anchor="middle" transform="rotate(-90 14 145)">DELICATE ← BODY → FULL</text>${markers}</svg>`;
}
function options(values, selected) {
  return values.map(([value, label]) => `<option value="${esc(value)}"${String(value) === String(selected ?? "") ? " selected" : ""}>${esc(label)}</option>`).join("");
}
function renderComparison(message = "") {
  if (!beans.length) {
    comparisonRoot.innerHTML = '<div class="empty-map-state">Add a coffee to compare its drinks. <a href="./index.html#library">Go to My collection →</a></div>';
    return;
  }
  const bean = beans.find((item) => String(item.id) === String(comparisonBeanId)) || beans[0];
  comparisonBeanId = String(bean.id);
  const saved = personalTaste(bean, comparisonStyle);
  const currentNotes = loggedInfo(bean, comparisonStyle).lastNote;
  const legend = STYLES.map((style, index) => {
    const taste = personalTaste(bean, style);
    const rating = getRating(bean, style);
    const note = taste?.notes || loggedInfo(bean, style).lastNote;
    const bitterness = taste ? taste.bitterness : noteTaste(bean, style).bitterness;
    return `<li><span class="comparison-number" style="border-color:${STYLE_INFO[style].color};color:${STYLE_INFO[style].color}">${index + 1}</span><div><strong>${esc(STYLE_INFO[style].label)}</strong> · ${position(bean, style).source}${rating === null ? "" : ` · your rating ${rating.toFixed(1)}/10`}${bitterness ? ` · bitterness: ${esc(bitterness)}${taste ? "" : " (from note)"}` : ""}${note ? `<p>${esc(note)}</p>` : ""}</div></li>`;
  }).join("");
  const steps = [["", "Choose…"], ["0", "Bright / fruity / floral"], ["25", "Mostly bright / fruity"], ["50", "Balanced / other"], ["75", "Mostly chocolate / nut"], ["100", "Chocolate / nut"]];
  const bodies = [["", "Choose…"], ["0", "Very delicate / thin"], ["25", "Light"], ["50", "Medium"], ["75", "Full"], ["100", "Very full / deep"]];
  const bitterness = [["", "Not recorded"], ["none", "None"], ["slight", "Slight"], ["moderate", "Moderate"], ["strong", "Strong"]];
  comparisonRoot.innerHTML = `<div class="taste-comparison"><label class="comparison-select">Coffee<select id="compareBean">${options(beans.map((item) => [String(item.id), `${item.name} · ${item.roaster}`]), bean.id)}</select></label><div class="comparison-layout"><div>${comparisonPlot(bean)}<p class="comparison-caption">Filled = your position · dashed = estimate or interpretation of your latest brew note. Missing axes use estimates. Overlapping markers may be shifted slightly.</p><ol class="comparison-legend">${legend}</ol></div><form id="tasteForm" class="taste-form"><h3>Describe your cup</h3><p>Save a separate impression for each drink to correct the interpretation. This does not change your cup rating or recipe.</p><label>Drink style<select name="style">${options(STYLES.map((style) => [style, STYLE_INFO[style].label]), comparisonStyle)}</select></label><label>Flavour direction<select name="flavor" required>${options(steps, saved?.flavor)}</select></label><label>Body / depth<select name="body" required>${options(bodies, saved?.body)}</select></label><label>Bitterness<select name="bitterness">${options(bitterness, saved?.bitterness)}</select></label><label>What did you taste?<textarea name="notes" rows="3" maxlength="500" placeholder="e.g. Nutella, creamy; or less depth, slightly bitter">${esc(saved?.notes || "")}</textarea></label>${currentNotes ? `<p class="comparison-previous">Latest brew note for this drink: “${esc(currentNotes)}”</p>` : ""}<button class="button button-dark" type="submit">Save taste impression</button><p class="comparison-message" role="status">${esc(message)}</p></form></div></div>`;
}
function predictionCard(bean) {
  const source = safeUrl(bean.productUrl || "");
  const styles = STYLES.map((style) => {
    const result = estimate(bean, style);
    const taste = personalTaste(bean, style);
    return `<article class="prediction-drink"><small>${esc(STYLE_INFO[style].label)}</small><strong>${result.score.toFixed(1)} / 10 · ${result.source === "your logged cup" ? "your score" : "estimate"}</strong>${taste?.notes ? `<p>Your taste: ${esc(taste.notes)}</p>` : ""}${taste?.bitterness ? `<p>Bitterness: ${esc(taste.bitterness)}</p>` : ""}<p>${esc(result.taste)}</p></article>`;
  }).join("");
  const notes = getNotes(bean).map((note) => `<span class="tag">${esc(note)}</span>`).join("") || '<span class="tag">No official notes saved yet</span>';
  const ranked = STYLES.map((style) => ({ style, score: estimate(bean, style).score })).sort((a, b) => b.score - a.score);
  const best = getNotes(bean).length || ranked.some((entry) => getRating(bean, entry.style) !== null) ? `<p class="prediction-best">Best as: <strong>${esc(STYLE_INFO[ranked[0].style].label)}</strong> (${ranked[0].score.toFixed(1)}/10) · weakest: ${esc(STYLE_INFO[ranked[ranked.length - 1].style].label)} (${ranked[ranked.length - 1].score.toFixed(1)}/10)</p>` : "";
  const confidence = STYLES.map((style) => estimate(bean, style).confidence)[0];
  return `<article class="prediction-card" data-bean-id="${esc(bean.id)}"><div class="prediction-header"><div><h3>${esc(bean.name)}</h3><p>${esc(bean.roaster)}${bean.roasterLocation ? ` · ${esc(bean.roasterLocation)}` : ""}${bean.roastLevel ? ` · ${esc(bean.roastLevel)} roast` : ""}</p></div>${source ? `<a class="prediction-source" href="${esc(source)}" target="_blank" rel="noopener noreferrer">Open saved source ↗</a>` : "<span class=\"prediction-source\">No source URL saved</span>"}</div><div class="prediction-notes">${notes}</div>${best}<div class="prediction-drinks">${styles}</div><p class="prediction-confidence">${esc(confidence)} Estimates use only saved flavor notes and roast level. The product URL is shown as a reference link; GitHub Pages does not fetch or verify that website.</p></article>`;
}
function highlightBean(id) {
  activeBeanId = id;
  comparisonBeanId = String(id);
  renderComparison();
  document.querySelectorAll("[data-bean-id]").forEach((element) => element.classList.toggle("is-filtered-out", element.dataset.beanId !== id));
  document.querySelectorAll(".prediction-card").forEach((element) => element.classList.toggle("is-highlighted", element.dataset.beanId === id));
}
function render() {
  $("#mapCount").textContent = beans.length ? `${beans.length} ${beans.length === 1 ? "saved coffee" : "saved coffees"} plotted on each map` : "Add beans to see your personal taste maps";
  if (!beans.length) {
    renderComparison();
    const message = '<div class="empty-map-state">No saved coffees yet. Add a bean from your collection first; it will appear here automatically.<br /><a href="./index.html#library">Go to My collection →</a></div>';
    mapRoot.innerHTML = STYLES.map((style) => `<article class="profile-map-card ${STYLE_INFO[style].className}"><div class="profile-map-top"><div><h3>${esc(STYLE_INFO[style].label)}</h3><p>${esc(STYLE_INFO[style].subtitle)}</p></div><span class="map-illustration">${STYLE_INFO[style].icon}</span></div>${message}</article>`).join("");
    predictionRoot.innerHTML = message;
    return;
  }
  mapRoot.innerHTML = STYLES.map(mapCard).join("");
  predictionRoot.innerHTML = beans.map(predictionCard).join("");
  renderComparison();
  if (activeBeanId && beans.some((bean) => bean.id === activeBeanId)) highlightBean(activeBeanId);
}
function safeUrl(value) {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : ""; }
  catch { return ""; }
}
comparisonRoot.addEventListener("change", (event) => {
  if (event.target.id === "compareBean") highlightBean(event.target.value);
  if (event.target.name === "style") { comparisonStyle = event.target.value; renderComparison(); }
});
comparisonRoot.addEventListener("submit", (event) => {
  if (event.target.id !== "tasteForm") return;
  event.preventDefault();
  const form = event.target;
  const values = new FormData(form);
  const style = String(values.get("style"));
  const flavor = String(values.get("flavor"));
  const body = String(values.get("body"));
  const bitterness = String(values.get("bitterness"));
  const validSteps = ["0", "25", "50", "75", "100"];
  if (!STYLES.includes(style) || !validSteps.includes(flavor) || !validSteps.includes(body) || !["", "none", "slight", "moderate", "strong"].includes(bitterness)) {
    form.querySelector(".comparison-message").textContent = "Choose a flavour direction and body to save your impression.";
    return;
  }
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!Array.isArray(stored)) throw new Error("Journal not found");
    const bean = stored.find((item) => String(item.id) === comparisonBeanId);
    if (!bean) throw new Error("Coffee not found");
    bean.tasteProfiles = { ...bean.tasteProfiles, [style]: { flavor: Number(flavor), body: Number(body), bitterness, notes: String(values.get("notes") || "").trim() } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    beans = normalize(stored);
    render();
    comparisonRoot.querySelector(".comparison-message").textContent = "Taste impression saved.";
  } catch (error) {
    console.warn("Could not save taste impression", error);
    form.querySelector(".comparison-message").textContent = "Could not save your impression. Check browser storage and try again.";
  }
});
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
window.addEventListener("pageshow", (event) => {
  if (event.persisted) { beans = loadBeans(); render(); }
});
render();
