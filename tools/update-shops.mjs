// Reads the public Shopify catalogs of the tracked roasteries and writes data/shop-matches.json:
// for each recommended bean style, the in-stock products that match it, with direct product links.
import { writeFile, mkdir } from "node:fs/promises";

const SHOPS = [
  { name: "DAK Coffee Roasters", city: "Amsterdam", base: "https://www.dakcoffeeroasters.com", favorite: true },
  { name: "Nativo", city: "Frankfurt", base: "https://www.nativokaffee.de", favorite: true },
  { name: "Due Mani", city: "", base: "https://duemani.de", favorite: true },
  { name: "Bunca", city: "", base: "https://bunca.coffee", favorite: true },
  { name: "Bonanza Coffee", city: "Berlin", base: "https://bonanzacoffee.de" },
  { name: "19grams", city: "Berlin", base: "https://19grams.coffee" },
  { name: "The Barn", city: "Berlin", base: "https://www.thebarn.de" },
  { name: "Five Elephant", city: "Berlin", base: "https://fiveelephant.com" },
  { name: "Public Coffee Roasters", city: "Berlin", base: "https://publiccoffeeroasters.com" },
  { name: "Man Versus Machine", city: "Munich", base: "https://mvsm.de" },
  { name: "Röststätte", city: "Berlin", base: "https://roeststaette.de" },
  { name: "Coffee Circle", city: "Berlin", base: "https://www.coffeecircle.com" },
  { name: "Elbgold", city: "Hamburg", base: "https://www.elbgold.com" },
  { name: "Hoppenworth & Ploch", city: "Frankfurt", base: "https://www.hoppenworth-ploch.de" },
  // Multi-roaster shops: several different roasteries in one place.
  { name: "Roast Market", city: "Germany", base: "https://www.roastmarket.de", multi: true, loader: "roastmarket" },
  { name: "Honest & Rare", city: "Germany", base: "https://www.honest-rare.de", multi: true, loader: "honestrare" }
];

// Keys are the slugified catalog titles from recommendations.js.
const RULES = {
  "ethiopia-natural-guji-yirgacheffe": { country: /ethiopia|äthiopien|guji|yirgacheffe|sidamo/, process: /natural|naturell|natur\b/ },
  "ethiopia-washed-yirgacheffe-gedeb": { country: /ethiopia|äthiopien|yirgacheffe|gedeb/, process: /washed|gewaschen/, not: /natural|naturell|anaerob/ },
  "kenya-aa-washed": { country: /kenya|kenia/ },
  "colombia-washed-huila-narino": { country: /colombia|kolumbien|huila|nari[nñ]o/, not: /pink bourbon|natural|anaerob|decaf|entkoffeiniert/ },
  "colombia-pink-bourbon": { country: /colombia|kolumbien/, process: /pink bourbon/ },
  "brazil-natural-cerrado-mogiana": { country: /brazil|brasil/, not: /decaf|entkoffeiniert/ },
  "guatemala-huehuetenango-antigua": { country: /guatemala|huehuetenango|antigua/ },
  "costa-rica-honey-process": { country: /costa rica/, process: /honey/ },
  "panama-geisha": { country: /panama/, process: /gei?sha/ },
  "rwanda-burundi-washed": { country: /rwanda|ruanda|burundi/ },
  "sumatra-wet-hulled": { country: /sumatra|mandheling|indonesia|indonesien/ },
  "el-salvador-pacamara": { country: /el salvador/, process: /pacamara/ },
  "peru-or-honduras-washed": { country: /peru|honduras/, not: /decaf|entkoffeiniert/ },
  "italian-style-espresso-blend": { title: /blend|house|espresso essentials|cr[eè]me/, country: /./, not: /filter/ },
  "tanzania-peaberry": { country: /tanzania/, process: /peaberry/ }
};

const NON_COFFEE = /gift|geschenk|abo\b|subscription|gutschein|voucher|grinder|m[uü]hle|tasse|mug|dripper|machine|maschine|tamper|kettle|waage|scale|shirt|tote|bag clip|reiniger|cleaner|kapsel|capsule|cascara|drip bag|dripbag|sample|probier|bundle|\bbox\b|set\b|calendar|advent|hot chocolate|tree|decaf|entkoffeiniert|ground|gemahlen|instant|\bjar\b|refill|cold brew|vorteilspaket|aromatisiert|likör|\d+ ?kg/;
const BEAN_TYPES = /^(coffee|kaffee|filter coffee|espresso coffee|single estates|blends|röstkaffee)$/i;

