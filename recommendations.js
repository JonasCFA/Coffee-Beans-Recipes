(function () {
  const STORAGE_KEY = "daily-pour-coffee-journal-v4";
  const root = document.getElementById("recommendList");
  const countNote = document.getElementById("recommendCount");
  if (!root) return;

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
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
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
      const score = .6 * ((affinity + 1) / 2) + .25 * roastFit + .15 * (isNew ? 1 : .4);

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
      return { item, score, isNew, best, bestShared, clash };
    });

    results.sort((a, b) => b.score - a.score);
    return { rated, results: results.slice(0, 4) };
  }

  function card({ item, score, isNew, best, bestShared, clash }) {
    const percent = Math.round(Math.max(40, Math.min(98, score * 100)));
    const why = best
      ? `Shares the ${joinList(bestShared)} character of <strong>${esc(best.bean.name)}</strong>, which you rated ${best.rating.toFixed(1)}/10.`
      : isNew ? "A fresh direction compared with the beans you have logged so far, with a flavour profile close to your taste." : "Close to the flavour balance of the coffees you rated well.";
    const headsUp = clash ? `<p class="recommend-heads-up">Heads-up: leans ${esc(joinList(clash.shared))}, which you rated lower in <strong>${esc(clash.bean.name)}</strong> (${clash.rating.toFixed(1)}/10).</p>` : "";
    const origin = isNew ? "New origin for you" : "An origin you already know";
    const query = encodeURIComponent(`${item.search} specialty coffee beans`);
    const tags = item.notes.map((note) => `<span class="tag">${esc(note)}</span>`).join("");
    return `<article class="recommend-card"><div class="recommend-top"><div><h3>${esc(item.title)}</h3><p class="recommend-origin">${esc(origin)} · ${esc(ROASTS[item.roast])} roast</p></div><span class="match-badge">${percent}% match</span></div><div class="recommend-meta">${tags}</div><p class="recommend-why">${why}</p>${headsUp}<div class="recommend-foot"><span>${esc(item.drink)}</span><a href="https://www.google.com/search?q=${query}" target="_blank" rel="noopener noreferrer">Find roasteries ↗</a></div></article>`;
  }

  function render() {
    const beans = loadBeans();
    const { rated, results } = recommend(beans);
    if (!rated.length) {
      if (countNote) countNote.textContent = "Rate a few cups to unlock suggestions";
      root.innerHTML = `<div class="empty-map-state">${beans.length ? "Log and rate at least one cup of a saved coffee and your personal recommendations will appear here." : "Save a coffee and rate a cup, and your personal recommendations will appear here."}<br /><a href="./index.html#library">Go to My collection →</a></div>`;
      return;
    }
    if (countNote) countNote.textContent = `Based on ${rated.length} rated ${rated.length === 1 ? "coffee" : "coffees"}`;
    root.innerHTML = `<div class="recommend-grid">${results.map(card).join("")}</div><p class="recommend-note">These are bean styles to look for, not specific products. Matches weigh the tasting notes and roast level of coffees you rated, and favour origins you have not tried yet. Rate more cups to sharpen them.</p>`;
  }

  window.addEventListener("storage", (event) => { if (event.key === STORAGE_KEY) render(); });
  render();
})();
