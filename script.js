const STORAGE_KEY = "daily-pour-coffee-journal-v2";
const LEGACY_STORAGE_KEY = "daily-pour-coffee-journal-v1";
const seedBeans = [
  { id: "sample-1", name: "Yirgacheffe Sunrise", roaster: "Cedar & Co.", roasterLocation: "", origin: "Ethiopia", roastDate: "2026-10-22", roastLevel: "Light", profile: ["floral", "citrus", "tea-like", "bergamot"], rating: 9.8, productUrl: "", recipe: { dose: 18, output: 43, grind: "Dial in for your grinder", water: "94°C", method: "Espresso", preInfusion: "8s" }, brews: [], favorite: false, addedAt: "2026-10-22T10:00:00.000Z" },
  { id: "sample-2", name: "Maya Estate", roaster: "Horizon Roasters", roasterLocation: "", origin: "Colombia", roastDate: "2026-10-18", roastLevel: "Medium", profile: ["caramel", "red apple", "brown sugar", "orange"], rating: 9.4, productUrl: "", recipe: { dose: 18, output: 40, grind: "Dial in for your grinder", water: "93°C", method: "Pour over", preInfusion: "Bloom 30s" }, brews: [], favorite: false, addedAt: "2026-10-18T10:00:00.000Z" },
  { id: "sample-3", name: "Monsoon Reserve", roaster: "Wild Bean House", roasterLocation: "", origin: "India", roastDate: "2026-10-12", roastLevel: "Medium-dark", profile: ["dark chocolate", "cocoa", "cedar", "brown sugar"], rating: 9, productUrl: "", recipe: { dose: 18, output: 36, grind: "Dial in for your grinder", water: "92°C", method: "Espresso", preInfusion: "5s" }, brews: [], favorite: false, addedAt: "2026-10-12T10:00:00.000Z" },
  { id: "sample-4", name: "Velvet Cherry", roaster: "North Roast", roasterLocation: "", origin: "Brazil", roastDate: "2026-10-27", roastLevel: "Medium", profile: ["chocolate", "cherry", "toffee", "jam"], rating: 9.6, productUrl: "", recipe: { dose: 18, output: 38, grind: "Dial in for your grinder", water: "92°C", method: "Espresso", preInfusion: "6s" }, brews: [], favorite: false, addedAt: "2026-10-27T10:00:00.000Z" }
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
  if (["pour over", "v60", "aeropress", "filter", "french press", "clever"].some((item) => method.toLowerCase().includes(item))) {
    const light = roast.includes("light") || /citrus|floral|berry|fruit|zitrus|blüte|beere/.test(notes);
    const dark = roast.includes("dark") || /chocolate|cocoa|caramel|chocolade|kakao|karamell/.test(notes);
    return {
      dose: method.toLowerCase().includes("french") ? 20 : 15,
      output: method.toLowerCase().includes("french") ? 320 : 250,
      grind: "Medium-fine; adjust to taste",
      water: light ? "94°C" : dark ? "90°C" : "92°C",
      method,
      preInfusion: method.toLowerCase().includes("french") ? "Steep 4 min" : "Bloom 30s",
      guidance: "Starting point only — brew method, grinder and your palate all affect the result."
    };
  }
  const light = roast.includes("light") || /citrus|floral|berry|grape|lemon|peach|bright|zitrus|blüte|beere/.test(notes);
  const dark = roast.includes("dark") || /dark chocolate|cocoa|chocolate|caramel|toffee|chocolade|kakao|karamell/.test(notes);
  const dose = 18;
  const output = light ? 43 : dark ? 36 : 40;
  return {
    dose,
    output,
    grind: "Dial in for your grinder",
    water: light ? "94°C" : dark ? "92°C" : "93°C",
    method: method || "Espresso",
    preInfusion: light ? "8s" : "5s",
    guidance: `Suggested espresso starting point: ${dose}g in → ${output}g out (1:${(output / dose).toFixed(1)}). Adjust grind and taste; grinder scales are not universal.`
  };
}

