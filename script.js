const STORAGE_KEY = "daily-pour-coffee-journal-v4";
const LEGACY_KEYS = ["daily-pour-coffee-journal-v3", "daily-pour-coffee-journal-v2", "daily-pour-coffee-journal-v1"];
const DRINK_STYLES = ["black", "milk", "oat"];
const TASTE_GROUPS = [
  { name: "Bright & floral", words: ["floral", "jasmine", "bergamot", "tea", "blossom", "blüte"] },
  { name: "Citrus & fruit", words: ["citrus", "lemon", "orange", "berry", "grape", "apple", "peach", "cherry", "fruit", "zitrus", "beere", "kirsche", "pfirsich"] },
  { name: "Chocolate & caramel", words: ["chocolate", "cocoa", "caramel", "toffee", "brown sugar", "chocolade", "karamell", "kakao"] },
  { name: "Nutty & sweet", words: ["nut", "hazelnut", "almond", "honey", "sweet", "nuss", "haselnuss", "honig"] },
  { name: "Deep & earthy", words: ["earth", "cedar", "spice", "tobacco", "erdig", "holz", "würzig"] }
];
const seedBeans = [
  { id: "sample-1", name: "Yirgacheffe Sunrise", roaster: "Cedar & Co.", roasterLocation: "", origin: "Ethiopia", roastDate: "2026-10-22", roastLevel: "Light", method: "Espresso", profile: ["floral", "citrus", "tea-like", "bergamot"], rating: 8.8, productUrl: "", recipe: {}, brews: [], favorite: false, addedAt: "2026-10-22T10:00:00.000Z" },
  { id: "sample-2", name: "Maya Estate", roaster: "Horizon Roasters", roasterLocation: "", origin: "Colombia", roastDate: "2026-10-18", roastLevel: "Medium", method: "Espresso", profile: ["caramel", "red apple", "brown sugar", "orange"], rating: 8.2, productUrl: "", recipe: {}, brews: [], favorite: false, addedAt: "2026-10-18T10:00:00.000Z" },
  { id: "sample-3", name: "Monsoon Reserve", roaster: "Wild Bean House", roasterLocation: "", origin: "India", roastDate: "2026-10-12", roastLevel: "Medium-dark", method: "Espresso", profile: ["dark chocolate", "cocoa", "cedar", "brown sugar"], rating: 7.6, productUrl: "", recipe: {}, brews: [], favorite: false, addedAt: "2026-10-12T10:00:00.000Z" },
  { id: "sample-4", name: "Velvet Cherry", roaster: "North Roast", roasterLocation: "", origin: "Brazil", roastDate: "2026-10-27", roastLevel: "Medium", method: "Espresso", profile: ["chocolate", "cherry", "toffee", "jam"], rating: 8.5, productUrl: "", recipe: {}, brews: [], favorite: false, addedAt: "2026-10-27T10:00:00.000Z" }
];
let beans = loadBeans();
let selectedBeanId = beans[0]?.id ?? null;
let activeBrewBeanId = null;
let toastTimer;
const $ = (selector) => document.querySelector(selector);
const beanGrid = $("#beanGrid");
const detailPanel = $("#detailPanel");
const beanDialog = $("#beanDialog");
const brewDialog = $("#brewDialog");

