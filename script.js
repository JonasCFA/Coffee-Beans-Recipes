const STORAGE_KEY = "daily-pour-coffee-journal-v1";
const seedBeans = [
  {
    id: "seed-1",
    name: "Yirgacheffe Sunrise",
    roaster: "Cedar & Co.",
    roasterLocation: "Frankfurt",
    origin: "Ethiopia",
    roastDate: "2026-10-22",
    roastLevel: "Light",
    profile: ["floral", "citrus", "tea-like", "bergamot"],
    rating: 4.9,
    productUrl: "https://www.example.com",
    recipe: { dose: 18, output: 40, grind: "16", water: "94°C", method: "Espresso", preInfusion: "20s" },
    brews: [],
    favorite: false,
    addedAt: "2026-10-22T10:00:00.000Z"
  },
  {
    id: "seed-2",
    name: "Maya Estate",
    roaster: "Horizon Roasters",
    roasterLocation: "Berlin",
    origin: "Colombia",
    roastDate: "2026-10-18",
    roastLevel: "Medium",
    profile: ["caramel", "red apple", "brown sugar", "orange"],
    rating: 4.7,
    productUrl: "https://www.example.com",
    recipe: { dose: 18, output: 40, grind: "15", water: "94°C", method: "Pour over", preInfusion: "15s" },
    brews: [],
    favorite: true,
    addedAt: "2026-10-18T10:00:00.000Z"
  },
  {
    id: "seed-3",
    name: "Monsoon Reserve",
    roaster: "Wild Bean House",
    roasterLocation: "Munich",
    origin: "India",
    roastDate: "2026-10-12",
    roastLevel: "Medium-dark",
    profile: ["dark chocolate", "cocoa", "cedar", "brown sugar"],
    rating: 4.5,
    productUrl: "https://www.example.com",
    recipe: { dose: 18, output: 40, grind: "14", water: "93°C", method: "Espresso", preInfusion: "18s" },
    brews: [],
    favorite: false,
    addedAt: "2026-10-12T10:00:00.000Z"
  },
  {
    id: "seed-4",
    name: "Velvet Cherry",
    roaster: "North Roast",
    roasterLocation: "Hamburg",
    origin: "Brazil",
    roastDate: "2026-10-27",
    roastLevel: "Medium",
    profile: ["chocolate", "cherry", "toffee", "jam"],
    rating: 4.8,
    productUrl: "https://www.example.com",
    recipe: { dose: 18, output: 40, grind: "17", water: "93.5°C", method: "Espresso", preInfusion: "12s" },
    brews: [],
    favorite: false,
    addedAt: "2026-10-27T10:00:00.000Z"
  }
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

function loadBeans() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return structuredClone(seedBeans);
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : structuredClone(seedBeans);
  } catch (error) {
    console.warn("Could not read saved coffee data", error);
    return structuredClone(seedBeans);
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
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function getRating(bean) {
  if (bean.brews && bean.brews.length) {
    const ratings = bean.brews.map((brew) => Number(brew.rating || 0)).filter((rating) => rating > 0);
    if (ratings.length) return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }
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

function formatDate(dateValue) {
  if (!dateValue) return "Date not set";
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return escapeHTML(dateValue);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
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

    return `
      <article class="bean-card ${bean.id === selectedBeanId ? "is-selected" : ""}" data-id="${escapeHTML(bean.id)}" tabindex="0" aria-label="View ${escapeHTML(bean.name)} details">
        <div class="bean-topline">
          <span class="origin-label">${escapeHTML(bean.origin || "Origin unknown")}${bean.roastDate ? ` · ${formatDate(bean.roastDate)}` : ""}</span>
          <button class="favorite-button ${bean.favorite ? "is-favorite" : ""}" data-action="favorite" data-id="${escapeHTML(bean.id)}" aria-label="${bean.favorite ? "Remove from" : "Add to"} favorites">${bean.favorite ? "♥" : "♡"}</button>
        </div>

        <h3>${escapeHTML(bean.name)}</h3>
        <div class="bean-roaster">${escapeHTML(bean.roaster)}${bean.roasterLocation ? ` · ${escapeHTML(bean.roasterLocation)}` : ""}</div>

        <div class="profile-tags">${tags || '<span class="tag">Add tasting notes</span>'}</div>

        <div class="bean-bottomline">
          <span class="cluster-label">${escapeHTML(getCluster(bean))}</span>
          <span class="rating-label">${rating ? `★ ${rating.toFixed(1)}` : "Not rated"}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderDetail() {
  const bean = beans.find((item) => item.id === selectedBeanId);
  if (!bean) {
    detailPanel.innerHTML = `
      <div class="detail-empty">
        <div>
          <div class="empty-cup">☕</div>
          <strong>Select a coffee</strong>
          <p>Its recipe, notes, and brew history will appear here.</p>
        </div>
      </div>
    `;
    return;
  }

  const rating = getRating(bean);
  const recipe = bean.recipe || {};
  const ratio = recipe.dose && recipe.output ? `1:${(Number(recipe.output) / Number(recipe.dose)).toFixed(1)}` : "—";
  const productUrl = safeUrl(bean.productUrl || "");
  const recentBrews = [...(bean.brews || [])].reverse().slice(0, 3);

  detailPanel.innerHTML = `
    <div class="detail-title">
      <div>
        <h3>${escapeHTML(bean.name)}</h3>
        <p>${escapeHTML(bean.roaster)}${bean.roasterLocation ? ` · ${escapeHTML(bean.roasterLocation)}` : ""}</p>
      </div>

      <div class="detail-actions">
        <button class="icon-button" data-action="favorite" data-id="${escapeHTML(bean.id)}" aria-label="Toggle favorite">${bean.favorite ? "♥" : "♡"}</button>
        <button class="icon-button" data-action="delete" data-id="${escapeHTML(bean.id)}" aria-label="Delete coffee">⌫</button>
      </div>
    </div>

    <div class="detail-rating">${rating ? `★ ${rating.toFixed(1)} / 5` : "Not rated yet"} <span style="color: var(--muted); font-weight: 500;">· ${escapeHTML(bean.roastLevel || "Roast level not set")}</span></div>

    <div class="detail-section">
      <h4>How it should taste</h4>
      <div class="profile-tags">
        ${(bean.profile || []).map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("") || '<span class="tag">No tasting notes yet</span>'}
      </div>
      <p class="taste-copy">${escapeHTML(getCluster(bean))} is a suggested taste group based on your notes.</p>
    </div>

    <div class="detail-section">
      <h4>Your recipe${bean.brews?.length ? " · latest brew" : " · starting point"}</h4>
      ${recipe.dose || recipe.output || recipe.grind ? `
        <div class="recipe-metrics">
          <div class="recipe-metric"><small>In</small><strong>${escapeHTML(recipe.dose || "—")}g</strong></div>
          <div class="recipe-metric"><small>Out · ${ratio}</small><strong>${escapeHTML(recipe.output || "—")}g</strong></div>
          <div class="recipe-metric"><small>Grind</small><strong>${escapeHTML(recipe.grind || "—")}</strong></div>
          <div class="recipe-metric"><small>Pre-infusion</small><strong>${escapeHTML(recipe.preInfusion || "—")}</strong></div>
          <div class="recipe-metric"><small>Water</small><strong>${escapeHTML(recipe.water || "—")}</strong></div>
          <div class="recipe-metric"><small>Method</small><strong>${escapeHTML(recipe.method || "—")}</strong></div>
        </div>
      ` : '<p class="recipe-empty">No recipe yet. Log a brew to remember dose, yield, grind and more.</p>'}
    </div>

    ${recentBrews.length ? `
      <div class="detail-section">
        <h4>Recent cups</h4>
        <div class="brew-history">
          ${recentBrews.map((brew) => `
            <article class="brew-entry">
              <div class="brew-entry-top">
                <span>${formatDate(brew.date)}</span>
                <span>${brew.rating ? `★ ${Number(brew.rating).toFixed(1)}` : "Unrated"} · grind ${escapeHTML(brew.grind || "—")}</span>
              </div>
              <p>${escapeHTML(brew.notes || `${brew.dose}g in → ${brew.output}g out · ${brew.method || "method not set"}`)}</p>
            </article>
          `).join("")}
        </div>
      </div>
    ` : ""}

    <div class="detail-footer">
      <button class="button button-dark small-button" data-action="brew" data-id="${escapeHTML(bean.id)}">＋ Log a brew</button>
      ${productUrl ? `<a class="text-link" href="${escapeHTML(productUrl)}" target="_blank" rel="noopener noreferrer">Visit roastery page ↗</a>` : `<a class="text-link" href="https://www.google.com/search?q=${encodeURIComponent(`${bean.roaster} ${bean.roasterLocation || ""} ${bean.name} coffee`)}" target="_blank" rel="noopener noreferrer">Search roastery ↗</a>`}
    </div>
  `;
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

    return `
      <article class="cluster-card">
        <p class="eyebrow">taste family</p>
        <h3>${escapeHTML(name)}</h3>
        <p>${notes.map(escapeHTML).join(" · ") || "Add tasting notes to describe this group."}</p>
        <footer>
          <span>${members.length} ${members.length === 1 ? "coffee" : "coffees"} · avg ${average}${average !== "—" ? " ★" : ""}</span>
          <button data-action="filter-cluster" data-cluster="${escapeHTML(name)}">Explore →</button>
        </footer>
      </article>
    `;
  }).join("") : '<div class="empty-results">Add coffees with tasting notes to see their groups.</div>';
}

function render() {
  renderFilter();
  renderStats();
  renderBeans();
  renderDetail();
  renderClusters();
}

function openBeanDialog() {
  $("#beanForm").reset();
  beanDialog.showModal();
}

function setRating(value) {
  const form = $("#brewForm");
  form.elements.rating.value = String(value);
  document.querySelectorAll(".rating-picker button").forEach((button) => {
    const active = Number(button.dataset.rating) <= value;
    button.textContent = active ? "★" : "☆";
  });
}

function openBrewDialog(id) {
  const bean = beans.find((item) => item.id === id);
  if (!bean) return;

  activeBrewBeanId = id;
  const form = $("#brewForm");
  form.reset();
  form.elements.dose.value = bean.recipe?.dose || 18;
  form.elements.output.value = bean.recipe?.output || 40;
  form.elements.grind.value = bean.recipe?.grind || "";
  form.elements.water.value = bean.recipe?.water || "";
  form.elements.method.value = bean.recipe?.method || "Espresso";
  form.elements.preInfusion.value = bean.recipe?.preInfusion || "";
  form.elements.rating.value = "0";
  $("#brewBeanName").textContent = `Logging a brew for ${bean.name} from ${bean.roaster}.`;
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

    if (!name) {
      form.elements.roaster.focus();
      showToast("Enter a roastery name first.");
      return;
    }

    const query = `${name} ${location} official roastery coffee`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  });

  $("#beanForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const bean = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: values.get("name").trim(),
      roaster: values.get("roaster").trim(),
      roasterLocation: values.get("roasterLocation").trim(),
      origin: values.get("origin").trim(),
      roastDate: values.get("roastDate"),
      roastLevel: values.get("roastLevel"),
      profile: values.get("profile").split(",").map((note) => note.trim()).filter(Boolean),
      rating: Number(values.get("rating")),
      productUrl: values.get("productUrl").trim(),
      recipe: {},
      brews: [],
      favorite: false,
      addedAt: new Date().toISOString()
    };

    beans.unshift(bean);
    selectedBeanId = bean.id;
    saveBeans();
    render();
    beanDialog.close();
    showToast("Coffee added to your journal.");
  });

  $("#brewForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const bean = beans.find((item) => item.id === activeBrewBeanId);
    if (!bean) return;

    const values = new FormData(event.currentTarget);
    const brew = {
      date: new Date().toISOString(),
      dose: Number(values.get("dose")),
      output: Number(values.get("output")),
      grind: values.get("grind").trim(),
      water: values.get("water").trim(),
      method: values.get("method").trim(),
      preInfusion: values.get("preInfusion").trim(),
      rating: Number(values.get("rating")),
      notes: values.get("notes").trim()
    };

    bean.recipe = { ...brew };
    bean.brews ||= [];
    bean.brews.push(brew);
    selectedBeanId = bean.id;
    saveBeans();
    render();
    brewDialog.close();
    showToast("Brew saved. Recipe updated.");
  });

  document.querySelectorAll(".rating-picker button").forEach((button) => {
    button.addEventListener("click", () => setRating(Number(button.dataset.rating)));
  });

  $("#searchInput").addEventListener("input", render);
  $("#clusterFilter").addEventListener("change", render);
  $("#sortSelect").addEventListener("change", render);

  $("#searchInput").addEventListener("input", render);

  beanGrid.addEventListener("click", (event) => {
    const favorite = event.target.closest('[data-action="favorite"]');
    if (favorite) {
      event.stopPropagation();
      const bean = beans.find((item) => item.id === favorite.dataset.id);
      if (bean) {
        bean.favorite = !bean.favorite;
        saveBeans();
        render();
      }
      return;
    }

    const card = event.target.closest(".bean-card");
    if (card) {
      selectedBeanId = card.dataset.id;
      render();
    }
  });

  beanGrid.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches(".bean-card")) {
      event.preventDefault();
      selectedBeanId = event.target.dataset.id;
      render();
    }
  });

  detailPanel.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const bean = beans.find((item) => item.id === button.dataset.id);

    if (button.dataset.action === "brew") openBrewDialog(button.dataset.id);
    if (button.dataset.action === "favorite" && bean) {
      bean.favorite = !bean.favorite;
      saveBeans();
      render();
    }

    if (button.dataset.action === "delete" && bean && confirm(`Delete ${bean.name} and all of its brew history?`)) {
      beans = beans.filter((item) => item.id !== bean.id);
      selectedBeanId = beans[0]?.id ?? null;
      saveBeans();
      render();
      showToast("Coffee removed from your journal.");
    }
  });

  $("#clusterGrid").addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="filter-cluster"]');
    if (button) {
      $("#clusterFilter").value = button.dataset.cluster;
      render();
      $("#library").scrollIntoView({ behavior: "smooth" });
    }
  });

  $("#exportButton").addEventListener("click", () => {
    const file = new Blob([JSON.stringify(beans, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "daily-pour-backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Backup downloaded.");
  });

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });
}

attachEvents();
render();