function loadBeans() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return normalizeBeans(JSON.parse(current), false);
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const migrated = normalizeBeans(JSON.parse(legacy), true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return structuredClone(seedBeans);
  } catch (error) {
    console.warn("Could not load saved coffee data", error);
    return structuredClone(seedBeans);
  }
}

function normalizeBeans(items, legacy) {
  if (!Array.isArray(items)) return structuredClone(seedBeans);
  return items.map((bean) => {
    const normalized = { ...bean, profile: Array.isArray(bean.profile) ? bean.profile : [], brews: Array.isArray(bean.brews) ? bean.brews : [] };
    if (legacy) {
      normalized.rating = Number(normalized.rating || 0) * 2;
      normalized.brews = normalized.brews.map((brew) => ({ ...brew, rating: Number(brew.rating || 0) * 2 }));
    }
    if (!normalized.recipe || !Object.keys(normalized.recipe).length) normalized.recipe = starterRecipe(normalized);
    return normalized;
  });
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
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function getRating(bean) {
  const ratedBrews = (bean.brews || []).map((brew) => Number(brew.rating)).filter((rating) => Number.isFinite(rating) && rating > 0);
  if (ratedBrews.length) return ratedBrews.reduce((sum, rating) => sum + rating, 0) / ratedBrews.length;
  return Number(bean.rating) || 0;
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
  for (const group of groups) {
    const score = group.words.reduce((total, word) => total + (notes.includes(word) ? 1 : 0), 0);
    if (score > best.score) best = { name: group.name, score };
  }
  return best.name;
}

function formatDate(value) {
  if (!value) return "Date not set";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? escapeHTML(value) : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function safeUrl(url) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

function renderStats() {
  const ratings = beans.map(getRating).filter((rating) => rating > 0);
  $("#beanCount").textContent = beans.length;
  $("#avgRating").textContent = ratings.length ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : "—";
  $("#clusterCount").textContent = new Set(beans.map(getCluster)).size;
  $("#brewCount").textContent = beans.reduce((sum, bean) => sum + (bean.brews?.length || 0), 0);
}

function filteredBeans() {
  const term = $("#searchInput").value.trim().toLowerCase();
  const group = $("#clusterFilter").value;
  const sort = $("#sortSelect").value;
  const result = beans.filter((bean) => {
    const searchable = [bean.name, bean.roaster, bean.roasterLocation, bean.origin, ...(bean.profile || [])].join(" ").toLowerCase();
    return (!term || searchable.includes(term)) && (group === "all" || getCluster(bean) === group);
  });
  result.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "roast") return (b.roastDate || "").localeCompare(a.roastDate || "");
    if (sort === "recent") return (b.addedAt || "").localeCompare(a.addedAt || "");
    return getRating(b) - getRating(a) || a.name.localeCompare(b.name);
  });
  return result;
}

function renderFilter() {
  const filter = $("#clusterFilter");
  const previous = filter.value;
  const groups = [...new Set(beans.map(getCluster))].sort();
  filter.innerHTML = '<option value="all">All taste groups</option>' + groups.map((group) => `<option value="${escapeHTML(group)}">${escapeHTML(group)}</option>`).join("");
  filter.value = groups.includes(previous) ? previous : "all";
}

