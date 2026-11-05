const STORAGE_KEY = "daily-pour-coffee-journal-v3";
const LEGACY_KEYS = ["daily-pour-coffee-journal-v2", "daily-pour-coffee-journal-v1"];
const seedBeans = [
  { id: "sample-1", name: "Yirgacheffe Sunrise", roaster: "Cedar & Co.", roasterLocation: "", origin: "Ethiopia", roastDate: "2026-10-22", roastLevel: "Light", method: "Espresso", profile: ["floral", "citrus", "tea-like", "bergamot"], rating: 8.8, productUrl: "", recipe: {}, brews: [], favorite: false, addedAt: "2026-10-22T10:00:00.000Z" },
  { id: "sample-2", name: "Maya Estate", roaster: "Horizon Roasters", roasterLocation: "", origin: "Colombia", roastDate: "2026-10-18", roastLevel: "Medium", method: "Pour over", profile: ["caramel", "red apple", "brown sugar", "orange"], rating: 8.2, productUrl: "", recipe: {}, brews: [], favorite: false, addedAt: "2026-10-18T10:00:00.000Z" },
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
  const espresso = !["pour over", "v60", "aeropress", "aero press", "filter", "french press", "clever"].some((item) => methodLower.includes(item));

  if (!espresso) {
    const frenchPress = methodLower.includes("french");
    const dose = frenchPress ? 20 : 15;
    return {
      dose,
      output: frenchPress ? 320 : 250,
      grind: frenchPress ? "Coarse; tune to your grinder" : "Medium-fine; tune to your grinder",
      water: bright ? "94°C" : dark ? "90°C" : "92°C",
      method,
      preInfusion: frenchPress ? "Steep 4 min" : "Bloom 30s",
      pressure: "",
      pressureProfile: "Not applicable for this brew method",
      guidance: "Suggested filter starting point based on roast, tasting notes and method. Water and grind are starting points: adjust them to your equipment and taste."
    };
  }

  const dose = 18;
  const output = bright ? 42 : dark ? 36 : 40;
  const pressure = 9;
  return {
    dose,
    output,
    grind: "Dial in for your grinder",
    water: bright ? "94°C" : dark ? "92°C" : "93°C",
    method,
    preInfusion: bright ? "8s" : "5s",
    pressure,
    pressureProfile: bright ? "Gentle pre-infusion → 9 bar (machine dependent)" : "Aim for 9 bar (machine dependent)",
    guidance: `Espresso starting point: ${dose}g in → ${output}g out, about 1:${(output / dose).toFixed(1)} at ${pressure} bar. Pressure and pre-infusion depend on your machine; adjust to taste.`
  };
}

function normalizeBeans(items, legacy = false) {
  if (!Array.isArray(items)) return structuredClone(seedBeans).map((bean) => ({ ...bean, recipe: starterRecipe(bean) }));
  return items.map((bean) => {
    const normalized = { ...bean, profile: Array.isArray(bean.profile) ? bean.profile : [], brews: Array.isArray(bean.brews) ? bean.brews : [] };
    if (legacy) {
      const oldRating = Number(normalized.rating);
      normalized.rating = Number.isFinite(oldRating) && oldRating > 0 ? oldRating * 2 : null;
      normalized.brews = normalized.brews.map((brew) => {
        const oldBrewRating = Number(brew.rating);
        return { ...brew, rating: Number.isFinite(oldBrewRating) && oldBrewRating > 0 ? oldBrewRating * 2 : null };
      });
    }
    if (!normalized.recipe || !Object.keys(normalized.recipe).length) normalized.recipe = starterRecipe(normalized);
    else normalized.recipe = { ...starterRecipe(normalized), ...normalized.recipe };
    for (const brew of normalized.brews) {
      if (brew.pressure === undefined) brew.pressure = normalized.recipe.pressure ?? "";
      if (!brew.pressureProfile) brew.pressureProfile = normalized.recipe.pressureProfile || "";
    }
    return normalized;
  });
}

