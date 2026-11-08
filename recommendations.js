(function () {
  const STORAGE_KEY = "daily-pour-coffee-journal-v4";
  const root = document.getElementById("recommendList");
  const allRoot = document.getElementById("allPicks");
  const countNote = document.getElementById("recommendCount");
  if (!root && !allRoot) return;

  const CATEGORIES = ["fruit", "floral", "chocolate", "nut", "sweet", "earthy"];
  const KEYWORDS = {
    fruit: ["citrus", "lemon", "lime", "orange", "grapefruit", "berry", "blueberry", "blackcurrant", "currant", "grape", "apple", "peach", "apricot", "cherry", "plum", "tropical", "mango", "fruit", "zitrus", "beere", "kirsche", "pfirsich", "apfel"],
    floral: ["floral", "jasmine", "bergamot", "tea", "blossom", "rose", "lavender", "blüte", "tee", "jasmin"],
    chocolate: ["chocolate", "cocoa", "cacao", "brownie", "schokolade", "kakao", "chocolade"],
    nut: ["nut", "hazelnut", "almond", "peanut", "walnut", "nuss", "haselnuss", "mandel"],
    sweet: ["honey", "sweet", "sugar", "caramel", "toffee", "maple", "vanilla", "molasses", "honig", "süß", "karamell"],
    earthy: ["earth", "cedar", "spice", "tobacco", "smoky", "herbal", "wood", "erdig", "holz", "würzig", "rauchig"]
  };
  const ROASTS = ["light", "light-medium", "medium", "medium-dark", "dark"];

  // Bean styles to look for; not specific products, so nothing here can go out of stock.
  const CATALOG = [
    { title: "Ethiopia natural (Guji / Yirgacheffe)", country: "ethiopia", roast: 0, cats: { fruit: 1, floral: .6, sweet: .5 }, notes: ["blueberry", "peach", "jasmine"], drink: "Shines as espresso or filter, black", search: "Ethiopia natural Guji Yirgacheffe" },
    { title: "Ethiopia washed (Yirgacheffe / Gedeb)", country: "ethiopia", roast: 0, cats: { floral: 1, fruit: .5, sweet: .2 }, notes: ["bergamot", "lemon", "black tea"], drink: "Delicate and tea-like; best black", search: "Ethiopia washed Yirgacheffe Gedeb" },
    { title: "Kenya AA washed", country: "kenya", roast: 1, cats: { fruit: 1, floral: .2, sweet: .3 }, notes: ["blackcurrant", "grapefruit", "tomato-like sweetness"], drink: "Juicy and bright; best black", search: "Kenya AA washed" },
    { title: "Colombia washed (Huila / Nariño)", country: "colombia", roast: 2, cats: { sweet: .8, chocolate: .5, fruit: .5 }, notes: ["red apple", "caramel", "cocoa"], drink: "Balanced all-rounder, black or with milk", search: "Colombia Huila Nariño washed" },
    { title: "Colombia Pink Bourbon", country: "colombia", roast: 1, cats: { fruit: .8, floral: .5, sweet: .6 }, notes: ["red fruit", "florals", "sugar cane"], drink: "Fruity yet sweet; black or light milk", search: "Colombia Pink Bourbon" },
    { title: "Brazil natural (Cerrado / Mogiana)", country: "brazil", roast: 2, cats: { chocolate: 1, nut: .9, sweet: .6 }, notes: ["milk chocolate", "hazelnut", "caramel"], drink: "A classic for milk drinks and espresso", search: "Brazil natural Cerrado Mogiana" },
    { title: "Guatemala (Huehuetenango / Antigua)", country: "guatemala", roast: 2, cats: { chocolate: .7, sweet: .6, nut: .4, fruit: .3 }, notes: ["cocoa", "brown sugar", "orange"], drink: "Round and sweet; black or with milk", search: "Guatemala Huehuetenango Antigua" },
    { title: "Costa Rica honey process", country: "costa rica", roast: 1, cats: { sweet: 1, fruit: .5, chocolate: .3 }, notes: ["honey", "orange", "brown sugar"], drink: "Sweet and smooth; very forgiving", search: "Costa Rica honey process" },
    { title: "Panama Geisha", country: "panama", roast: 0, cats: { floral: 1, fruit: .6, sweet: .3 }, notes: ["jasmine", "bergamot", "peach"], drink: "A splurge; enjoy black", search: "Panama Geisha" },
    { title: "Rwanda / Burundi washed", country: "rwanda", roast: 1, cats: { fruit: .6, sweet: .5, floral: .3 }, notes: ["red berries", "plum", "sugar"], drink: "Clean and fruity; black or filter", search: "Rwanda Burundi washed" },
    { title: "Sumatra wet-hulled", country: "indonesia", roast: 3, cats: { earthy: 1, chocolate: .5, nut: .2 }, notes: ["cedar", "tobacco", "dark chocolate"], drink: "Heavy and earthy; good with milk", search: "Sumatra Mandheling wet-hulled" },
    { title: "El Salvador Pacamara", country: "el salvador", roast: 2, cats: { sweet: .8, chocolate: .6, fruit: .4 }, notes: ["caramel", "cocoa", "stone fruit"], drink: "Syrupy and sweet; versatile", search: "El Salvador Pacamara" },
    { title: "Peru or Honduras washed", country: "peru", roast: 2, cats: { nut: .7, chocolate: .6, sweet: .5 }, notes: ["almond", "cocoa", "caramel"], drink: "Easygoing everyday coffee", search: "Peru Honduras washed" },
    { title: "Italian-style espresso blend", country: "blend", roast: 3, cats: { chocolate: .8, nut: .6, earthy: .4, sweet: .3 }, notes: ["dark chocolate", "roasted nuts", "spice"], drink: "Built for espresso and milk", search: "Italian espresso blend medium dark" },
    { title: "Tanzania peaberry", country: "tanzania", roast: 1, cats: { fruit: .7, floral: .3, sweet: .4 }, notes: ["blackberry", "citrus", "floral"], drink: "Lively and juicy; black or filter", search: "Tanzania peaberry" }
  ];

  CATALOG.forEach((item) => { item.id = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); });
  // Live shop matches come from data/shop-matches.json, refreshed daily by tools/update-shops.mjs.
  let shopData = { matches: {} };
  const DRINK_LABELS = { black: "Espresso", americano: "Americano", milk: "Dairy milk", oat: "Oat milk", icedmilk: "Iced latte · dairy", icedoat: "Iced latte · oat" };

  function productKey(value) {
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) return "";
      return `${url.hostname.toLowerCase().replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`;
    } catch { return ""; }
  }

  function beanForProduct(beans, url) {
    const key = productKey(url);
    return key ? beans.find((bean) => productKey(bean.recommendationUrl || bean.productUrl) === key) : null;
  }

  function matchesFor(item, beans) {
    const available = (shopData.matches[item.id] || []).map((product) => ({ product, bean: beanForProduct(beans, product.url), available: true }));
    available.sort((a, b) => {
      const aRating = a.bean ? averageRating(a.bean) : null;
      const bRating = b.bean ? averageRating(b.bean) : null;
      return (bRating !== null) - (aRating !== null) || (bRating ?? 0) - (aRating ?? 0) ||
        Number(b.product.favorite) - Number(a.product.favorite) || (a.product.price ?? 1e9) - (b.product.price ?? 1e9);
    });
    const shown = available.slice(0, 8);
    for (const entry of available.slice(8)) if (entry.bean && entry.bean.recommendationCategory === item.id) shown.push(entry);
    const saved = beans.filter((bean) => bean.recommendationCategory === item.id && bean.recommendationUrl &&
      !available.some(({ bean: matched }) => matched === bean))
      .map((bean) => ({ bean, available: false, product: { title: bean.name, store: bean.roaster, url: bean.recommendationUrl } }));
    saved.sort((a, b) => (averageRating(b.bean) !== null) - (averageRating(a.bean) !== null) || (averageRating(b.bean) ?? 0) - (averageRating(a.bean) ?? 0));
    return { shown, saved };
  }

  function esc(value = "") {
    return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function loadBeans() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch (error) {
      return [];
    }
  }
  function averageRating(bean) {
    const scores = (Array.isArray(bean.brews) ? bean.brews : [])
      .filter((brew) => brew.rating !== null && brew.rating !== undefined && brew.rating !== "" && Number.isFinite(Number(brew.rating)))
      .map((brew) => Number(brew.rating));
    if (scores.length) return scores.reduce((a, b) => a + b, 0) / scores.length;
    const own = Number(bean.rating);
    return bean.rating !== null && bean.rating !== undefined && bean.rating !== "" && Number.isFinite(own) ? own : null;
  }
  function categoriesOf(bean) {
    const text = (Array.isArray(bean.profile) ? bean.profile : []).join(" ").toLowerCase();
    return CATEGORIES.filter((cat) => KEYWORDS[cat].some((word) => text.includes(word)));
  }
  function roastIndex(bean) {
    const level = String(bean.roastLevel || "medium").toLowerCase();
    const index = ROASTS.indexOf(level);
    return index === -1 ? 2 : index;
  }
  function joinList(items) {
    if (items.length < 2) return items.join("");
    return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
  }

  function buildProfile(rated) {
    const weights = Object.fromEntries(CATEGORIES.map((cat) => [cat, 0]));
    let roastSum = 0, roastWeight = 0;
    rated.forEach(({ bean, rating }) => {
      const weight = Math.max(-1, Math.min(1, (rating - 6) / 4));
      categoriesOf(bean).forEach((cat) => { weights[cat] += weight; });
      if (weight > 0) { roastSum += roastIndex(bean) * weight; roastWeight += weight; }
    });
    const peak = Math.max(...CATEGORIES.map((cat) => Math.abs(weights[cat])), 0);
    if (peak > 0) CATEGORIES.forEach((cat) => { weights[cat] /= peak; });
    return { weights, hasSignal: peak > 0, roast: roastWeight ? roastSum / roastWeight : null };
  }

  function recommend(beans) {
    const rated = beans.map((bean) => ({ bean, rating: averageRating(bean) })).filter((entry) => entry.rating !== null);
    if (!rated.length) return { rated, results: [] };
    const profile = buildProfile(rated);
    const owned = beans.map((bean) => String(bean.origin || "").toLowerCase());
    const loved = rated.filter((entry) => entry.rating >= 7);
    const disliked = rated.filter((entry) => entry.rating < 5.5);

    const results = CATALOG.map((item) => {
      const strong = CATEGORIES.filter((cat) => (item.cats[cat] || 0) >= .5);
      const total = CATEGORIES.reduce((sum, cat) => sum + (item.cats[cat] || 0), 0) || 1;
      const affinity = profile.hasSignal ? CATEGORIES.reduce((sum, cat) => sum + profile.weights[cat] * (item.cats[cat] || 0), 0) / total : 0;
      const roastFit = profile.roast === null ? .6 : 1 - Math.min(4, Math.abs(profile.roast - item.roast)) / 4;
      const isNew = item.country === "blend" || !owned.some((origin) => origin.includes(item.country));
      let originPull = 0, originBean = null;
      rated.forEach(({ bean, rating }) => {
        if (item.country !== "blend" && String(bean.origin || "").toLowerCase().includes(item.country)) {
          const pull = Math.max(-1, Math.min(1, (rating - 6) / 4));
          if (Math.abs(pull) > Math.abs(originPull)) { originPull = pull; originBean = { bean, rating }; }
        }
      });
      const score = Math.max(0, .5 * ((affinity + 1) / 2) + .2 * roastFit + .1 * (isNew ? 1 : .4) + .2 * ((originPull + 1) / 2));

      let best = null, bestShared = [];
      loved.forEach(({ bean, rating }) => {
        const shared = categoriesOf(bean).filter((cat) => strong.includes(cat));
        if (shared.length > bestShared.length || (shared.length === bestShared.length && shared.length && best && rating > best.rating)) { best = { bean, rating }; bestShared = shared; }
      });
      let clash = null;
      disliked.forEach(({ bean, rating }) => {
        const shared = categoriesOf(bean).filter((cat) => strong.includes(cat));
        if (shared.length && !clash) clash = { bean, rating, shared };
      });
      return { item, score, isNew, best, bestShared, clash, originBean, originPull };
    });

    results.sort((a, b) => b.score - a.score);
    return { rated, results };
  }

  function productCard({ product, bean, available }, item) {
    const rating = bean ? averageRating(bean) : null;
    const breakdown = bean ? Object.entries(DRINK_LABELS).map(([style, label]) => {
      const scores = (bean.brews || []).filter((brew) => brew.drinkStyle === style && brew.rating !== null && brew.rating !== undefined && brew.rating !== "" && Number.isFinite(Number(brew.rating))).map((brew) => Number(brew.rating));
      return scores.length ? `${label}: ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}/10 (${scores.length})` : "";
    }).filter(Boolean).join(" · ") : "";
    const params = new URLSearchParams(bean
      ? { bean: String(bean.id) }
      : { addProduct: "1", name: product.title, roaster: product.roaster || (["Roast Market", "Honest & Rare"].includes(product.store) ? "" : product.store), url: product.url, category: item.id });
    const label = rating === null ? (bean ? "Saved · not rated" : "Not tried yet") : `Your average: ${rating.toFixed(1)}/10`;
    const productLink = available ? `<a class="store-link" href="${esc(product.url)}" target="_blank" rel="noopener noreferrer">${product.favorite ? "★ " : ""}${esc(product.store)} · ${esc(product.title)}${Number.isFinite(product.price) ? ` · ${product.price.toFixed(2).replace(".", ",")} €` : ""} ↗</a>` : `<span>${esc(product.title)} · ${esc(product.store)}</span>`;
    return `<div class="recommend-product">${productLink}<div class="recommend-product-meta"><strong>${esc(label)}</strong>${breakdown ? `<span>${esc(breakdown)}</span>` : ""}${!available ? '<span>Not currently listed in this category’s shop results</span>' : ""}<a href="index.html?${esc(params.toString())}#library">${bean ? "View / rate coffee →" : "Add to collection →"}</a></div></div>`;
  }

  function card({ item, score, isNew, best, bestShared, clash, originBean, originPull }, detailed = false, beans = []) {
    const percent = Math.round(Math.max(40, Math.min(98, score * 100)));
    const why = originBean && originPull >= .5
      ? `You rated <strong>${esc(originBean.bean.name)}</strong> from ${esc(item.country)} ${originBean.rating.toFixed(1)}/10, so this origin is a safe bet.${best && bestShared.length ? ` It also shares the ${esc(joinList(bestShared))} character you like.` : ""}`
      : best
      ? `Shares the ${joinList(bestShared)} character of <strong>${esc(best.bean.name)}</strong>, which you rated ${best.rating.toFixed(1)}/10.`
      : isNew ? "A fresh direction compared with the beans you have logged so far, with a flavour profile close to your taste." : "Close to the flavour balance of the coffees you rated well.";
    const headsUp = originBean && originPull <= -.2 ? `<p class="recommend-heads-up">Heads-up: you rated <strong>${esc(originBean.bean.name)}</strong> (${esc(item.country)}) only ${originBean.rating.toFixed(1)}/10.</p>` : clash ? `<p class="recommend-heads-up">Heads-up: leans ${esc(joinList(clash.shared))}, which you rated lower in <strong>${esc(clash.bean.name)}</strong> (${clash.rating.toFixed(1)}/10).</p>` : "";
    const origin = isNew ? "New origin for you" : "An origin you already know";
    const tags = item.notes.map((note) => `<span class="tag">${esc(note)}</span>`).join("");
    const { shown, saved } = matchesFor(item, beans);
    const stores = detailed
      ? `<div class="store-links"><span class="store-label">In stock now</span>${shown.length ? shown.map((entry) => productCard(entry, item)).join("") : '<p class="recommend-note">No matching bean in stock at the tracked shops right now.</p>'}${saved.length ? `<span class="store-label">Your previously saved coffees</span>${saved.map((entry) => productCard(entry, item)).join("")}` : ""}</div>`
      : "";
    const foot = detailed
      ? `<div class="recommend-foot"><span>${esc(item.drink)}</span></div>`
      : `<div class="recommend-foot"><span>${esc(item.drink)}</span><a href="beans-to-try.html#${esc(item.id)}">Beans &amp; shops →</a></div>`;
    const heading = detailed ? `<h3>${esc(item.title)}</h3>` : `<h3><a class="recommend-title-link" href="beans-to-try.html#${esc(item.id)}">${esc(item.title)}</a></h3>`;
    return `<article class="recommend-card" id="${detailed ? esc(item.id) : ""}"><div class="recommend-top"><div>${heading}<p class="recommend-origin">${esc(origin)} · ${esc(ROASTS[item.roast])} roast</p></div><span class="match-badge">${percent}% match</span></div><div class="recommend-meta">${tags}</div><p class="recommend-why">${why}</p>${headsUp}${stores}${foot}</article>`;
  }

  function render() {
    const beans = loadBeans();
    const { rated, results } = recommend(beans);
    const empty = `<div class="empty-map-state">${beans.length ? "Log and rate at least one cup of a saved coffee and your personal recommendations will appear here." : "Save a coffee and rate a cup, and your personal recommendations will appear here."}<br /><a href="./index.html#library">Go to My collection →</a></div>`;
    const basis = rated.length ? `Based on ${rated.length} rated ${rated.length === 1 ? "coffee" : "coffees"}` : "Rate a few cups to unlock suggestions";
    if (countNote) countNote.textContent = basis;
    if (root) {
      root.innerHTML = rated.length
        ? `<div class="recommend-grid">${results.slice(0, 4).map((entry) => card(entry)).join("")}</div><p class="recommend-note"><a href="beans-to-try.html">See all suggestions and where to buy them →</a></p>`
        : empty;
    }
    if (allRoot) {
      allRoot.innerHTML = rated.length
        ? `<p class="recommend-note">Add a product to your collection, then log a rated cup. Your rated products appear first, ordered by your average across drink styles; the separate drink averages are shown too. Untried products have no personal score. Saved coffees remain below when no longer listed.</p><div class="recommend-grid">${results.map((entry) => card(entry, true, beans)).join("")}</div><p class="recommend-note">Shop data updated ${esc(shopData.updated ? new Date(shopData.updated).toLocaleDateString("de-DE") : "not yet")}. Prices are the shops’ own. The match percentage describes the bean style, not an individual product.</p>`
        : empty;
      const target = location.hash && document.getElementById(location.hash.slice(1));
      if (target) { target.classList.add("is-highlighted"); target.scrollIntoView({ block: "start" }); }
    }
  }

  window.addEventListener("storage", (event) => { if (event.key === STORAGE_KEY) render(); });
  window.addEventListener("pageshow", (event) => { if (event.persisted) render(); });
  fetch("data/shop-matches.json", { cache: "no-cache" }).then((r) => r.ok ? r.json() : null).catch(() => null).then((data) => { if (data && data.matches) shopData = data; render(); });
})();