function renderBeans() {
  const filtered = filteredBeans();
  $("#visibleCount").textContent = filtered.length;
  if (!filtered.length) {
    beanGrid.innerHTML = `<div class="empty-results">${beans.length ? "No coffees match those filters." : "Your journal is ready. Add your first coffee."}</div>`;
    return;
  }
  beanGrid.innerHTML = filtered.map((bean) => {
    const rating = getRating(bean);
    const tags = (bean.profile || []).slice(0, 3).map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("");
    return `<article class="bean-card ${bean.id === selectedBeanId ? "is-selected" : ""}" data-id="${escapeHTML(bean.id)}" tabindex="0" aria-label="View ${escapeHTML(bean.name)} details">
      <div class="bean-topline"><span class="origin-label">${escapeHTML(bean.origin || "Origin unknown")}${bean.roastDate ? ` · ${formatDate(bean.roastDate)}` : ""}</span><button class="favorite-button ${bean.favorite ? "is-favorite" : ""}" data-action="favorite" data-id="${escapeHTML(bean.id)}" aria-label="${bean.favorite ? "Remove from" : "Add to"} favorites">${bean.favorite ? "♥" : "♡"}</button></div>
      <h3>${escapeHTML(bean.name)}</h3><div class="bean-roaster">${escapeHTML(bean.roaster)}${bean.roasterLocation ? ` · ${escapeHTML(bean.roasterLocation)}` : ""}</div>
      <div class="profile-tags">${tags || '<span class="tag">Add tasting notes</span>'}</div>
      <div class="bean-bottomline"><span class="cluster-label">${escapeHTML(getCluster(bean))}</span><span class="rating-label">${rating ? `${rating.toFixed(1)} / 10` : "Not rated"}</span></div>
    </article>`;
  }).join("");
}

function renderDetail() {
  const bean = beans.find((item) => item.id === selectedBeanId);
  if (!bean) {
    detailPanel.innerHTML = '<div class="detail-empty"><div><div class="empty-cup">☕</div><strong>Select a coffee</strong><p>Its recipe, notes and brew history will appear here.</p></div></div>';
    return;
  }
  const rating = getRating(bean);
  const recipe = bean.recipe || {};
  const ratio = recipe.dose && recipe.output ? `1:${(Number(recipe.output) / Number(recipe.dose)).toFixed(1)}` : "—";
  const productUrl = safeUrl(bean.productUrl || "");
  const recentBrews = [...(bean.brews || [])].reverse().slice(0, 3);
  detailPanel.innerHTML = `
    <div class="detail-title"><div><h3>${escapeHTML(bean.name)}</h3><p>${escapeHTML(bean.roaster)}${bean.roasterLocation ? ` · ${escapeHTML(bean.roasterLocation)}` : ""}</p></div><div class="detail-actions"><button class="icon-button" data-action="favorite" data-id="${escapeHTML(bean.id)}" aria-label="Toggle favorite">${bean.favorite ? "♥" : "♡"}</button><button class="icon-button" data-action="delete" data-id="${escapeHTML(bean.id)}" aria-label="Delete coffee">⌫</button></div></div>
    <div class="detail-rating">${rating ? `${rating.toFixed(1)} / 10` : "Not rated yet"} <span style="color:var(--muted);font-weight:500">· ${escapeHTML(bean.roastLevel || "Roast level not set")}</span></div>
    <div class="detail-section"><h4>How it should taste</h4><div class="profile-tags">${(bean.profile || []).map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("") || '<span class="tag">No tasting notes yet</span>'}</div><p class="taste-copy">${escapeHTML(getCluster(bean))} is a suggested taste group based on your notes.</p></div>
    <div class="detail-section"><h4>Your recipe${bean.brews?.length ? " · latest version" : " · suggested start"}</h4><div class="recipe-metrics"><div class="recipe-metric"><small>In</small><strong>${escapeHTML(recipe.dose || "—")}g</strong></div><div class="recipe-metric"><small>Out · ${ratio}</small><strong>${escapeHTML(recipe.output || "—")}g</strong></div><div class="recipe-metric"><small>Grind</small><strong>${escapeHTML(recipe.grind || "—")}</strong></div><div class="recipe-metric"><small>Pre-infusion</small><strong>${escapeHTML(recipe.preInfusion || "—")}</strong></div><div class="recipe-metric"><small>Water</small><strong>${escapeHTML(recipe.water || "—")}</strong></div><div class="recipe-metric"><small>Method</small><strong>${escapeHTML(recipe.method || "—")}</strong></div></div>${recipe.guidance ? `<p class="taste-copy recipe-guidance">${escapeHTML(recipe.guidance)}</p>` : ""}</div>
    ${recentBrews.length ? `<div class="detail-section"><h4>Recent cups</h4><div class="brew-history">${recentBrews.map((brew) => `<article class="brew-entry"><div class="brew-entry-top"><span>${formatDate(brew.date)}</span><span>${Number(brew.rating) > 0 ? `${Number(brew.rating).toFixed(1)} / 10` : "Unrated"} · grind ${escapeHTML(brew.grind || "—")}</span></div><p>${escapeHTML(brew.notes || `${brew.dose}g in → ${brew.output}g out · ${brew.method || "method not set"}`)}</p></article>`).join("")}</div></div>` : ""}
    <div class="detail-footer"><button class="button button-dark small-button" data-action="brew" data-id="${escapeHTML(bean.id)}">✎ Adjust recipe / log brew</button>${productUrl ? `<a class="text-link" href="${escapeHTML(productUrl)}" target="_blank" rel="noopener noreferrer">Visit roastery page ↗</a>` : `<a class="text-link" href="https://www.google.com/search?q=${encodeURIComponent(`${bean.roaster} ${bean.roasterLocation || ""} ${bean.name} coffee`)}" target="_blank" rel="noopener noreferrer">Search roastery ↗</a>`}</div>`;
}

