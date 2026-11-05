# Daily Pour — Coffee Journal

A premium-feeling coffee journal for roasteries, tasting notes, recipes and brew logs. It runs as a static website on GitHub Pages.

## Collection and sample data

**My collection is now directly below the header** at the top of the homepage. Saved coffees and brew history live in this browser. The four demo entries—Monsoon Reserve, Velvet Cherry, Yirgacheffe Sunrise (including the requested Yirgaffe spelling), and Maya Estate—are removed from stored collections and sample data.

## Espresso flow-time estimate

Starter espresso recipes include dose, yield, ratio, grind guidance, water, pre-infusion, pressure and a suggested target flow-time window. The estimate starts with a practical 18g in / 40g out baseline and adjusts slightly for dose, brew ratio, roast level and roaster tasting notes. For example, a brighter/light coffee is suggested a little longer, while a darker/roasty coffee is suggested a little shorter.

The target is a **dial-in starting window**, not a promise of perfect taste or a professional extraction calculation. Timing convention in the app is pump start through target yield, including pre-infusion; use the same convention for the actual time. Grinder, basket, machine, pre-infusion behavior, coffee age and water all matter. Log the actual shot time and cup rating, then change one variable at a time. If sour/thin, try a finer grind or slightly longer yield; if harsh/bitter, try a coarser grind or shorter yield. Taste is the final test.

## Per-bean recipe memory

Select a bean and use **Adjust recipe / log brew**. The latest dose, yield, grind, temperature, method, drink style, pre-infusion, pressure, target time and actual shot time are remembered for that bean. Switching beans recalls each bean's own recipe; previous brews remain in the history.

## Taste map

Open `taste-profile.html` for maps of espresso black, espresso with dairy milk and espresso with oat milk. Saved coffees are plotted from the tasting notes and roast level entered on the homepage. Drink-style scores are estimates until you log rated cups in that style. The product URL is a reference link; GitHub Pages does not fetch or verify website content.

## Ratings and data

Cup ratings use **0–10**, where 10 is best. A brew can be left unrated or explicitly scored 0. Data is stored in this browser's localStorage, not synced between devices. Use **Export journal** for a JSON backup.

## Run locally

Open `index.html` or `taste-profile.html` directly, or serve the project folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000` and `http://localhost:8000/taste-profile.html`.
