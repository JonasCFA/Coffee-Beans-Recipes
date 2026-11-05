# Daily Pour — Coffee Journal

A premium-feeling coffee journal for roasteries, tasting notes, recipes and brew logs. It runs as a static website and works on GitHub Pages.

## Recipe suggestions and dialing in

When you add a coffee, the app creates a **suggested starting recipe** using its roast level, tasting notes and selected brew method. For espresso, the starting point is typically 18g in, with a shorter yield for darker/chocolate-forward coffees, a longer yield for lighter/brighter coffees, and a temperature adjusted accordingly. Filter methods get a separate starting dose, water amount, grind guidance and bloom/steep suggestion.

These are general starting points—not a guaranteed perfect recipe. Grind numbers are grinder-specific, so the app does not invent a setting for an unknown grinder. It suggests that you dial in for your grinder, then lets you enter the setting that works for you.

Use **Adjust recipe / log brew** on a selected bean to edit dose, yield, grind, temperature, brew method and pre-infusion. Save the outcome and it becomes that bean's latest recipe. Each brew is also kept in its history, so switching beans brings back each bean's own last saved settings.

## Rating

Brew ratings use a 0–10 scale (10 is best). The bean's displayed rating is the average of its rated brews; if it has no rated brews, it is shown as not rated unless there is a migrated legacy rating.

## Other features

- Save coffees with roastery, location, origin, roast date, roast level, tasting notes and product URL.
- Free-text roastery names support German and international roasters.
- Search, filter and sort the collection; favorite coffees; export a JSON backup.
- Automatically group tasting notes into broad taste families.
- Save data in browser localStorage.

## Existing data

On first load after this update, saved data from the earlier app version is migrated to the new storage key. Its previous 0–5 ratings are converted to the new 0–10 scale. The starter recipe is added to older beans that do not yet have a saved recipe.

## Roastery website lookup

The roastery search opens a web search and lets you save a product-page URL. GitHub Pages cannot reliably scrape arbitrary sites from the browser; automated import requires a backend/API. Verify information on the roaster's official site before saving.

## Run locally

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.
