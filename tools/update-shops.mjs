// Reads the public Shopify catalogs of the tracked roasteries and writes data/shop-matches.json:
// for each recommended bean style, the in-stock products that match it, with direct product links.
import { writeFile, mkdir } from "node:fs/promises";

const SHOPS = [
  { name: "DAK Coffee Roasters", city: "Amsterdam", base: "https://www.dakcoffeeroasters.com", favorite: true },
  { name: "Nativo", city: "Frankfurt", base: "https://www.nativokaffee.de", favorite: true },
  { name: "Due Mani", city: "", base: "https://duemani.de", favorite: true },
  { name: "Bunca", city: "", base: "https://bunca.coffee", favorite: true },
  { name: "Bonanza Coffee", city: "Berlin", base: "https://bonanzacoffee.de" },
  { name: "The Barn", city: "Berlin", base: "https://www.thebarn.de" },
  { name: "Five Elephant", city: "Berlin", base: "https://fiveelephant.com" },
  { name: "Public Coffee Roasters", city: "Berlin", base: "https://publiccoffeeroasters.com" },
  { name: "Man Versus Machine", city: "Munich", base: "https://mvsm.de" },
  { name: "Röststätte", city: "Berlin", base: "https://roeststaette.de" },
  { name: "Coffee Circle", city: "Berlin", base: "https://www.coffeecircle.com" },
  { name: "Elbgold", city: "Hamburg", base: "https://www.elbgold.com" },
  { name: "Hoppenworth & Ploch", city: "Frankfurt", base: "https://www.hoppenworth-ploch.de" },
  { name: "Roast Market", city: "Berlin", base: "https://roastmarket.de" }
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
  "italian-style-espresso-blend": { country: /espresso/, process: /blend|mischung|miscela|dark|dunkel|italian/, not: /decaf|entkoffeiniert|set|probier/ },
  "tanzania-peaberry": { country: /tanzania/, process: /peaberry/ }
};

const NON_COFFEE = /gift|geschenk|abo\b|subscription|gutschein|voucher|grinder|m[uü]hle|tasse|cup\b|filter(?!kaffee)|machine|maschine|tamper|kettle|waage|scale|t-shirt|tote|cleaner|reiniger|capsule|kapsel|ground|gemahlen/;

async function loadProducts(shop) {
  const products = [];
  for (let page = 1; page <= 4; page++) {
    const response = await fetch(`${shop.base}/products.json?limit=250&page=${page}`, { headers: { "user-agent": "daily-pour-bean-finder/1.0" }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const batch = (await response.json()).products || [];
    products.push(...batch);
    if (batch.length < 250) break;
  }
  return products;
}

const text = (product) => [product.title, product.product_type, (product.tags || []).join(" ")].join(" ").toLowerCase();
const blurb = (product) => String(product.body_html || "").replace(/<[^>]+>/g, " ").toLowerCase().slice(0, 500);

function matches(product, rule) {
  const head = text(product);
  const body = head + " " + blurb(product);
  if (NON_COFFEE.test(head)) return false;
  if (!rule.country.test(rule.country.source.startsWith("espresso") ? head : body)) return false;
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
    for (const product of products) {
      const price = Math.min(...product.variants.filter((variant) => variant.available).map((variant) => Number(variant.price)));
      for (const [id, rule] of Object.entries(RULES)) {
        if (matches(product, rule)) result.matches[id].push({ store: shop.name, city: shop.city, favorite: Boolean(shop.favorite), title: product.title, url: `${shop.base}/products/${product.handle}`, price: Number.isFinite(price) ? price : null });
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
await mkdir("data", { recursive: true });
await writeFile("data/shop-matches.json", JSON.stringify(result, null, 1) + "\n");
