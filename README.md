# Daily Pour — Coffee Journal

A premium-feeling coffee journal for roasteries, tasting notes, recipes and brew logs. It runs as a static website and works perfectly on GitHub Pages.

## Features

- Save coffee beans with roastery, country/location, origin, roast date, roast level, tasting notes and product URL.
- Use a free-text roastery field so German roasteries and local coffee brands work without restrictions.
- Click a coffee to view its recipe, taste group, recent brew history and favorite state.
- Log brews with dose, yield, grind setting, water temperature, brew method, pre-infusion, rating and notes.
- Search, filter and sort the collection by rating, roast date, recency and name.
- Keep an automatically grouped taste profile for each coffee.
- Download the full journal as a JSON backup.
- Save everything in browser localStorage.

## Roastery website search

This site can open a search for a roastery and store the official product URL if you paste it. It does not automatically scrape arbitrary roastery websites from the browser because GitHub Pages is a static site and many roastery sites block cross-origin access.

This is the correct approach for a premium static app:

- Enter roastery name and location.
- Click Search roastery.
- Verify the correct official site in the browser.
- Paste the official product page URL in the form.
- Save the coffee.

If you want automatic extraction from a roastery website, a small backend/API is needed. That backend can fetch the page and normalize details (name, address, website, email, phone and about text), but the data should still be editable before saving.

## Run locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit:

- http://localhost:8000

## Publish on GitHub Pages

In the repository:

1. Open Settings > Pages
2. Set Source to Deploy from a branch
3. Select branch `main`
4. Choose the `/root` folder
5. Save

GitHub will publish the page and show the live URL.