function loadBeans() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return normalizeBeans(JSON.parse(current));
    for (const key of LEGACY_KEYS) {
      const oldValue = localStorage.getItem(key);
      if (!oldValue) continue;
      const migrated = normalizeBeans(JSON.parse(oldValue), key.endsWith("v1"));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return normalizeBeans(seedBeans);
  } catch (error) {
    console.warn("Could not load saved coffee data", error);
    return normalizeBeans(seedBeans);
  }
}

function saveBeans() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(beans));
    return true;
  } catch (error) {
    showToast("Could not save: browser storage might be unavailable.");
    return false;
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function showToast(message) {
  const toast = $("#toast"); toast.textContent = message; toast.classList.add("visible"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}
function getRating(bean) {
  const rated = (bean.brews || []).map((brew) => brew.rating).filter((value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))).map(Number);
  if (rated.length) return rated.reduce((sum, value) => sum + value, 0) / rated.length;
  const value = bean.rating;
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
}
function getCluster(bean) {
  const notes = (bean.profile || []).join(" ").toLowerCase();
  const groups = [
    { name: "Bright & floral", words: ["floral", "jasmine", "bergamot", "tea", "blossom", "blüte"] },
    { name: "Citrus & fruit", words: ["citrus", "lemon", "orange", "berry", "grape", "apple", "peach", "cherry", "fruit", "zitrus", "beere", "kirsche", "pfirsich"] },
    { name: "Chocolate & caramel", words: ["chocolate", "cocoa", "caramel", "toffee", "brown sugar", "chocolade", "karamell", "kakao"] },
    { name: "Nutty & sweet", words: ["nut", "hazelnut", "almond", "honey", "sweet", "nuss", "haselnuss", "honig"] },
    { name: "Deep & earthy", words: ["earth", "cedar", "spice", "tobacco", "erdig", "holz", "würzig"] }
  ];
  let best = { name: "Balanced & sweet", score: 0 };
  for (const group of groups) { const score = group.words.reduce((total, word) => total + (notes.includes(word) ? 1 : 0), 0); if (score > best.score) best = { name: group.name, score }; }
  return best.name;
}
function formatDate(value) {
  if (!value) return "Date not set";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? escapeHTML(value) : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function safeUrl(url) {
  try { const parsed = new URL(url); return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : ""; } catch { return ""; }
}
function showRating(value) { return value === null ? "Not rated" : `${Number(value).toFixed(1)} / 10`; }

function renderStats() {
  const ratings = beans.map(getRating).filter((rating) => rating !== null);
  $("#beanCount").textContent = beans.length;
  $("#avgRating").textContent = ratings.length ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : "—";
  $("#clusterCount").textContent = new Set(beans.map(getCluster)).size;
  $("#brewCount").textContent = beans.reduce((sum, bean) => sum + (bean.brews?.length || 0), 0);
}
function filteredBeans() {
  const term = $("#searchInput").value.trim().toLowerCase(); const group = $("#clusterFilter").value; const sort = $("#sortSelect").value;
  const result = beans.filter((bean) => { const text = [bean.name, bean.roaster, bean.roasterLocation, bean.origin, ...(bean.profile || [])].join(" ").toLowerCase(); return (!term || text.includes(term)) && (group === "all" || getCluster(bean) === group); });
  result.sort((a, b) => { if (sort === "name") return a.name.localeCompare(b.name); if (sort === "roast") return (b.roastDate || "").localeCompare(a.roastDate || ""); if (sort === "recent") return (b.addedAt || "").localeCompare(a.addedAt || ""); return (getRating(b) ?? -1) - (getRating(a) ?? -1) || a.name.localeCompare(b.name); });
  return result;
}
function renderFilter() {
  const filter = $("#clusterFilter"); const previous = filter.value; const groups = [...new Set(beans.map(getCluster))].sort();
  filter.innerHTML = '<option value="all">All taste groups</option>' + groups.map((group) => `<option value="${escapeHTML(group)}">${escapeHTML(group)}</option>`).join(""); filter.value = groups.includes(previous) ? previous : "all";
}
function renderBeans() {
  const filtered = filteredBeans(); $("#visibleCount").textContent = filtered.length;
  if (!filtered.length) { beanGrid.innerHTML = `<div class="empty-results">${beans.length ? "No coffees match those filters." : "Your journal is ready. Add your first coffee."}</div>`; return; }
  beanGrid.innerHTML = filtered.map((bean) => {
    const rating = getRating(bean); const tags = (bean.profile || []).slice(0, 3).map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("");
    return `<article class="bean-card ${bean.id === selectedBeanId ? "is-selected" : ""}" data-id="${escapeHTML(bean.id)}" tabindex="0" aria-label="View ${escapeHTML(bean.name)} details"><div class="bean-topline"><span class="origin-label">${escapeHTML(bean.origin || "Origin unknown")}${bean.roastDate ? ` · ${formatDate(bean.roastDate)}` : ""}</span><button class="favorite-button ${bean.favorite ? "is-favorite" : ""}" data-action="favorite" data-id="${escapeHTML(bean.id)}" aria-label="${bean.favorite ? "Remove from" : "Add to"} favorites">${bean.favorite ? "♥" : "♡"}</button></div><h3>${escapeHTML(bean.name)}</h3><div class="bean-roaster">${escapeHTML(bean.roaster)}${bean.roasterLocation ? ` · ${escapeHTML(bean.roasterLocation)}` : ""}</div><div class="profile-tags">${tags || '<span class="tag">Add tasting notes</span>'}</div><div class="bean-bottomline"><span class="cluster-label">${escapeHTML(getCluster(bean))}</span><span class="rating-label">${showRating(rating)}</span></div></article>`;
  }).join("");
}
function renderDetail() {
  const bean = beans.find((item) => item.id === selectedBeanId);
  if (!bean) { detailPanel.innerHTML = '<div class="detail-empty"><div><div class="empty-cup">☕</div><strong>Select a coffee</strong><p>Its recipe, notes and brew history will appear here.</p></div></div>'; return; }
  const rating = getRating(bean); const recipe = bean.recipe || starterRecipe(bean); const ratio = recipe.dose && recipe.output ? `1:${(Number(recipe.output) / Number(recipe.dose)).toFixed(1)}` : "—"; const productUrl = safeUrl(bean.productUrl || ""); const recent = [...(bean.brews || [])].reverse().slice(0, 3);
  const metric = (label, value) => `<div class="recipe-metric"><small>${label}</small><strong>${escapeHTML(value || "—")}</strong></div>`;
  detailPanel.innerHTML = `<div class="detail-title"><div><h3>${escapeHTML(bean.name)}</h3><p>${escapeHTML(bean.roaster)}${bean.roasterLocation ? ` · ${escapeHTML(bean.roasterLocation)}` : ""}</p></div><div class="detail-actions"><button class="icon-button" data-action="favorite" data-id="${escapeHTML(bean.id)}" aria-label="Toggle favorite">${bean.favorite ? "♥" : "♡"}</button><button class="icon-button" data-action="delete" data-id="${escapeHTML(bean.id)}" aria-label="Delete coffee">⌫</button></div></div>
    <div class="detail-rating">${showRating(rating)} <span style="color:var(--muted);font-weight:500">· ${escapeHTML(bean.roastLevel || "Roast level not set")}</span></div>
    <div class="detail-section"><h4>How it should taste</h4><div class="profile-tags">${(bean.profile || []).map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("") || '<span class="tag">No tasting notes yet</span>'}</div><p class="taste-copy">${escapeHTML(getCluster(bean))} is a suggested taste group based on your notes.</p></div>
    <div class="detail-section"><h4>Your recipe${bean.brews?.length ? " · latest version" : " · suggested start"}</h4><div class="recipe-metrics">${metric("In", `${recipe.dose || "—"}g`)}${metric(`Out · ${ratio}`, `${recipe.output || "—"}g`)}${metric("Grind", recipe.grind)}${metric("Pre-infusion / bloom", recipe.preInfusion)}${metric("Water", recipe.water)}${metric("Method", recipe.method)}${metric("Pressure", recipe.pressure ? `${recipe.pressure} bar` : "Not applicable")}${metric("Pressure profile", recipe.pressureProfile)}</div>${!bean.brews?.length && recipe.guidance ? `<p class="taste-copy">${escapeHTML(recipe.guidance)}</p>` : ""}</div>
    ${recent.length ? `<div class="detail-section"><h4>Recent cups</h4><div class="brew-history">${recent.map((brew) => `<article class="brew-entry"><div class="brew-entry-top"><span>${formatDate(brew.date)}</span><span>${showRating(brew.rating ?? null)}</span></div><p>${escapeHTML(`${brew.dose}g in → ${brew.output}g out · grind ${brew.grind || "—"} · ${brew.pressure ? `${brew.pressure} bar` : "no pressure"}`)}${brew.notes ? ` — ${escapeHTML(brew.notes)}` : ""}</p></article>`).join("")}</div></div>` : ""}
    <div class="detail-footer"><button class="button button-dark small-button" data-action="brew" data-id="${escapeHTML(bean.id)}">✎ Adjust recipe / log brew</button>${productUrl ? `<a class="text-link" href="${escapeHTML(productUrl)}" target="_blank" rel="noopener noreferrer">Visit roastery page ↗</a>` : `<a class="text-link" href="https://www.google.com/search?q=${encodeURIComponent(`${bean.roaster} ${bean.roasterLocation || ""} ${bean.name} coffee`)}" target="_blank" rel="noopener noreferrer">Search roastery ↗</a>`}</div>`;
}
function renderClusters() {
  const groups = new Map(); for (const bean of beans) { const group = getCluster(bean); if (!groups.has(group)) groups.set(group, []); groups.get(group).push(bean); }
  $("#clusterGrid").innerHTML = groups.size ? [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, members]) => { const notes = [...new Set(members.flatMap((bean) => bean.profile || []))].slice(0, 4); const ratings = members.map(getRating).filter((rating) => rating !== null); const average = ratings.length ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : "—"; return `<article class="cluster-card"><p class="eyebrow">taste family</p><h3>${escapeHTML(name)}</h3><p>${notes.map(escapeHTML).join(" · ") || "Add tasting notes to describe this group."}</p><footer><span>${members.length} ${members.length === 1 ? "coffee" : "coffees"} · avg ${average}${average !== "—" ? " / 10" : ""}</span><button data-action="filter-cluster" data-cluster="${escapeHTML(name)}">Explore →</button></footer></article>`; }).join("") : '<div class="empty-results">Add coffees with tasting notes to see their groups.</div>';
}
function render() { renderFilter(); renderStats(); renderBeans(); renderDetail(); renderClusters(); }
function openBeanDialog() { $("#beanForm").reset(); beanDialog.showModal(); }
function updateRatingDisplay() { const checkbox = $("#unratedCheckbox"); const input = $("#ratingInput"); const output = $("#ratingOutput"); input.disabled = checkbox.checked; output.textContent = checkbox.checked ? "Not rated" : Number(input.value).toFixed(1); }
function openBrewDialog(id) {
  const bean = beans.find((item) => item.id === id); if (!bean) return; activeBrewBeanId = id; const form = $("#brewForm"); form.reset(); const recipe = bean.recipe && Object.keys(bean.recipe).length ? bean.recipe : starterRecipe(bean);
  form.elements.dose.value = recipe.dose || 18; form.elements.output.value = recipe.output || 40; form.elements.grind.value = recipe.grind || ""; form.elements.water.value = recipe.water || ""; form.elements.method.value = recipe.method || bean.method || "Espresso"; form.elements.preInfusion.value = recipe.preInfusion || ""; form.elements.pressure.value = recipe.pressure ?? ""; form.elements.pressureProfile.value = recipe.pressureProfile || "";
  $("#unratedCheckbox").checked = true; $("#brewBeanName").textContent = `Starting with ${bean.name} from ${bean.roaster}. Edit settings to match what you taste.`; $("#recipeSuggestion").textContent = recipe.guidance || "Your last saved recipe is loaded. Adjust it; saving makes it this bean’s latest version."; updateRatingDisplay(); brewDialog.showModal();
}
function attachEvents() {
  $("#addBeanButton").addEventListener("click", openBeanDialog); $("#introAddButton").addEventListener("click", openBeanDialog);
  $("#searchRoasteryButton").addEventListener("click", () => { const form = $("#beanForm"); const name = form.elements.roaster.value.trim(); const location = form.elements.roasterLocation.value.trim(); if (!name) { form.elements.roaster.focus(); showToast("Enter a roastery name first."); return; } window.open(`https://www.google.com/search?q=${encodeURIComponent(`${name} ${location} official roastery coffee`)}`, "_blank", "noopener,noreferrer"); });
  $("#beanForm").addEventListener("submit", (event) => { event.preventDefault(); const values = new FormData(event.currentTarget); const bean = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name: values.get("name").trim(), roaster: values.get("roaster").trim(), roasterLocation: values.get("roasterLocation").trim(), origin: values.get("origin").trim(), roastDate: values.get("roastDate"), roastLevel: values.get("roastLevel"), method: values.get("method"), profile: values.get("profile").split(",").map((note) => note.trim()).filter(Boolean), rating: null, productUrl: values.get("productUrl").trim(), recipe: {}, brews: [], favorite: false, addedAt: new Date().toISOString() }; bean.recipe = starterRecipe(bean); beans.unshift(bean); selectedBeanId = bean.id; saveBeans(); render(); beanDialog.close(); showToast("Coffee saved with a suggested starting recipe."); });
  $("#brewForm").addEventListener("submit", (event) => { event.preventDefault(); const bean = beans.find((item) => item.id === activeBrewBeanId); if (!bean) return; const values = new FormData(event.currentTarget); const rated = !$("#unratedCheckbox").checked; const brew = { date: new Date().toISOString(), dose: Number(values.get("dose")), output: Number(values.get("output")), grind: values.get("grind").trim(), water: values.get("water").trim(), method: values.get("method").trim(), preInfusion: values.get("preInfusion").trim(), pressure: values.get("pressure") === "" ? "" : Number(values.get("pressure")), pressureProfile: values.get("pressureProfile").trim(), rating: rated ? Number(values.get("rating")) : null, notes: values.get("notes").trim() }; bean.recipe = { ...brew, guidance: "Your latest personally adjusted recipe. It will be loaded the next time you select this bean." }; bean.method = brew.method; bean.brews ||= []; bean.brews.push(brew); selectedBeanId = bean.id; saveBeans(); render(); brewDialog.close(); showToast("Latest recipe saved for this bean."); });
  $("#ratingInput").addEventListener("input", updateRatingDisplay); $("#unratedCheckbox").addEventListener("change", updateRatingDisplay);
  $("#searchInput").addEventListener("input", render); $("#clusterFilter").addEventListener("change", render); $("#sortSelect").addEventListener("change", render);
  beanGrid.addEventListener("click", (event) => { const favorite = event.target.closest('[data-action="favorite"]'); if (favorite) { event.stopPropagation(); const bean = beans.find((item) => item.id === favorite.dataset.id); if (bean) { bean.favorite = !bean.favorite; saveBeans(); render(); } return; } const card = event.target.closest(".bean-card"); if (card) { selectedBeanId = card.dataset.id; render(); } });
  beanGrid.addEventListener("keydown", (event) => { if ((event.key === "Enter" || event.key === " ") && event.target.matches(".bean-card")) { event.preventDefault(); selectedBeanId = event.target.dataset.id; render(); } });
  detailPanel.addEventListener("click", (event) => { const button = event.target.closest("[data-action]"); if (!button) return; const bean = beans.find((item) => item.id === button.dataset.id); if (button.dataset.action === "brew") openBrewDialog(button.dataset.id); if (button.dataset.action === "favorite" && bean) { bean.favorite = !bean.favorite; saveBeans(); render(); } if (button.dataset.action === "delete" && bean && confirm(`Delete ${bean.name} and all of its brew history?`)) { beans = beans.filter((item) => item.id !== bean.id); selectedBeanId = beans[0]?.id ?? null; saveBeans(); render(); showToast("Coffee removed from your journal."); } });
  $("#clusterGrid").addEventListener("click", (event) => { const button = event.target.closest('[data-action="filter-cluster"]'); if (button) { $("#clusterFilter").value = button.dataset.cluster; render(); $("#library").scrollIntoView({ behavior: "smooth" }); } });
  $("#exportButton").addEventListener("click", () => { const file = new Blob([JSON.stringify(beans, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(file); link.download = "daily-pour-backup.json"; link.click(); URL.revokeObjectURL(link.href); showToast("Backup downloaded."); });
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
}
attachEvents();
render();
