# Daily Pour

Static coffee journal for GitHub Pages. Add coffees and roaster details, save espresso recipes and shot times, log 0–10 ratings, and explore taste maps at `taste-profile.html`.

## Data and sharing

The app currently stores entries in the browser, so data does not sync to friends or other devices. Shared storage requires connecting a database and sign-in. Supabase is one option: create beans and brew tables, enable Row Level Security, and allow access only to invited collection members. For public sharing, make a separate read-only view. Never put a Supabase `service_role` secret in frontend code.

Use **Export journal** for a local JSON backup. To run locally:

```bash
python3 -m http.server 8000
```
