# Survey: where MyAnimeList shows a community score

Measured 11 Nov 2026 in Chrome (the home page, top manga and the Advanced Search form later that day), signed in, by a read-only script that walks every visible text node
and lists the ones that look like a score, a rank or a count. One page per type. The add-on's
selectors start from this; the live check re-runs the same walk with the add-on loaded.

## What the page markup looks like

| Page | Where the score is | Markup | Notes |
|---|---|---|---|
| Entry page, header (`/anime/<id>`, `/manga/<id>`) | Score box | `div.fl-l.score > div.score-label.score-N` | "N users" is **not text**: it is `div.fl-l.score::after`, drawn from the `data-user` attribute. |
| Entry page, header | Ranked, Popularity, Members | `span.numbers.ranked > strong`, `span.numbers.popularity > strong`, `span.numbers.members > strong` | Each number has its own element. |
| Entry page, sidebar Statistics | Score | `.js-statistics-info span.score-label[itemprop=ratingValue]` | "(scored by 2,353,020 users)" is a **bare text node** beside it, with a hidden `[itemprop=ratingCount]` span. |
| Entry page, sidebar Statistics | Ranked | second `.js-statistics-info` | "#2" is a **bare text node** after `span.dark_text` "Ranked:". |
| Entry page, sidebar | Popularity, Members, Favorites | `div.spaceit_pad` | Bare text after `span.dark_text`. Favorites is hidden with the counts (D9, 11 Nov 2026). |
| Entry page, stats tab (`…/stats`) | Score distribution | 10 rows, "(1147155 votes)" in `span > small` | The header score box is not on this tab; the sidebar is. The Summary Stats counts and the "Recently Updated By" list (members' own scores under "All Members") stay visible: the tab is opened on purpose (D10 (a), 11 Nov 2026). |
| Entry page, reviews | Reviewer's rating | `div.rating.js-hidden > span.num` | Hidden by MAL until a review is expanded. One reviewer's score, not the community's. |
| Hover popup on a title link | Score, Ranked, Popularity, Members | `div.hoverinfo`, filled by MAL on hover | Bare text after `span.dark_text`. Appears on any page with `a.hoverinfo_trigger` (top anime, search). Loaded after the page. |
| Top anime (`/topanime.php`) | Score column | `td.score span.score-label` | **The "Your Score" column uses `span.score-label` too** (`td.your-score`), so a blanket `.score-label` rule hides the owner's own score. Rank column: `td.rank span.top-anime-rank-text`. Members: `div.information` in the title cell. |
| Seasonal (`/anime/season`), genre tiles | Card score, members | `.scormem-item.score.score-label`, `.scormem-item.member` | 185 cards on the seasonal page, 100 on a genre page. Hidden `span.js-score` / `span.js-members` (`display:none`) feed MAL's sorting. |
| Genre, list view | Score column | table cell with no class of its own | Found by the column header "Score". |
| Studio / producer (`/anime/producer/<id>`) | Card score, users | `div.widget > div.stars`, `div.widget > div.users` | 172 cards. |
| Search, anime (`/anime.php?q=`) | Score column | `td.borderClass.ac` with no class of its own | Found by the column header "Score". Title links carry hover popups. |
| Search, all (`/search/all?q=`) | "Scored 9.11", "3,755,276 members" | **bare text lines** between `<br>` in `div.information div.fs10` | 20 results per section. |
| Top manga (`/topmanga.php`) | as top anime | same table and columns | Header `Rank, Title, Score, Your Score, Status`, 5 cells, as on top anime. |
| Home page (`/`), My List Updates | "Ranked #8441. Popularity 2464." | **one bare text line** in `.my_list_updates .info > p` | The owner's own recent updates. |
| Home page (`/`), ranking widgets | "ONA, 0 eps, scored 9.03", "256,661 members" | `.ranking-unit .data span.info`, `span.members` | Lower-case "scored", inside a longer line. |
| Genre and search pages, Advanced Search | **not a score** | `#advancedSearch table`: rows of a label and a `select`, one labelled "Score" | Hidden until opened. A table rule that takes any row with a "Score" cell for a header would hide its labels. |
| Anime search with no query (`/anime.php`) | none | | |
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

## Live check, version 0.2.1 in Edge (12 Nov 2026)

`tools/visible-scores.js` run on each page type with the add-on loaded, signed in. "Hidden" counts
placeholders still hidden out of those made. A show the owner has scored keeps its community score
visible (D5), so those rows are counted apart.

| Page | Hidden | Shown, and why |
|---|---|---|
| Top anime | 78 of 100 | the 11 scored shows' score and members (D5); every row matched, 0 mismatches |
| Top manga | 100 of 100 | none; the Your Score column (50 cells) stays visible |
| Anime entry, show not scored | 9 of 12 | the 3 review ratings (D7) |
| Anime entry, Stats tab | 5 of 5 | Summary Stats counts (D10 (a)); the distribution is behind its button |
| Manga entry | 9 of 12 | the 3 review ratings (D7); Favorites hidden (D9) |
| Hover popup, shown twice | all 4 lines both times | none |
| Seasonal | 374 of 374 | none |
| Studio (`/anime/producer/4`) | 344 of 344 | none |
| Genre, tile view | 200 of 200 | none |
| Genre, list view (switched and back, A16) | 100 rows, no Score or Members value visible | none |
| Anime search | 50 of 50 | none |
| Search, all categories | 40 of 40 | none |
| Home page | 30 of 30 | none |

A real mouse click on one placeholder showed that one alone: on top anime (78 to 77 hidden), on
the search table (50 to 49), and on the entry page's score box, whose "N users" line came back
with it while Ranked, Popularity and Members stayed hidden. The distribution button showed the
table.

Numbers the check flags that are not a rating of the show, left visible: news articles' view
counts, the studio's own favourites count, the genre's title count, percentages in synopsis text,
an HTML entity (`&#039;`) in a synopsis, a score typed into a review's text (D7), and the "N Users"
on each recommendation, which counts the people who recommended that pairing: it says two shows
are alike, not how good either is, so it stays (D14 (a), 12 Nov 2026).

Not run live: the settings page and the first paint at `document_start`, which only the owner's
own browser shows (T15).

The first live run, of 0.1.0, hid nothing: every scan threw. Chrome and Edge now give every
element a `pseudo()` method, and the add-on had used `pseudo` to mark its own pieces. jsdom has
no such method, so every test passed. Fixed in 0.2.1, and the test pages now carry the method.
