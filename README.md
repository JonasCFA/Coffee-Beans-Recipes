# Daily Pour

A static coffee journal for GitHub Pages. Save beans, roaster notes, recipes, shot times and 0–10 ratings. Explore the taste maps at `taste-profile.html`.

Coffee data is stored in this browser and does not sync to other devices. Use **Export journal** for a backup.

On **Beans to try**, add a recommended product to your collection and verify its details, including tasting notes and roast. Log rated brews in the collection to compare products within their recommendation category. Ratings are averages across rated cups, with drink-style averages shown separately; unrated products have no personal score. Previously saved recommended coffees remain visible in their category even when they are no longer in the shop results. Product matching uses the saved product URL; the category match is not a prediction of an individual product's score.

On **Taste maps**, select a saved coffee and record a flavour direction, body, optional bitterness and notes separately for each drink style. Save again to update that style's impression. The comparison graph shows the same coffee in all six styles: filled markers use your inputs and dashed markers are estimates. Without a saved position, recognised words in the latest non-empty brew note for that style can influence flavour, body and bitterness; unrecognised dimensions remain estimates. This word matching is approximate and can be overridden with the form. It does not change existing brews or infer a drink style from a note. Impressions are stored with the coffee and included in journal exports.

The **Next shot suggestion** uses the most recent logged cup for the selected drink style, its recipe, rating and recognised sour, bitter or channeling words in its note. It suggests one small espresso adjustment, not an automatic recipe change; taste and log the next shot. Notes are interpreted by simple word matching, not an AI or a diagnosis. Filter and unknown brewing methods do not get espresso-specific suggestions. Add a roaster's dose, yield, time and source under the optional roaster recipe reference; these values are user-entered and are not scraped or verified. The coach compares the last shot with that reference and may move the yield toward it. The saved reference is included in journal exports.

To run locally:

```bash
python3 -m http.server 8000
```
