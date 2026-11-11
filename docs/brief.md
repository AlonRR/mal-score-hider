# Brief: a MyAnimeList score hider

Written 11 Nov 2026 by the dub-queue session, which started this one.

## Goal

The owner does not want to see MyAnimeList's community score before rating a show themselves: "i
want my rating to reflect the show and not be muddied by others impretions." Build a browser add-on
that hides the community score and ranking on myanimelist.net, and shows a score only when the owner
clicks it.

Approval: dub-queue's D83 (b), 11 Nov 2026. The owner chose a new build over installing the existing
userscript "Hide Entry Score", because that one reveals every score on a page as soon as the mouse
passes over the score or statistics box, leaves the ranking visible ("Ranked #2"), and does not cover
search results.

## In scope

- What is hidden, on every MyAnimeList page where it appears: the community score (the big score
  box, the sidebar Statistics line "Score: …", score columns in lists, cards and tables), the score's
  "scored by N users" count, and the "Ranked #N" figure, which gives the score away just as well.
- Pages: anime entry pages first (the owner rates anime), then the pages where shows are browsed:
  seasonal, top anime, search results, genre, studio and producer pages, recommendations, stacks.
  Whether manga pages and the "Popularity #N" and member counts are hidden too is the owner's to
  decide: ask.
- Reveal: a click on a hidden score shows that one score. Whether one click should also reveal the
  rest of that page, and whether a show already rated stays revealed, are the owner's to decide: ask.
- The owner's own score ("Your Score", the status and score dropdowns) is never hidden.
- Which form it takes, an unpacked Manifest V3 extension or a userscript for a manager such as
  Tampermonkey, is the owner's to decide: ask, with a recommendation. Facts for it: the owner uses
  Chrome; the watch-history-sync repo already ships an unpacked Manifest V3 extension that the owner
  loads in developer mode, so that route is known to work for them. A userscript needs a manager
  that is not installed here as far as dub-queue knows (not checked).

## Out of scope

- The dub-queue page's own score display: dub-queue's D84 (b) covers it, in that repo.
- AniList and other sites, unless the owner asks.

## Done when

- On live myanimelist.net, signed in, in Chrome, each covered page type shows no community score,
  scored-by count or rank in its visible text before a click, and shows the one clicked score after
  it. Check it with a script that lists the visible numbers on each page, not by eye alone. Run that
  check against known positives (the elements listed below), so a selector that matches nothing
  cannot pass.
- A score that loads after the page, or a page that MAL changes as you browse, stays hidden.
- The owner has installed it and says it works.

## Constraints

- This repo's `CLAUDE.md`: no network requests, the MyAnimeList site as the only permission, reveal
  by click only, no code copied from unlicensed prior art.
- `publish: maybe` (`.repo-status`). Build it as if public: no machine paths, hostnames or names.
- The user-wide rules apply as everywhere: question IDs, worktrees for shared repos, the commit form.

## Facts so far

Measured by dub-queue in the owner's Chrome, signed in, on 11 Nov 2026 (read-only, by script):
- Anime page (`/anime/5114`): `.score-label` matches 2 elements: the score box (`div.fl-l.score`,
  text "9.11") and the sidebar. The sidebar block `.js-statistics-info` reads "Score: 9.11 (scored by
  2,353,020 users)". `[itemprop=ratingValue]` matches 1. "Ranked #2", "Popularity #3" and "Members
  3,754,732" sit beside the score box; their selectors were not checked.
- Seasonal page (`/anime/season`): 185 cards (`.seasonal-anime`), each with a `.js-score` and a
  `.scormem-item.score.score-label.score-8` (class number varies), text like "8.61".
- Not checked: search results, top anime, genre, studio and producer pages, recommendations, stacks,
  manga pages.

Relayed from a reading of "Hide Entry Score" (Greasy Fork script 435718, version 7, last updated
23 Jul 2022, no licence declared), not tested: it hides `.score-label` and `.stars` with CSS at
document start, and reveals them on mouse movement over `div.fl-l.score`, `.js-statistics-info`,
`td.score.ac`, `.scormem` and `.widget`, among others.

## Report to

The owner directly. The dub-queue session needs nothing back.

Your open list starts empty: list only the IDs you issue.