// Beans only: a bean-like product type, or (for shops without types) a bag of at least 200 g.
function isBeanProduct(product) {
  if (product.product_type) return BEAN_TYPES.test(product.product_type.trim());
  return (product.variants || []).some((variant) => Number(variant.grams) >= 200);
}

async function getJson(url) {
  const response = await fetch(url, { headers: { "user-agent": "daily-pour-bean-finder/1.0", accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadShopify(shop) {
  const products = [];
  for (let page = 1; page <= 6; page++) {
    const batch = (await getJson(`${shop.base}/products.json?limit=250&page=${page}`)).products || [];
    products.push(...batch.map((product) => ({ ...product, url: `${shop.base}/products/${product.handle}` })));
    if (batch.length < 250) break;
  }
  return products;
}

// WooCommerce public Store API, normalised to the Shopify shape used below.
async function loadWoo(shop) {
  const products = [];
  for (let page = 1; page <= 6; page++) {
    const batch = await getJson(`${shop.base}/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
    for (const item of batch) {
      const categories = (item.categories || []).map((category) => category.name).join(" ");
      const minor = Number(item.prices?.currency_minor_unit ?? 2);
      products.push({ title: item.name, vendor: (item.brands || [])[0]?.name || "", product_type: /kaffee|coffee|espresso|bohne|röstung/i.test(categories) ? "Coffee" : categories, tags: (item.tags || []).map((tag) => tag.name), body_html: item.short_description || item.description || "", url: item.permalink, variants: [{ available: item.is_in_stock !== false, price: Number(item.prices?.price) / 10 ** minor, grams: Number(item.weight) * 1000 || 250 }] });
    }
    if (batch.length < 100) break;
  }
  return products;
}

// Roast Market exposes a Vue Storefront (Elasticsearch) catalog API.
async function loadRoastMarket(shop) {
  const products = [];
  for (let from = 0; from < 4000; from += 500) {
    const request = { query: { bool: { filter: [{ term: { status: 1 } }] } }, from, size: 500, _source: ["name", "url_path", "url_key", "price", "final_price", "stock", "meta_description"] };
    const data = await getJson(`${shop.base}/api/catalog/vue_storefront_catalog/product/_search?request=${encodeURIComponent(JSON.stringify(request))}`);
    const hits = data.hits?.hits || [];
    for (const { _source: item } of hits) {
      const path = item.url_path || (item.url_key ? `${item.url_key}.html` : "");
      if (!path || !item.name) continue;
      products.push({ title: item.name, vendor: "", product_type: "Coffee", tags: [], body_html: item.meta_description || "", url: `${shop.base}/${path.replace(/^\//, "")}`, variants: [{ available: item.stock ? item.stock.is_in_stock !== false : true, price: Number(item.final_price || item.price), grams: 250 }] });
    }
    if (hits.length < 500) break;
  }
  return products;
}

// Honest & Rare (CS-Cart): server-rendered listing pages of coffee beans.
async function loadHonestRare(shop) {
  const products = [];
  const seen = new Set();
  for (let page = 1; page <= 20; page++) {
    const response = await fetch(`${shop.base}/kaffeebohnen/${page > 1 ? `page-${page}/` : ""}`, { headers: { "user-agent": "daily-pour-bean-finder/1.0" }, signal: AbortSignal.timeout(25000) });
    if (!response.ok) { if (page === 1) throw new Error(`HTTP ${response.status}`); break; }
    const html = await response.text();
    let added = 0;
    const cards = html.split(/name="product_form_\d+"/).slice(1);
    for (const card of cards) {
      const link = card.match(/\[product_id\]"[^>]*\/>\s*<a href="([^"]+)" title="([^"]*)"/);
      if (!link) continue;
      const url = link[1];
      const title = link[2].replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim();
      if (!title || seen.has(url)) continue;
      seen.add(url); added++;
      const price = card.match(/ty-price-num">\s*([\d.,]+)/);
      const soldOut = /ausverkauft|nicht verf[uü]gbar|out-of-stock/i.test(card);
      products.push({ title, vendor: "", product_type: "Coffee", tags: [], body_html: "", url, variants: [{ available: !soldOut, price: price ? Number(price[1].replace(/\./g, "").replace(",", ".")) : NaN, grams: 250 }] });
    }
    if (!added) {
      const i = html.indexOf("product_form");
      console.log(`Honest & Rare page ${page}: no products parsed; markup: ${html.slice(Math.max(0, i - 300), i + 1800).replace(/\s+/g, " ")}`);
      break;
    }
  }
  return products;
}

async function loadProducts(shop) {
  if (shop.loader === "roastmarket") return loadRoastMarket(shop);
  if (shop.loader === "honestrare") return loadHonestRare(shop);
  try { return await loadShopify(shop); }
  catch (shopifyError) {
    try { return await loadWoo(shop); }
    catch { throw shopifyError; }
  }
}

const text = (product) => [product.title, product.product_type, (product.tags || []).join(" ")].join(" ").toLowerCase();
const blurb = (product) => String(product.body_html || "").replace(/<[^>]+>/g, " ").toLowerCase().slice(0, 150);

function matches(product, rule) {
  const head = text(product);
  const body = head + " " + blurb(product);
  if (!isBeanProduct(product) || NON_COFFEE.test(head)) return false;
  if (rule.title && !rule.title.test(String(product.title).toLowerCase())) return false;
  if (!rule.country.test(body)) return false;
  if (rule.process && !rule.process.test(body)) return false;
  if (rule.not && rule.not.test(head)) return false;
  return true;
}

const result = { updated: new Date().toISOString(), shops: {}, matches: {} };
for (const id of Object.keys(RULES)) result.matches[id] = [];

for (const shop of SHOPS) {
  try {
    const products = (await loadProducts(shop)).filter((product) => (product.variants || []).some((variant) => variant.available));
    result.shops[shop.name] = { ok: true, products: products.length };
    if (process.env.DEBUG_TYPES) {
      const types = new Map();
      for (const product of products) { const key = product.product_type || "(none)"; (types.get(key) || types.set(key, []).get(key)).push(product.title); }
      for (const [type, titles] of types) console.log(`TYPE ${shop.name} | ${type} | ${titles.length} | ${titles.slice(0, 3).join(" ; ")}`);
    }
    for (const product of products) {
      const bags = product.variants.filter((variant) => variant.available && Number(variant.grams) >= 200);
      const price = Math.min(...(bags.length ? bags : product.variants.filter((variant) => variant.available)).map((variant) => Number(variant.price)));
      for (const [id, rule] of Object.entries(RULES)) {
        if (matches(product, rule)) result.matches[id].push({ store: shop.name, city: shop.city, favorite: Boolean(shop.favorite), title: product.title, roaster: shop.multi ? String(product.vendor || "") : "", url: product.url, price: Number.isFinite(price) ? price : null });
      }
    }
    console.log(`${shop.name}: ${products.length} in-stock products`);
  } catch (error) {
    result.shops[shop.name] = { ok: false, error: String(error.message || error) };
    console.log(`${shop.name}: skipped (${error.message || error})`);
  }
}

for (const id of Object.keys(result.matches)) {
  // Keep at most two products per shop so cards stay short.
  const perShop = new Map();
  result.matches[id] = result.matches[id].filter((entry) => { const count = perShop.get(entry.store) || 0; perShop.set(entry.store, count + 1); return count < 2; });
  console.log(`${id}: ${result.matches[id].length} matches`);
}
// Keep only links that really open, so every button leads to a live product page.
async function linkWorks(url) {
  try {
    const response = await fetch(url, { method: "GET", redirect: "follow", headers: { "user-agent": "Mozilla/5.0 daily-pour-bean-finder/1.0" }, signal: AbortSignal.timeout(20000) });
    return response.ok;
  } catch { return false; }
}
const unique = [...new Set(Object.values(result.matches).flat().map((entry) => entry.url))];
const alive = new Set();
for (let i = 0; i < unique.length; i += 8) await Promise.all(unique.slice(i, i + 8).map(async (url) => { if (await linkWorks(url)) alive.add(url); else console.log(`dead link dropped: ${url}`); }));
for (const id of Object.keys(result.matches)) result.matches[id] = result.matches[id].filter((entry) => alive.has(entry.url));
await mkdir("data", { recursive: true });
await writeFile("data/shop-matches.json", JSON.stringify(result, null, 1) + "\n");
