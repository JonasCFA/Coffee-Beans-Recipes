# Daily Pour — Coffee Journal

A premium-feeling coffee journal for roasteries, tasting notes, personalized recipes and brew logs. It runs as a static website and works on GitHub Pages.

## Taste map subsite

Open `taste-profile.html` (on GitHub Pages: `/taste-profile.html`) for three taste maps: espresso black, espresso with dairy milk and espresso with oat milk. Every coffee saved in **My collection** is automatically plotted on each map. Click a numbered dot or coffee name to highlight that bean across the maps and its prediction card.

The plot axes provide a visual guide: left is brighter/fruity/floral; right is more chocolate/nut-oriented; top is lighter/delicate; bottom is fuller-bodied/darker. Each bean also gets a separate 0–10 drink-style estimate and a short explanation. If you have rated brews for a style, the app shows your personal average instead of the estimate.

### Where do taste notes and sources come from?

When adding a coffee, enter the flavor notes from its roastery's official product page and paste that product URL. The taste subsite displays those saved notes and links to the URL as the reference. It does **not** download or verify website content: arbitrary roastery websites generally cannot be fetched reliably by a static GitHub Pages app. Estimates are transparent heuristics based on entered notes and roast level, not official sensory analysis or a guarantee. For example, the oat-milk note warns about possible bitter/roasty clashes if those notes are present; your actual espresso recipe, oat milk and palate matter.

The three charts are generated as inline SVG from saved data, so no remote image service is needed. The saved coffees are read from the same browser localStorage as the homepage. Add them on the homepage first; new entries will appear on the subsite after refresh. Data is not synced between devices.

## Smart recipe builder

The app suggests a starting recipe using brew method, roast level and tasting notes. Espresso starts around 18g in, with a suggested yield, temperature, pre-infusion and 9-bar reference pressure; filter methods get their own starting points. Adjust and log real outcomes; the latest recipe and pressure settings are remembered separately for each bean.

Cup ratings use 0–10, where 10 is best. You can leave a brew unrated or explicitly enter zero. Older 0–5 scores are migrated to 0–10.

## Other features

- Save coffees with roastery, location, origin, roast date, roast level, tasting notes, method and product URL.
- Free-text roastery names support German and international roasters.
- Search, filter, sort, favorite, log brew history and export a JSON backup.
- Local browser storage.

## Run locally

Open `index.html` or `taste-profile.html` directly, or serve the project folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000` and `http://localhost:8000/taste-profile.html`.
