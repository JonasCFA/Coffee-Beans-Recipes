# Daily Pour — Coffee Journal

A premium-feeling coffee journal for roasteries, tasting notes, personalized recipes and brew logs. It runs as a static website and works on GitHub Pages.

## Smart recipe builder

When you add a coffee, Daily Pour suggests a **starting recipe** using the chosen brew method, roast level and tasting notes. Espresso starts around 18g in, with a suggested yield, temperature, pre-infusion and 9-bar reference pressure. Light/bright profiles get a slightly longer ratio and hotter water; darker/chocolate-forward profiles get a shorter ratio and slightly cooler water. Filter methods get their own dose, water amount, grind guidance and bloom/steep time; pressure is marked not applicable.

These are suggestions, not a promise of a perfect cup. Grinder settings vary, and pressure/pre-infusion depend on your espresso machine. The app deliberately does not invent a numeric grind setting: enter the setting for your own grinder.

## Dial in and remember each bean

Select a bean and choose **Adjust recipe / log brew**. The form loads that bean's latest saved recipe. Adjust dose, yield, grind, temperature, method, pre-infusion, pressure in bar and pressure profile to reflect the actual brew, then save. That version becomes the latest recipe for that bean and is recalled when you return to it. Previous brews remain in the history, including their pressure and pre-infusion values, so you can switch between beans without having to remember their settings.

## Rating scale

Brew ratings use **0–10**, where 10 is best. Leave **Leave this cup unrated** checked to omit a rating, or uncheck it to enter a score including 0. The score for a coffee is the average of its rated brews, falling back to its saved starting rating when it has no rated brews. Older 0–5 scores from the first storage format are migrated to 0–10 automatically.

## Other features

- Save coffees with roastery, location, origin, roast date, roast level, tasting notes and product URL.
- Free-text roastery names support German and international roasters.
- Search, filter and sort; favorite coffees; export a JSON backup.
- Automatically group tasting notes into broad taste families.
- Save data in browser localStorage.

## Roastery lookup limitation

The roastery search opens a web search and lets you save a product-page URL. GitHub Pages cannot reliably scrape arbitrary sites from the browser; automated import requires a backend/API. Verify information on the official roastery website before saving.

## Run locally

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.
