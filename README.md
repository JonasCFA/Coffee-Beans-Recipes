# Daily Pour — Coffee Journal

A clean, responsive coffee journal that runs as a static site and works on GitHub Pages. Add any coffee roaster—German roasteries included—then save tasting notes, recipes, grind settings, favorites, ratings and brew history.

## Features

- Add coffees with roaster name and location, origin, roast date, roast level, tasting notes and optional product-page URL. The roaster field is free text, so German and international roasters are supported.
- Click a coffee to view its taste notes, automatically suggested taste group, current recipe and recent brew history.
- Log a brew with dose, yield, grind, water temperature, method, pre-infusion, rating and notes. The most recent brew becomes the displayed recipe/grind setting; ratings are averaged from logged brews.
- Search and filter the collection, sort by rating/date/name, and favorite coffees.
- Automatically group tasting notes into broad taste families (including common German note words).
- Persist data in browser localStorage and download a JSON backup.
- Link to the roaster's product page or search the roaster online.

## Run locally

Open `index.html`, or serve the project folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Publish with GitHub Pages

In the repository, open **Settings → Pages**, select **Deploy from a branch**, choose `main` and `/(root)`, and save. GitHub Pages will show the published URL there.

## Data and online lookup

Your collection is stored in the browser and on the device/browser where you add it; it is not synced to other devices. Use **Download backup** to export it. Automatic scraping of arbitrary roaster websites is not included: many sites block browser requests, and a dependable lookup needs a dedicated API or server. Add a product URL and use the online search link to look up the roaster's published details, then save the tasting notes you trust.
