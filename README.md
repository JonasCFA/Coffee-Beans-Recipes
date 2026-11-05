# Daily Pour — Coffee Journal

A premium-feeling coffee journal for roasteries, tasting notes, personalized recipes and brew logs. It runs as a static website and works on GitHub Pages.

## Recipe suggestions and dialing in

When you add a coffee, the app creates a suggested starting recipe from roast level, tasting notes and the selected brew method. For espresso, it starts with a typical 18g dose and adjusts the suggested yield and temperature for lighter/brighter or darker/chocolate-forward coffees. Filter methods get their own starting dose, water amount, temperature and bloom/steep guidance. These are starting points, not guaranteed perfect recipes.

Grind settings depend on your grinder, so the app does not guess a numeric setting. Add your grinder's setting when you brew. Use **Adjust recipe / log brew** to change dose, yield, grind, temperature, method and pre-infusion based on the actual cup. Saving a brew updates that bean's latest recipe. When you select that bean later, its last saved recipe and grind are loaded automatically; recipes are stored per bean, so switching beans recalls each coffee's own settings. The brew history remains available too.

## Rating scale

Brew ratings are on a **0–10 scale** (10 is best). The app accepts 0 as a real rating and includes it in averages. A bean's displayed score is the average of its rated brews; before any brews are rated, a saved bean-level score is used or the coffee appears as not rated.

Existing data from the earlier storage version is migrated automatically. Legacy 0–5 scores are converted to 0–10; a legacy zero, previously used to mean “not rated,” remains unrated. New brew scores use the full 0–10 scale.

## Other features

- Save coffees with roastery, location, origin, roast date, roast level, tasting notes and product URL.
- Free-text roastery names support German and international roasters.
- Search, filter and sort the collection; favorite coffees; export a JSON backup.
- Automatically group tasting notes into broad taste families.
- Save data in browser localStorage.

## Roastery website lookup

The roastery search opens a web search and lets you save a product-page URL. GitHub Pages cannot reliably scrape arbitrary sites from the browser; automated import requires a backend/API. Verify information on the official roastery website before saving it.

## Run locally

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.
