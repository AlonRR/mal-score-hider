# mal-score-hider: working rules

- Start from `docs/brief.md`: the goal, what is decided, and what was measured before this repo existed.
- The add-on makes no network requests and reads nothing but the page it hides scores on. It asks
  only for the MyAnimeList site and `storage`, no wider permission. `storage` (no site access, no
  install warning) is there because the owner asked for a settings page for D3-D7 (11 Nov 2026).
- The settings' defaults are the owner's answers to D3-D7 (11 Nov 2026); `extension/settings.js`
  names each one's decision.
- A hidden score is revealed only by a deliberate click on that score, never by hover or mouse
  movement: an accidental reveal defeats the point (the owner, dub-queue's D83 (b), 11 Nov 2026).
- Every change under `extension/` raises the manifest `version` and adds a line to the README's
  Versions list, so the owner can tell which build is loaded (the owner, 12 Nov 2026). Run
  `npm run check-version` before each commit; it fails if `extension/` changed and the version
  did not.
- The owner runs the add-on in Edge: its extensions page is `edge://extensions` (12 Nov 2026).
- It goes to both the Edge Add-ons and the Chrome Web Store (D18 (13 Nov 2026)), as "Score Hider
  for MyAnimeList" (D19 (13 Nov 2026)): named for the site it works on, never as the site itself.
  `store/listing.md` is the store text for both, so it names no browser (Edge developer policy
  1.1.2). Registering, paying and submitting are the owner's steps. The Chrome Web Store is on
  hold: its $5 fee is not to be spent unless the owner publishes more add-ons (13 Nov 2026).
- Screenshots for a listing are taken signed out (`tools/store-shots.mjs`), never from the owner's
  browser, so no account name gets into one.
- Prior art without a licence (the Greasy Fork script "Hide Entry Score") may be read for ideas, never copied.
