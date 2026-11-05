# Daily Pour — Coffee Journal

A premium-feeling coffee journal for roasteries, tasting notes, personalized recipes and brew logs. It runs as a static website and works on GitHub Pages.

## Smart recipe starting points

When adding a coffee, Daily Pour suggests a starting recipe using the selected brew method, roast level and tasting notes. Espresso starts around 18g in, with a suggested yield, water temperature, pre-infusion and 9-bar pressure. Light/bright profiles start with a somewhat longer ratio and warmer water; dark/chocolate-forward coffees start with a shorter ratio and slightly cooler water. Filter methods receive separate dose, water, grind, temperature and bloom/steep suggestions.

These are practical starting points, not a claim that the app can predict a perfect cup. Grinder settings vary, and espresso pressure/pre-infusion depend on the machine. The numeric grind starts as a reminder to dial in on your own grinder.

## Dial in and remember each bean

Click **Adjust recipe / log brew** on a selected bean. The form loads that bean's latest saved recipe, including dose, yield, grind, water temperature, brew method, pre-infusion/bloom, pressure in bar and pressure profile. Change the settings to match the actual brew, add notes and optionally rate the cup. Saving logs the cup and replaces that bean's latest recipe. Selecting another bean and returning later loads its own saved settings; recipes are stored per bean, and brew history remains available.

## Rating scale

Brew ratings use **0–10**, where 10 is best. The rating slider supports half points. Leave **Leave this cup unrated** checked to omit a rating, or uncheck it to enter a score including 0. The displayed bean rating is the average of its rated brews; if there are no rated brews, the optional bean-level score is used.

Older local data is migrated to the current storage format. Existing 0–5 scores from the first version are converted to 0–10; a legacy zero that meant “not rated” remains unrated.

## Other features

- Save coffees with roastery, location, origin, roast date, roast level, tasting notes and product URL.
- Free-text roastery names support German and international roasters.
- Search, filter and sort; favorite coffees; export a JSON backup.
- Automatically group tasting notes into broad taste families.
- Save data in browser localStorage.

## Roastery lookup limitation

The roastery search opens a web search and lets you save a product-page URL. GitHub Pages cannot reliably scrape arbitrary sites from the browser; automated import requires a backend/API. Verify information on the official roastery website before saving it.

## Run locally

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.