function renderClusters() {
  const groups = new Map();
  for (const bean of beans) {
    const group = getCluster(bean);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(bean);
  }
  $("#clusterGrid").innerHTML = groups.size ? [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, members]) => {
    const notes = [...new Set(members.flatMap((bean) => bean.profile || []))].slice(0, 4);
    const ratings = members.map(getRating).filter((rating) => rating > 0);
    const average = ratings.length ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : "—";
    return `<article class="cluster-card"><p class="eyebrow">taste family</p><h3>${escapeHTML(name)}</h3><p>${notes.map(escapeHTML).join(" · ") || "Add tasting notes to describe this group."}</p><footer><span>${members.length} ${members.length === 1 ? "coffee" : "coffees"} · avg ${average}${average !== "—" ? " / 10" : ""}</span><button data-action="filter-cluster" data-cluster="${escapeHTML(name)}">Explore →</button></footer></article>`;
  }).join("") : '<div class="empty-results">Add coffees with tasting notes to see their groups.</div>';
}

function render() { renderFilter(); renderStats(); renderBeans(); renderDetail(); renderClusters(); }
function openBeanDialog() { $("#beanForm").reset(); beanDialog.showModal(); }
function setRating(value) { $("#ratingInput").value = String(value); $("#ratingOutput").value = String(value); }

function openBrewDialog(id) {
  const bean = beans.find((item) => item.id === id);
  if (!bean) return;
  activeBrewBeanId = id;
  const form = $("#brewForm");
  form.reset();
  const recipe = bean.recipe && Object.keys(bean.recipe).length ? bean.recipe : starterRecipe(bean);
  form.elements.dose.value = recipe.dose || 18;
  form.elements.output.value = recipe.output || 40;
  form.elements.grind.value = recipe.grind || "";
  form.elements.water.value = recipe.water || "";
  form.elements.method.value = recipe.method || "Espresso";
  form.elements.preInfusion.value = recipe.preInfusion || "";
  form.elements.rating.value = "0";
  $("#brewBeanName").textContent = `Starting with ${bean.name} from ${bean.roaster}. Edit any setting after tasting.`;
  $("#recipeSuggestion").textContent = recipe.guidance || "Your last saved recipe is loaded. Adjust the settings to match this brew; saving makes it the latest version for this bean.";
  setRating(0);
  brewDialog.showModal();
}

