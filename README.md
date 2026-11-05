# Daily Pour — Coffee Journal

A calm coffee journal for recording beans, roaster tasting notes, recipes and brew results. The static site runs on GitHub Pages.

## Shared online storage: how to make friends see the same collection

At present, the app stores data in browser `localStorage`. That means entries stay on the browser/device that created them; friends opening the website on their own devices will not see your collection or ratings. To share them, connect the app to a hosted database. Supabase is a good fit for a GitHub Pages site because it provides Postgres, authentication and row-level access policies.

### Pick who can see and edit

- **Private group journal (recommended):** you and invited friends sign in. Members can read and add/edit coffee and brew records.
- **Public read-only share:** anyone with a link can view selected coffees and ratings, but only signed-in members can change anything. Keep private tasting notes out of public rows.

Do not make the database anonymously writable. A hard-to-guess URL alone is not a robust access-control system; use authentication or a revocable, server-checked share token.

### Supabase setup outline

1. Create a Supabase project and enable email authentication.
2. Create tables such as `collections` (owner/name), `collection_members` (collection/user/role), `beans` (collection_id plus bean fields and recipe JSON), and `brews` (bean_id plus recipe snapshot, drink style, rating, notes and timestamp).
3. Enable Row Level Security on **every** table. Add policies so signed-in users can select/insert/update/delete rows only when they are members of that row's collection. Public shares should use a separate read-only view or Edge Function that checks a random revocable token.
4. Add Supabase's browser client to the site using the project URL and the **anon/publishable key**. These are designed for browser use only when RLS policies are correctly configured. Never put the `service_role` key or any secret in public JavaScript or GitHub.
5. Replace the `loadBeans()` / `saveBeans()` localStorage adapter in `script.js` with asynchronous database reads/writes. Add sign-in, loading/error states, and a collection selector. Keep localStorage only as an optional offline cache.
6. Import your existing data using **Export journal** and an authenticated import step. Check bean and brew records before sharing.
7. Test with two accounts and a signed-out browser: only invited members should see private collections; non-members must not read or modify them. Test public links as read-only and make sure they can be revoked.

Because this needs a Supabase project, schema/policies, and your desired sharing model, the current static app has **not** been connected to a database yet. Once the project is configured, only its public URL and anon/publishable key belong in frontend configuration; database policies are what protect the data.

## Existing app features

- My collection appears directly under the header. Search, filter and sort saved coffees.
- Click a bean for taste notes, recipe, brew history and drink-style predictions.
- Suggested recipe uses roast, tasting notes and brew method. Espresso target flow time is a starting range, not a guarantee of ideal flavor.
- Save each bean's latest dose, yield, grind, temperature, pressure, pre-infusion and flow times, plus rated brew history.
- Ratings use 0–10. German and international roasteries are supported through free-text names and locations.
- Taste maps at `taste-profile.html` show black espresso, dairy milk and oat milk estimates from saved notes.
- Data is currently local to the browser. Use **Export journal** for a JSON backup.

## Run locally

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.