function starterRecipe(bean) {
  const notes = (bean.profile || []).join(" ").toLowerCase();
  const roast = (bean.roastLevel || "Medium").toLowerCase();
  const method = bean.method || "Espresso";
  const methodLower = method.toLowerCase();
  const bright = roast.includes("light") || /citrus|floral|berry|fruit|grape|lemon|peach|zitrus|blüte|beere/.test(notes);
  const dark = roast.includes("dark") || /chocolate|cocoa|caramel|toffee|chocolade|kakao|karamell/.test(notes);
  const isFilter = ["pour over", "v60", "aeropress", "aero press", "filter", "french press", "clever"].some((item) => methodLower.includes(item));
  if (isFilter) {
    const frenchPress = methodLower.includes("french");
    const dose = frenchPress ? 20 : 15;
    return { dose, output: frenchPress ? 320 : 250, grind: frenchPress ? "Coarse; tune to your grinder" : "Medium-fine; tune to your grinder", water: bright ? "94°C" : dark ? "90°C" : "92°C", method, preInfusion: frenchPress ? "Steep 4 min" : "Bloom 30s", pressure: "", pressureProfile: "Not applicable for this brew method", guidance: "Suggested filter starting point based on brew method, roast and tasting notes. Adjust water and grind to your equipment and taste." };
  }
  const dose = 18;
  const output = bright ? 42 : dark ? 36 : 40;
  return { dose, output, grind: "Dial in for your grinder", water: bright ? "94°C" : dark ? "92°C" : "93°C", method, preInfusion: bright ? "8s" : "5s", pressure: 9, pressureProfile: bright ? "Gentle pre-infusion → 9 bar (machine dependent)" : "Aim for 9 bar (machine dependent)", drinkStyle: "black", guidance: `Espresso starting point: ${dose}g in → ${output}g out, about 1:${(output / dose).toFixed(1)} at 9 bar. Machine pressure and pre-infusion vary; adjust to taste.` };
}
function normalizeBeans(items, oldFivePointScale = false) {
  if (!Array.isArray(items)) return structuredClone(seedBeans).map((bean) => ({ ...bean, recipe: starterRecipe(bean) }));
  return items.map((bean) => {
    const normalized = { ...bean, profile: Array.isArray(bean.profile) ? bean.profile : [], brews: Array.isArray(bean.brews) ? bean.brews : [] };
    if (oldFivePointScale) {
      const old = Number(normalized.rating);
      normalized.rating = Number.isFinite(old) && old > 0 ? old * 2 : null;
      normalized.brews = normalized.brews.map((brew) => { const score = Number(brew.rating); return { ...brew, rating: Number.isFinite(score) && score > 0 ? score * 2 : null }; });
    }
    const suggestion = starterRecipe(normalized);
    normalized.recipe = normalized.recipe && Object.keys(normalized.recipe).length ? { ...suggestion, ...normalized.recipe } : suggestion;
    normalized.brews = normalized.brews.map((brew) => ({ ...brew, drinkStyle: DRINK_STYLES.includes(brew.drinkStyle) ? brew.drinkStyle : "black" }));
    return normalized;
  });
}
function loadBeans() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeBeans(JSON.parse(saved));
    for (const key of LEGACY_KEYS) {
      const old = localStorage.getItem(key);
      if (old) { const migrated = normalizeBeans(JSON.parse(old), key.endsWith("v1")); localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); return migrated; }
    }
    return normalizeBeans(seedBeans);
  } catch (error) { console.warn("Could not load coffee journal", error); return normalizeBeans(seedBeans); }
}
function saveBeans() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(beans)); return true; }
  catch (error) { showToast("Could not save: browser storage might be unavailable."); return false; }
}
function escapeHTML(value = "") { return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("visible"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600); }
function getRating(bean) {
  const rated = (bean.brews || []).map((brew) => brew.rating).filter((value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))).map(Number);
  if (rated.length) return rated.reduce((sum, value) => sum + value, 0) / rated.length;
  const value = bean.rating;
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
}
function getCluster(bean) {
  const notes = (bean.profile || []).join(" ").toLowerCase();
  let best = { name: "Balanced & sweet", score: 0 };
  for (const group of TASTE_GROUPS) { const score = group.words.reduce((sum, word) => sum + (notes.includes(word) ? 1 : 0), 0); if (score > best.score) best = { name: group.name, score }; }
  return best.name;
}
function getTasteNotes(bean) { return (bean.profile || []).map((note) => note.trim()).filter(Boolean); }
function getDrinkProfile(bean, style) {
  const ratedBrews = (bean.brews || []).filter((brew) => brew.drinkStyle === style && brew.rating !== null && brew.rating !== undefined && brew.rating !== "" && Number.isFinite(Number(brew.rating)));
  if (ratedBrews.length) return { score: ratedBrews.reduce((sum, brew) => sum + Number(brew.rating), 0) / ratedBrews.length, source: `${ratedBrews.length} personal ${ratedBrews.length === 1 ? "rating" : "ratings"}` };
  const notes = getTasteNotes(bean).join(" ").toLowerCase();
  const roast = (bean.roastLevel || "").toLowerCase();
  const has = (words) => words.some((word) => notes.includes(word));
  const chocolate = has(["chocolate", "cocoa", "cacao", "caramel", "toffee", "chocolade", "kakao", "karamell"]);
  const sweetNut = has(["sweet", "honey", "nut", "almond", "hazelnut", "nuss", "honig"]);
  const fruitBright = has(["citrus", "lemon", "orange", "berry", "grape", "apple", "peach", "cherry", "floral", "jasmine", "zitrus", "beere"]);
  let score = 6;
  if (style === "black") score += (fruitBright ? 1.6 : 0) + (has(["floral", "jasmine", "bergamot", "tea"]) ? 0.8 : 0) + (has(["chocolate", "cocoa", "caramel", "kakao"]) ? 0.3 : 0);
  if (style === "milk") score += (chocolate ? 1.5 : 0) + (sweetNut ? 1.1 : 0) - (has(["lemon", "citrus", "floral", "jasmine"]) ? 0.7 : 0);
  if (style === "oat") score += (chocolate ? 1.0 : 0) + (sweetNut ? 1.0 : 0) + (has(["berry", "cherry", "apple", "peach"]) ? 0.5 : 0) - (has(["lemon", "citrus"]) ? 0.3 : 0);
  if (roast.includes("dark") && style !== "black") score += 0.4;
  if (!getTasteNotes(bean).length) score = 6;
  return { score: Math.max(0, Math.min(10, score)), source: "flavour-note estimate" };
}
function drinkLabel(style) { return ({ black: "Espresso · black", milk: "With dairy milk", oat: "With oat milk" })[style] || "Espresso · black"; }
function formatDate(value) {
  if (!value) return "Date not set";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? escapeHTML(value) : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function safeUrl(url) { try { const parsed = new URL(url); return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : ""; } catch { return ""; } }
function showRating(value) { return value === null ? "Not rated" : `${Number(value).toFixed(1)} / 10`; }
function renderStats() {
  const ratings = beans.map(getRating).filter((rating) => rating !== null);
  $("#beanCount").textContent = beans.length;
  $("#avgRating").textContent = ratings.length ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : "—";
  $("#clusterCount").textContent = new Set(beans.map(getCluster)).size;
  $("#brewCount").textContent = beans.reduce((sum, bean) => sum + (bean.brews?.length || 0), 0);
}
function renderTasteOverview() {
  const counts = new Map();
  beans.forEach((bean) => getTasteNotes(bean).forEach((note) => { const key = note.toLocaleLowerCase(); const prior = counts.get(key) || { note, count: 0 }; prior.count += 1; counts.set(key, prior); }));
  const ordered = [...counts.values()].sort((a, b) => b.count - a.count || a.note.localeCompare(b.note)).slice(0, 12);
  const container = $("#tasteOverview");
  if (!ordered.length) { container.innerHTML = '<div class="taste-overview-empty"><span>☕</span><strong>Your taste profile is waiting for its first bean.</strong><p>Add coffees and their roaster tasting notes; this overview will show the flavours recurring in your collection.</p><button class="button button-dark" data-action="add-first">＋ Add a coffee</button></div>'; return; }
  const max = ordered[0].count;
  container.innerHTML = `<div class="taste-overview-intro"><span class="taste-overview-icon">✳</span><div><strong>${beans.length} ${beans.length === 1 ? "coffee" : "coffees"} in your journal</strong><p>These are the tasting notes appearing across the beans you have saved.</p></div></div><div class="taste-note-cloud">${ordered.map(({ note, count }) => `<span class="taste-note-chip"><span>${escapeHTML(note)}</span><b>${count}</b></span>`).join("")}</div><div class="taste-family-bars">${TASTE_GROUPS.map((group) => { const count = beans.filter((bean) => getCluster(bean) === group.name).length; return count ? `<div class="taste-family-row"><span>${escapeHTML(group.name)}</span><span class="taste-bar"><i style="width:${Math.max(8, count / beans.length * 100)}%"></i></span><b>${count}</b></div>` : ""; }).join("")}</div><p class="taste-footnote">This reflects the coffees you’ve logged, not a formal palate test. Add your own brew ratings to make drink suggestions more personal.</p>`;
}
function filteredBeans() {
  const term = $("#searchInput").value.trim().toLowerCase();
  const group = $("#clusterFilter").value;
  const sort = $("#sortSelect").value;
  const result = beans.filter((bean) => { const text = [bean.name, bean.roaster, bean.roasterLocation, bean.origin, ...(bean.profile || [])].join(" ").toLowerCase(); return (!term || text.includes(term)) && (group === "all" || getCluster(bean) === group); });
  result.sort((a, b) => { if (sort === "name") return a.name.localeCompare(b.name); if (sort === "roast") return (b.roastDate || "").localeCompare(a.roastDate || ""); if (sort === "recent") return (b.addedAt || "").localeCompare(a.addedAt || ""); return (getRating(b) ?? -1) - (getRating(a) ?? -1) || a.name.localeCompare(b.name); });
  return result;
}
function renderFilter() {
  const filter = $("#clusterFilter"); const previous = filter.value; const groups = [...new Set(beans.map(getCluster))].sort();
  filter.innerHTML = '<option value="all">All taste groups</option>' + groups.map((group) => `<option value="${escapeHTML(group)}">${escapeHTML(group)}</option>`).join("");
  filter.value = groups.includes(previous) ? previous : "all";
}
function renderBeans() {
  const filtered = filteredBeans(); $("#visibleCount").textContent = filtered.length;
  if (!filtered.length) { beanGrid.innerHTML = `<div class="empty-results">${beans.length ? "No coffees match those filters." : "Your collection is ready. Add a coffee to see it here."}</div>`; return; }
  beanGrid.innerHTML = filtered.map((bean) => {
    const rating = getRating(bean); const tags = getTasteNotes(bean).slice(0, 3).map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("");
    return `<article class="bean-card ${bean.id === selectedBeanId ? "is-selected" : ""}" data-id="${escapeHTML(bean.id)}" tabindex="0" aria-label="View ${escapeHTML(bean.name)} details"><div class="bean-topline"><span class="origin-label">${escapeHTML(bean.origin || "Origin unknown")}${bean.roastDate ? ` · ${formatDate(bean.roastDate)}` : ""}</span><button class="favorite-button ${bean.favorite ? "is-favorite" : ""}" data-action="favorite" data-id="${escapeHTML(bean.id)}" aria-label="${bean.favorite ? "Remove from" : "Add to"} favorites">${bean.favorite ? "♥" : "♡"}</button></div><h3>${escapeHTML(bean.name)}</h3><div class="bean-roaster">${escapeHTML(bean.roaster)}${bean.roasterLocation ? ` · ${escapeHTML(bean.roasterLocation)}` : ""}</div><div class="profile-tags">${tags || '<span class="tag">Add tasting notes</span>'}</div><div class="bean-bottomline"><span class="cluster-label">${escapeHTML(getCluster(bean))}</span><span class="rating-label">${showRating(rating)}</span></div></article>`;
  }).join("");
}
function renderDrinkProfiles(bean) {
  return DRINK_STYLES.map((style) => {
    const result = getDrinkProfile(bean, style);
    return `<article class="drink-profile-card"><div class="drink-profile-top"><span>${escapeHTML(drinkLabel(style))}</span><strong>${result.score.toFixed(1)}<small>/10</small></strong></div><div class="drink-score-track"><i style="width:${result.score * 10}%"></i></div><p>${escapeHTML(result.source)}</p></article>`;
  }).join("");
}
function renderDetail() {
  const bean = beans.find((item) => item.id === selectedBeanId);
  if (!bean) { detailPanel.innerHTML = '<div class="detail-empty"><div><div class="empty-cup">☕</div><strong>Select a coffee from My collection</strong><p>Your taste profile, drink suggestions and recipe will appear here.</p></div></div>'; return; }
  const rating = getRating(bean); const recipe = bean.recipe || starterRecipe(bean); const ratio = recipe.dose && recipe.output ? `1:${(Number(recipe.output) / Number(recipe.dose)).toFixed(1)}` : "—"; const productUrl = safeUrl(bean.productUrl || ""); const recent = [...(bean.brews || [])].reverse().slice(0, 3);
  const metric = (label, value) => `<div class="recipe-metric"><small>${label}</small><strong>${escapeHTML(value || "—")}</strong></div>`;
  detailPanel.innerHTML = `<div class="detail-title"><div><h3>${escapeHTML(bean.name)}</h3><p>${escapeHTML(bean.roaster)}${bean.roasterLocation ? ` · ${escapeHTML(bean.roasterLocation)}` : ""}</p></div><div class="detail-actions"><button class="icon-button" data-action="favorite" data-id="${escapeHTML(bean.id)}" aria-label="Toggle favorite">${bean.favorite ? "♥" : "♡"}</button><button class="icon-button" data-action="delete" data-id="${escapeHTML(bean.id)}" aria-label="Delete coffee">⌫</button></div></div>
    <div class="detail-rating">${showRating(rating)} <span style="color:var(--muted);font-weight:500">· ${escapeHTML(bean.roastLevel || "Roast level not set")}</span></div>
    <div class="detail-section"><h4>Roaster's taste notes</h4><div class="profile-tags">${getTasteNotes(bean).map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("") || '<span class="tag">No tasting notes saved</span>'}</div><p class="taste-copy">Taste family: ${escapeHTML(getCluster(bean))}. These are the roaster’s stated notes, not guaranteed flavours.</p></div>
    <div class="detail-section"><h4>How might you like it?</h4><p class="drink-profile-explainer">Starting estimates from the tasting notes. After you log ratings for each style, your own results replace the estimates.</p><div class="drink-profile-grid">${renderDrinkProfiles(bean)}</div></div>
    <div class="detail-section"><h4>Your recipe${bean.brews?.length ? " · latest version" : " · suggested start"}</h4><div class="recipe-metrics">${metric("In", `${recipe.dose || "—"}g`)}${metric(`Out · ${ratio}`, `${recipe.output || "—"}g`)}${metric("Grind", recipe.grind)}${metric("Pre-infusion / bloom", recipe.preInfusion)}${metric("Water", recipe.water)}${metric("Method", recipe.method)}${metric("Pressure", recipe.pressure ? `${recipe.pressure} bar` : "Not applicable")}${metric("Pressure profile", recipe.pressureProfile)}</div>${!bean.brews?.length && recipe.guidance ? `<p class="taste-copy">${escapeHTML(recipe.guidance)}</p>` : ""}</div>
    ${recent.length ? `<div class="detail-section"><h4>Recent cups</h4><div class="brew-history">${recent.map((brew) => `<article class="brew-entry"><div class="brew-entry-top"><span>${formatDate(brew.date)} · ${escapeHTML(drinkLabel(brew.drinkStyle))}</span><span>${brew.rating === null || brew.rating === undefined ? "Unrated" : `${Number(brew.rating).toFixed(1)} / 10`}</span></div><p>${escapeHTML(brew.notes || `${brew.dose}g in → ${brew.output}g out · grind ${brew.grind || "—"}`)}${brew.pressure ? ` · ${escapeHTML(brew.pressure)} bar` : ""}</p></article>`).join("")}</div></div>` : ""}
    <div class="detail-footer"><button class="button button-dark small-button" data-action="brew" data-id="${escapeHTML(bean.id)}">✎ Adjust recipe / log brew</button>${productUrl ? `<a class="text-link" href="${escapeHTML(productUrl)}" target="_blank" rel="noopener noreferrer">Visit roastery page ↗</a>` : `<a class="text-link" href="https://www.google.com/search?q=${encodeURIComponent(`${bean.roaster} ${bean.roasterLocation || ""} ${bean.name} coffee`)}" target="_blank" rel="noopener noreferrer">Search roastery ↗</a>`}</div>`;
}
function renderClusters() {
  const groups = new Map();
  for (const bean of beans) { const group = getCluster(bean); if (!groups.has(group)) groups.set(group, []); groups.get(group).push(bean); }
  $("#clusterGrid").innerHTML = groups.size ? [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, members]) => {
    const notes = [...new Set(members.flatMap((bean) => getTasteNotes(bean)))].slice(0, 4); const ratings = members.map(getRating).filter((rating) => rating !== null); const average = ratings.length ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1) : "—";
    return `<article class="cluster-card"><p class="eyebrow">taste family</p><h3>${escapeHTML(name)}</h3><p>${notes.map(escapeHTML).join(" · ") || "Add tasting notes to describe this group."}</p><footer><span>${members.length} ${members.length === 1 ? "coffee" : "coffees"} · avg ${average}${average !== "—" ? " / 10" : ""}</span><button data-action="filter-cluster" data-cluster="${escapeHTML(name)}">Explore →</button></footer></article>`;
  }).join("") : '<div class="empty-results">Add coffees with tasting notes to see their groups.</div>';
}
function render() { renderFilter(); renderStats(); renderTasteOverview(); renderBeans(); renderDetail(); renderClusters(); }
function openBeanDialog() { $("#beanForm").reset(); beanDialog.showModal(); }
function updateRatingDisplay() { const checkbox = $("#unratedCheckbox"); const input = $("#ratingInput"); const output = $("#ratingOutput"); input.disabled = checkbox.checked; output.textContent = checkbox.checked ? "Not rated" : Number(input.value).toFixed(1); }
function openBrewDialog(id) {
  const bean = beans.find((item) => item.id === id); if (!bean) return;
  activeBrewBeanId = id; const form = $("#brewForm"); form.reset(); const recipe = bean.recipe && Object.keys(bean.recipe).length ? bean.recipe : starterRecipe(bean);
  form.elements.dose.value = recipe.dose || 18; form.elements.output.value = recipe.output || 40; form.elements.grind.value = recipe.grind || ""; form.elements.water.value = recipe.water || ""; form.elements.method.value = recipe.method || bean.method || "Espresso"; form.elements.drinkStyle.value = DRINK_STYLES.includes(recipe.drinkStyle) ? recipe.drinkStyle : "black"; form.elements.preInfusion.value = recipe.preInfusion || ""; form.elements.pressure.value = recipe.pressure ?? ""; form.elements.pressureProfile.value = recipe.pressureProfile || "";
  $("#unratedCheckbox").checked = true; $("#brewBeanName").textContent = `Starting with ${bean.name} from ${bean.roaster}. Edit settings to match what you taste.`; $("#recipeSuggestion").textContent = recipe.guidance || "Your last saved recipe is loaded. Adjust it for this brew; saving makes it this bean's new latest version."; updateRatingDisplay(); brewDialog.showModal();
}
function attachEvents() {
  $("#addBeanButton").addEventListener("click", openBeanDialog); $("#introAddButton").addEventListener("click", openBeanDialog);
  $("#searchRoasteryButton").addEventListener("click", () => { const form = $("#beanForm"); const name = form.elements.roaster.value.trim(); const location = form.elements.roasterLocation.value.trim(); if (!name) { form.elements.roaster.focus(); showToast("Enter a roastery name first."); return; } window.open(`https://www.google.com/search?q=${encodeURIComponent(`${name} ${location} official roastery coffee`)}`, "_blank", "noopener,noreferrer"); });
  $("#beanForm").addEventListener("submit", (event) => { event.preventDefault(); const values = new FormData(event.currentTarget); const bean = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name: values.get("name").trim(), roaster: values.get("roaster").trim(), roasterLocation: values.get("roasterLocation").trim(), origin: values.get("origin").trim(), roastDate: values.get("roastDate"), roastLevel: values.get("roastLevel"), method: values.get("method"), profile: values.get("profile").split(",").map((note) => note.trim()).filter(Boolean), rating: null, productUrl: values.get("productUrl").trim(), recipe: {}, brews: [], favorite: false, addedAt: new Date().toISOString() }; bean.recipe = starterRecipe(bean); beans.unshift(bean); selectedBeanId = bean.id; saveBeans(); render(); beanDialog.close(); showToast("Coffee added to My collection with a suggested recipe."); });
  $("#brewForm").addEventListener("submit", (event) => { event.preventDefault(); const bean = beans.find((item) => item.id === activeBrewBeanId); if (!bean) return; const values = new FormData(event.currentTarget); const unrated = $("#unratedCheckbox").checked; const brew = { date: new Date().toISOString(), dose: Number(values.get("dose")), output: Number(values.get("output")), grind: values.get("grind").trim(), water: values.get("water").trim(), method: values.get("method").trim(), drinkStyle: DRINK_STYLES.includes(values.get("drinkStyle")) ? values.get("drinkStyle") : "black", preInfusion: values.get("preInfusion").trim(), pressure: values.get("pressure") === "" ? "" : Number(values.get("pressure")), pressureProfile: values.get("pressureProfile").trim(), rating: unrated ? null : Number(values.get("rating")), notes: values.get("notes").trim() }; bean.recipe = { ...brew, guidance: "Your latest personally adjusted recipe. Use it next time you brew this bean." }; bean.method = brew.method; bean.brews ||= []; bean.brews.push(brew); selectedBeanId = bean.id; saveBeans(); render(); brewDialog.close(); showToast("Latest recipe and drink-style rating saved for this bean."); });
  $("#ratingInput").addEventListener("input", updateRatingDisplay); $("#unratedCheckbox").addEventListener("change", updateRatingDisplay); $("#searchInput").addEventListener("input", render); $("#clusterFilter").addEventListener("change", render); $("#sortSelect").addEventListener("change", render);
  beanGrid.addEventListener("click", (event) => { const favorite = event.target.closest('[data-action="favorite"]'); if (favorite) { event.stopPropagation(); const bean = beans.find((item) => item.id === favorite.dataset.id); if (bean) { bean.favorite = !bean.favorite; saveBeans(); render(); } return; } const card = event.target.closest(".bean-card"); if (card) { selectedBeanId = card.dataset.id; render(); } });
  beanGrid.addEventListener("keydown", (event) => { if ((event.key === "Enter" || event.key === " ") && event.target.matches(".bean-card")) { event.preventDefault(); selectedBeanId = event.target.dataset.id; render(); } });
  detailPanel.addEventListener("click", (event) => { const button = event.target.closest("[data-action]"); if (!button) return; const bean = beans.find((item) => item.id === button.dataset.id); if (button.dataset.action === "brew") openBrewDialog(button.dataset.id); if (button.dataset.action === "favorite" && bean) { bean.favorite = !bean.favorite; saveBeans(); render(); } if (button.dataset.action === "delete" && bean && confirm(`Delete ${bean.name} and all of its brew history?`)) { beans = beans.filter((item) => item.id !== bean.id); selectedBeanId = beans[0]?.id ?? null; saveBeans(); render(); showToast("Coffee removed from your collection."); } });
  $("#tasteOverview").addEventListener("click", (event) => { if (event.target.closest('[data-action="add-first"]')) openBeanDialog(); });
  $("#clusterGrid").addEventListener("click", (event) => { const button = event.target.closest('[data-action="filter-cluster"]'); if (button) { $("#clusterFilter").value = button.dataset.cluster; render(); $("#library").scrollIntoView({ behavior: "smooth" }); } });
  $("#exportButton").addEventListener("click", () => { const file = new Blob([JSON.stringify(beans, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(file); link.download = "daily-pour-backup.json"; link.click(); URL.revokeObjectURL(link.href); showToast("Backup downloaded."); });
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
}
attachEvents();
render();
