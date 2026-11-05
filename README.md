# Daily Pour — Coffee Journal

A calm coffee journal for recording beans, roaster tasting notes, recipes and brew results. The static site runs on GitHub Pages.

## Shared online storage: recommended setup

Right now the journal uses browser `localStorage`: your friends will not see your collection or ratings from their devices. To share data reliably, connect the app to a hosted database. A straightforward option for this static site is **Supabase** (Postgres database + Auth + Row Level Security).

Choose a sharing model first:

1. **One private shared journal for your group (recommended):** invite friends to sign in, store rows under a shared `collection_id`, and use database policies so only members can read/write the collection.
2. **Public read-only collection:** anyone with the link can see beans and ratings; only you can edit. Make read-only access explicit and never store private notes in that collection.

Implementation outline:

1. Create a Supabase project and enable email authentication.
2. Create tables for `collections`, `collection_members`, `beans`, and `brews` (each bean and brew belongs to a collection; each brew references one bean).
3. Enable Row Level Security on every table. Add policies that check the signed-in user is a member of the relevant collection. For a public share view, expose a separate read-only view or Edge Function and share a random, revocable token—do not make the entire database anonymously writable.
4. Add Supabase's browser client to the site using the project URL and **anon/publishable key**. These are intended for browser use only when RLS is correctly configured. Never put a `service_role` or other secret key in JavaScript, HTML, or a public GitHub repository.
5. Replace the `loadBeans` / `saveBeans` localStorage functions with authenticated Supabase reads and writes. Keep local cache only as an offline convenience, and add loading/error states.
6. Import existing browser data with the JSON backup/export, then check the beans and brew histories before sharing.
7. Test access with two accounts: members can see the shared collection; signed-out users and non-members cannot read or change private data.

Supabase is only one possible provider. Firebase or a small API plus a database can also work, but browser authentication and authorization rules are essential. A random share URL alone should not be treated as secure unless access is checked server-side and the token can be revoked.

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
