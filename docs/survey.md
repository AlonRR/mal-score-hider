# Survey: where MyAnimeList shows a community score

Measured 11 Nov 2026 in Chrome, signed in, by a read-only script that walks every visible text node
and lists the ones that look like a score, a rank or a count. One page per type. The add-on's
selectors start from this; the live check re-runs the same walk with the add-on loaded.

## What the page markup looks like

| Page | Where the score is | Markup | Notes |
|---|---|---|---|
| Entry page, header (`/anime/<id>`, `/manga/<id>`) | Score box | `div.fl-l.score > div.score-label.score-N` | "N users" is **not text**: it is `div.fl-l.score::after`, drawn from the `data-user` attribute. |
| Entry page, header | Ranked, Popularity, Members | `span.numbers.ranked > strong`, `span.numbers.popularity > strong`, `span.numbers.members > strong` | Each number has its own element. |
| Entry page, sidebar Statistics | Score | `.js-statistics-info span.score-label[itemprop=ratingValue]` | "(scored by 2,353,020 users)" is a **bare text node** beside it, with a hidden `[itemprop=ratingCount]` span. |
| Entry page, sidebar Statistics | Ranked | second `.js-statistics-info` | "#2" is a **bare text node** after `span.dark_text` "Ranked:". |
| Entry page, sidebar | Popularity, Members | `div.spaceit_pad` | Bare text after `span.dark_text`. |
| Entry page, stats tab (`…/stats`) | Score distribution | 10 rows, "(1147155 votes)" in `span > small` | The header score box is not on this tab; the sidebar is. |
| Entry page, reviews | Reviewer's rating | `div.rating.js-hidden > span.num` | Hidden by MAL until a review is expanded. One reviewer's score, not the community's. |
| Hover popup on a title link | Score, Ranked, Popularity, Members | `div.hoverinfo`, filled by MAL on hover | Bare text after `span.dark_text`. Appears on any page with `a.hoverinfo_trigger` (top anime, search). Loaded after the page. |
| Top anime (`/topanime.php`) | Score column | `td.score span.score-label` | **The "Your Score" column uses `span.score-label` too** (`td.your-score`), so a blanket `.score-label` rule hides the owner's own score. Rank column: `td.rank span.top-anime-rank-text`. Members: `div.information` in the title cell. |
| Seasonal (`/anime/season`), genre tiles | Card score, members | `.scormem-item.score.score-label`, `.scormem-item.member` | 185 cards on the seasonal page, 100 on a genre page. Hidden `span.js-score` / `span.js-members` (`display:none`) feed MAL's sorting. |
| Genre, list view | Score column | table cell with no class of its own | Found by the column header "Score". |
| Studio / producer (`/anime/producer/<id>`) | Card score, users | `div.widget > div.stars`, `div.widget > div.users` | 172 cards. |
| Search, anime (`/anime.php?q=`) | Score column | `td.borderClass.ac` with no class of its own | Found by the column header "Score". Title links carry hover popups. |
| Search, all (`/search/all?q=`) | "Scored 9.11", "3,755,276 members" | **bare text lines** between `<br>` in `div.information div.fs10` | 20 results per section. |
| Recommendations (`/recommendations.php`) | none | | |
| Stacks (`/stacks`) | none | | |
| Header search suggestions | none | | Type and year only. |

The owner's own score on an entry page is a `select#myinfo_score`, not `.score-label`.

## What this means for the build

- CSS alone cannot do it: three places put the number in a bare text node, and the hover popup and
  the score box's user count need their own handling. A content script wraps bare numbers in an
  element it owns, at `document_start`, and a `MutationObserver` covers what loads later.
- Every rule must leave `td.your-score` and the owner's own controls alone; the check lists them as
  known negatives.
- A visible-text check must also read `::before` / `::after` content, or the score box's user count
  passes unseen.