function attachEvents() {
  $("#addBeanButton").addEventListener("click", openBeanDialog);
  $("#introAddButton").addEventListener("click", openBeanDialog);
  $("#searchRoasteryButton").addEventListener("click", () => {
    const form = $("#beanForm");
    const name = form.elements.roaster.value.trim();
    const location = form.elements.roasterLocation.value.trim();
    if (!name) { form.elements.roaster.focus(); showToast("Enter a roastery name first."); return; }
    window.open(`https://www.google.com/search?q=${encodeURIComponent(`${name} ${location} official roastery coffee`)}`, "_blank", "noopener,noreferrer");
  });
  $("#beanForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const bean = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: values.get("name").trim(), roaster: values.get("roaster").trim(), roasterLocation: values.get("roasterLocation").trim(),
      origin: values.get("origin").trim(), roastDate: values.get("roastDate"), roastLevel: values.get("roastLevel"), method: values.get("method"),
      profile: values.get("profile").split(",").map((note) => note.trim()).filter(Boolean), rating: 0, productUrl: values.get("productUrl").trim(),
      recipe: {}, brews: [], favorite: false, addedAt: new Date().toISOString()
    };
    bean.recipe = starterRecipe(bean);
    beans.unshift(bean); selectedBeanId = bean.id; saveBeans(); render(); beanDialog.close();
    showToast("Coffee saved with a suggested starter recipe.");
  });
  $("#brewForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const bean = beans.find((item) => item.id === activeBrewBeanId);
    if (!bean) return;
    const values = new FormData(event.currentTarget);
    const brew = { date: new Date().toISOString(), dose: Number(values.get("dose")), output: Number(values.get("output")), grind: values.get("grind").trim(), water: values.get("water").trim(), method: values.get("method").trim(), preInfusion: values.get("preInfusion").trim(), rating: Number(values.get("rating")), notes: values.get("notes").trim() };
    const priorGuidance = bean.recipe?.guidance;
    bean.recipe = { ...brew, guidance: priorGuidance || "Your latest personally adjusted recipe. Use it next time you brew this bean." };
    bean.brews ||= []; bean.brews.push(brew); selectedBeanId = bean.id; saveBeans(); render(); brewDialog.close();
    showToast("Latest recipe saved for this bean.");
  });
  $("#ratingInput").addEventListener("input", (event) => setRating(event.target.value));
  $("#searchInput").addEventListener("input", render);
  $("#clusterFilter").addEventListener("change", render);
  $("#sortSelect").addEventListener("change", render);
  beanGrid.addEventListener("click", (event) => {
    const favorite = event.target.closest('[data-action="favorite"]');
    if (favorite) { event.stopPropagation(); const bean = beans.find((item) => item.id === favorite.dataset.id); if (bean) { bean.favorite = !bean.favorite; saveBeans(); render(); } return; }
    const card = event.target.closest(".bean-card"); if (card) { selectedBeanId = card.dataset.id; render(); }
  });
  beanGrid.addEventListener("keydown", (event) => { if ((event.key === "Enter" || event.key === " ") && event.target.matches(".bean-card")) { event.preventDefault(); selectedBeanId = event.target.dataset.id; render(); } });
  detailPanel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]"); if (!button) return;
    const bean = beans.find((item) => item.id === button.dataset.id);
    if (button.dataset.action === "brew") openBrewDialog(button.dataset.id);
    if (button.dataset.action === "favorite" && bean) { bean.favorite = !bean.favorite; saveBeans(); render(); }
    if (button.dataset.action === "delete" && bean && confirm(`Delete ${bean.name} and all of its brew history?`)) { beans = beans.filter((item) => item.id !== bean.id); selectedBeanId = beans[0]?.id ?? null; saveBeans(); render(); showToast("Coffee removed from your journal."); }
  });
  $("#clusterGrid").addEventListener("click", (event) => { const button = event.target.closest('[data-action="filter-cluster"]'); if (button) { $("#clusterFilter").value = button.dataset.cluster; render(); $("#library").scrollIntoView({ behavior: "smooth" }); } });
  $("#exportButton").addEventListener("click", () => { const file = new Blob([JSON.stringify(beans, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(file); link.download = "daily-pour-backup.json"; link.click(); URL.revokeObjectURL(link.href); showToast("Backup downloaded."); });
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
}

attachEvents();
render();
