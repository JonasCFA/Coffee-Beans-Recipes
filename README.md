# Daily Pour — Coffee Journal

A premium-feeling coffee journal for roasteries, tasting notes, personalized recipes and brew logs. It runs as a static website and works on GitHub Pages.

## Your collection and taste profile

Add a coffee with roastery, origin, roast date and tasting notes. Saved beans appear in **My collection** on the homepage; use search, taste-group filters and sorting to find one, then select it to view its profile, recipe, history and drink-style suggestions. **My taste profile** summarizes the tasting notes across all coffees you have saved and shows which taste families are most represented.

Each coffee detail includes three espresso serving profiles: straight/black, with dairy milk, and with oat milk. At first, the 0–10 compatibility scores are clearly labelled flavour-note estimates, based on the roaster's described notes—not a guarantee of your preference. When you log a brew, select its drink style and optionally rate it. For a style with your own ratings, the displayed score uses the average of those personal ratings instead of the estimate. Rating brews in each style lets the suggestions reflect your palate over time.

## Smart recipe builder

The app suggests a starting recipe using brew method, roast level and tasting notes. Espresso starts around 18g in, with a suggested yield, temperature, pre-infusion and 9-bar reference pressure; filter methods have their own starting dose, water amount, grind guidance and bloom/steep time. Pressure is shown as not applicable for filter. Suggestions are not guaranteed recipes: grinder settings and machine pressure vary.

Choose a saved coffee and select **Adjust recipe / log brew**. The latest recipe for that particular bean is loaded. Adjust dose, yield, grind, temperature, method, drink style, pre-infusion, pressure and pressure profile to describe the actual cup. Saving a brew updates that bean's latest recipe while keeping earlier brews in its history. Switch beans and each one recalls its own settings.

## Ratings and saved data

Cup ratings use **0–10**, with 10 best. Leave the unrated option checked to omit a score; uncheck it to give an explicit score, including zero. The bean's overall score is the average of its rated brews, falling back to its saved starting rating if it has no rated brews.

Data is stored in this browser's localStorage, not synced between devices. Use **Export journal** to download a backup. Older stored data is migrated automatically.

## Roastery lookup limitation

Roastery search opens a web search and allows saving a product-page URL. GitHub Pages cannot reliably scrape arbitrary websites in the browser; automated import requires a backend/API. Verify details on the official roastery website before saving.

## Run locally

Open `index.html` directly, or serve the project folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.
