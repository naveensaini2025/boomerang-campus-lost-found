# Boomerang — Campus Lost & Found

> **what you lose comes back**

Boomerang is a mobile-first campus lost & found portal built for **Hustle Carnival 2026 · GL Bajaj Mathura** — Problem Statement **ELU02** — by **Team WU SHANG CLAN**.

It is 100% free and runs entirely in the browser: React + Vite + Tailwind CSS, React Router, Leaflet, and localStorage. No backend, no database server, no paid API, no credit card.

---

## Run it

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

```bash
npm test        # 6 unit tests for the matching function
npm run build   # production build check
```

On the first run the app seeds **12 realistic campus items**, a few pending claims and demo karma. Use the **Demo login** button to enter as `Naveen Sharma (NS)` — the seeded account that owns the lost Black Wallet and Student ID Card, so the **92% match banner appears immediately**.

> All demo content can be reset from **My Items → Reset demo data**. Logging out is also in My Items.

---

## Optional: free Gemini photo tags

The app works with **no API key**. Without a key it uses a small offline keyword tagger based on the item title and photo file name.

To let Gemini read the photo:

1. Visit [aistudio.google.com](https://aistudio.google.com) and create a **free** API key (no credit card).
2. Copy `.env.example` to `.env`.
3. Paste the key:

```env
VITE_GEMINI_KEY=your_key_here
```

4. Restart `npm run dev`.

If the key is missing, invalid, offline or over quota, Boomerang silently falls back to the offline tagger. The form and the demo never break.

---

## 2-minute demo script

1. **Demo login** — tap `Demo login (Naveen · NS)`.
   - Home shows the banner **“We found a 92% match for your Black Wallet”**.
   - Point out the three seed cards: Student ID Card (LOST · 92% match), Black Wallet (FOUND · Chat to claim), Blue Earphones (LOST · AI tagged).
   - Try the `All / Lost / Found` chips and the white search bar (`wallet`).
   - Show the floating **92% MATCH** and **RETURNED ✓** badges; tap the green badge for a confetti burst.

2. **Report a found Black Wallet** — tap the amber **+**.
   - Choose **I found it**.
   - Add a photo (optional) → after the photo is compressed, Boomerang auto-fills category/colour/brand/title and shows the **AI tagged** chip. (Or tap **Auto-tag** after typing the title.)
   - Fill: title `Black Wallet`, description `Black leather wallet with student ID inside found near canteen`, category `Wallet`, colour `Black`, brand `Puma`, location `Canteen, Block A`.
   - Add a secret question, e.g. `What is on the lock-screen wallpaper?`
   - Tap **Post found item** → the tilted **92% MATCH** badge appears.
   - *The brand, colour, category, description and location are what push the score to 92% — the scoring is fully explainable.*

3. **Claim → chat → returned** — tap **Open the 92% match** (or the home banner) to open the lost Black Wallet.
   - Under **Suggested matches**, open the Black Wallet posted by **Arjun Mehta** and tap **Claim**.
   - Answer the secret question (`A golden retriever` works) → **Send answer to finder**.
   - Type a message in the chat, e.g. `See you at the College Help Desk at 4pm`.
   - Tap **Mark as Returned** → confetti + **RETURNED ✓** badge. The finder gets **+10 karma**.

4. **Finder-side approval** — go to **My Items**.
   - Show Karma `20` and the **First Return** badge, plus My Posts / My Claims.
   - Open **Steel Water Bottle** (owned by the demo user). Riya's pending claim is there with her secret answer; **Approve** or **Reject** it.
   - End on **Reset demo data** to leave a clean phone for the next judge.

5. **Map** — tap the **Map** chip. Red pins are lost items, green pins are found. Tap a pin, then **Open item**.

> Demo shortcut: while a claim is pending, the claimant can already chat and mark the handover as returned so the 2-minute story flows end-to-end. In real use the finder approves before handover; that approve/reject flow is fully clickable on the finder's item page (step 4).

---

## How it works (for judges, in plain words)

1. Someone posts a **lost** or **found** item with a few details.
2. Boomerang compares only **lost vs found** posts that are still open. A local, explainable function gives each pair a score out of 100:
   - **40 pts** — word overlap between titles + descriptions (Jaccard similarity, stop-words removed)
   - **20 pts** — same category
   - **15 pts** — same colour
   - **10 pts** — same brand
   - **15 pts** — similar location **and** posted within 48 hours
3. The top 3 suggestions are stored with the item. A score of **70+** shows the match banner/badge. Matches are only suggestions — the owner decides.
4. Found items can ask a **secret detail question**. A claimant answers it, the finder approves or rejects, and both talk in a private in-app chat (no phone numbers, ever).
5. When the item is handed back, the finder earns **+10 karma** and a **Good Samaritan** badge.

No model training, no API key, no server — every score can be recalculated by hand.

---

## Privacy & trust

- Phone numbers, roll/registration numbers and card-like numbers are masked with `••••` **before** saving.
- No phone numbers or emails are displayed anywhere; communication happens only through claim chat.
- Secret-question check before a handover.
- Maximum 3 pending claims per user per item (and duplicate active claims are blocked).
- All data stays in **this browser's localStorage** — nothing is uploaded anywhere.

---

## Project structure

```
src/
  pages/        Login, Home, Report, ItemDetail, MyItems, MapPage
  components/   Header, SearchBar, FilterChips, ItemCard, BottomNav,
                StatusStepper, MatchBadge, Toast, FloatingBadges
  services/     storage.js, itemService.js, matchService.js, aiService.js
  data/         seedItems.js
  lib/          privacy.js, imageCompress.js, config.js
  index.css
.env.example    optional VITE_GEMINI_KEY
public/         manifest.json, icon.svg
```

---

## Known limitations

- **Local to one browser.** Data does not sync between devices or users; clearing site data/reset removes it.
- **Fake login.** Names are not verified and there are no passwords.
- **LocalStorage size limit** (~5 MB). Photos are compressed to a max of 600 px JPEG before saving, but many large photos can still fill it.
- **Secret answers are stored locally**, so a technical user could inspect them in DevTools. Finder approval is manual, not cryptographic.
- **Map tiles need internet.** The app itself and matching work offline; OpenStreetMap tiles do not.
- The demo shortcut lets a claimant mark the handover returned while a claim is still pending (see demo note above).
- **Future work:** Firebase/Supabase auth + real-time sync, push/email alerts for new matches, QR tags on valuables, verified campus email, moderation, and photo storage in object storage.

---

## Assumptions

- One demo campus, centred on **GL Bajaj Mathura (27.6, 77.6)** — change `COLLEGE` in `src/lib/config.js` to point at another campus.
- The `Demo login` account is the seeded owner of the Black Wallet and Student ID Card so success states are visible instantly.
- Brand is optional generally, but including `Puma` in the demo post is the easiest way to reach exactly 92%.
- Gemini is a nice-to-have; the offline tagger is the default so the project stays 100% free and self-contained.

Built with ❤️ by **Team WU SHANG CLAN** for Hustle Carnival 2026.
