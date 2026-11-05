# Daily Pour — Coffee Journal

A premium-feeling coffee journal for roasteries, tasting notes, personalized recipes and brew logs. It runs as a static website on GitHub Pages.

## Collection and sample data

The collection is at the top of the homepage, directly below the hero. Saved coffees and brew history live in this browser. The starter example coffees Monsoon Reserve, Velvet Cherry, Yirgacheffe Sunrise and Maya Estate are removed from the current collection and no longer seeded. To keep them in a different browser or old backup, restore them manually from your own backup if needed.

## Espresso shot-time guidance

Espresso starter recipes include a suggested target flow-time window as well as dose, yield, ratio, grind guidance, water, pre-infusion and pressure. The estimate uses the entered roast level and roaster tasting notes: bright/light profiles start with a somewhat longer ratio and time window; darker/chocolate-forward profiles start shorter. The baseline uses 18g in, with example windows of 28–34s (bright), 24–30s (dark) and 26–32s (balanced). These are practical starting estimates, not a scientifically guaranteed “perfect” extraction. The timer should be measured from pump activation to target yield, but machine timers treat pre-infusion differently. Grinder, basket, machine, roast age, dose, pressure behavior and taste all matter.

Record the actual shot time after brewing. Keep the target and actual time visible per bean, and adjust one variable at a time: if the shot tastes sour/thin, try a finer grind or slightly longer yield; if bitter/dry, try a coarser grind or slightly shorter yield. Do not rely on time alone—taste is the judge. Filter recipes show a broader total brew/drawdown window rather than espresso shot time.

## Taste map

Open `taste-profile.html` for maps of espresso black, espresso with dairy milk and espresso with oat milk. Saved coffees are plotted from the tasting notes and roast level entered on the homepage. Estimates are heuristic guesses and update to your personal rated brews when available. The product URL is a reference link; GitHub Pages does not fetch or verify arbitrary roastery websites.

## Other features

- Save coffees with roastery, location, origin, roast date, roast level, taste notes, method and product URL. German and international roasteries are supported.
- Log dose, yield, actual and target shot time, grind, water temperature, pressure, pressure profile, pre-infusion, drink style, rating (0–10) and notes.
- Latest recipe is saved separately per bean; older brews remain in history.
- Search, filter, sort, favorite and export a JSON backup.
- Automatically group saved tasting notes and show a taste overview.

## Run locally

Open `index.html` or `taste-profile.html` directly, or serve the project folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000` and `http://localhost:8000/taste-profile.html`.
