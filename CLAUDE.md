# mal-score-hider: working rules

- Start from `docs/brief.md`: the goal, what is decided, and what was measured before this repo existed.
- The add-on makes no network requests and reads nothing but the page it hides scores on. It asks
  only for the MyAnimeList site and `storage`, no wider permission. `storage` (no site access, no
  install warning) is there because the owner asked for a settings page for D3-D7 (11 Nov 2026).
- The settings' defaults are the owner's answers to D3-D7 (11 Nov 2026); `extension/settings.js`
  names each one's decision.
- A hidden score is revealed only by a deliberate click on that score, never by hover or mouse
  movement: an accidental reveal defeats the point (the owner, dub-queue's D83 (b), 11 Nov 2026).
- Prior art without a licence (the Greasy Fork script "Hide Entry Score") may be read for ideas, never copied.
