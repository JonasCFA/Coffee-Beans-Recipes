# Daily Pour — A Coffee Journal

A calm, premium-feeling coffee journal that runs on GitHub Pages. German roasters are fully supported: roaster name and location are free text, not restricted to a directory.

## What it does

- Add coffees and roastery/location details, including German roasteries.
- Search the web for a roastery using its name and location; the search opens in a separate tab.
- Save the bean, roast date, flavor notes, roast level, and the roaster's product-page URL.
- Click a bean to view its taste profile, suggested taste family, recipe and brew history.
- Log brews including dose, output, grind setting, water temperature, method, pre-infusion, rating and notes. The latest brew is shown as the current recipe.
- Search/filter/sort coffees, favorite, delete and export a JSON backup.
- Keep data in browser localStorage; it stays on that browser/device.

## Roastery website data: important limitation

This version can search the web and store a roastery's official product URL, but it does not automatically scrape/import arbitrary website content. GitHub Pages is a static site: many roastery sites block browser requests from other domains (CORS), and scraping would be unreliable. The lookup opens a web search so you can verify the official site, then enter the product information you want to save.

To auto-import verified details from a search result or product page, a small server/API integration is needed (for example, a backend that uses a search provider and fetches allowed pages). That backend should cite the source URL and let you confirm/edit extracted data before saving. Never put a private API key into the public frontend.

## Run locally

Open `index.html`, or serve the project folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## GitHub Pages

In **Settings → Pages**, select **Deploy from a branch**, choose `main` and `/(root)`, and save. The live URL appears on that settings page.
