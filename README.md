# mal-score-hider

A Chrome and Edge extension that hides MyAnimeList's community scores, ranks and counts, so you can
rate a show on its own merits before seeing what others thought. A hidden score is a spoiler bar,
as chat apps hide spoilers: a solid bar in the text's colour, the same width for every number, so
it gives away no digits. Click it and that score comes back, with a dotted underline to mark it was
hidden. Hovering only lightens the bar and says a click shows it; it never reveals.

## What it hides

On anime and manga entry pages, the score box, the sidebar's Score, "scored by N users" and
Ranked lines, the Popularity rank, the member count and the Favorites count. The same goes for the popup that opens
when you hover a title, for the score and member columns of search results, top anime and genre
list views, for seasonal, genre, studio and producer tiles, and for the "Scored 9.11" lines of
the all-categories search. On a show's Stats tab, the score distribution sits behind a button;
the tab's Summary Stats counts and its list of members' recent updates stay visible, since that
tab is opened on purpose.

Your own score is never hidden. Top Anime's rank column stays, since the order of that page gives
the ranking away anyway.

## Settings

Open them from the extension's toolbar button, or from Extension options on `chrome://extensions`.

| Setting | Default |
|---|---|
| Hide the Popularity rank, member counts and Favorites count | on |
| A click shows that score only, or every score on the page | that score only |
| Shows you have scored: show the community score where the page shows your own score, keep it hidden, or remember each show whose score you click | show it where the page shows your score |
| Hide the score distribution on the Stats tab | on |
| Hide the reviewer's rating in written reviews | off |

## Install

1. Open `edge://extensions` in Edge, or `chrome://extensions` in Chrome, and turn on
   **Developer mode**.
2. Click **Load unpacked** and choose this repository's `extension` folder.
3. Open any MyAnimeList page. After a code change, click the extension's **Reload** on the
   extensions page, then reload the MyAnimeList page.

Each build has its own version number, shown on the extensions page and at the bottom of the
settings. If it doesn't match the newest entry under [Versions](#versions), the browser still holds
an older build: press Reload on the extensions page.

It asks for two things: access to `https://myanimelist.net/*` and `storage`, which holds its
settings. It makes no network requests.

## Develop

`npm install`, then `npm test`. The tests run the content scripts in jsdom against hand-written
pages in `test/fixtures.js`. Where each score sits on the real site is recorded in
`docs/survey.md`. `tools/visible-scores.js`, run in a MyAnimeList page, lists anything visible
that looks like a score, rank or count. `tools/page-bundle.mjs` builds the content scripts into one
script that can be tried in a page before the extension is installed.

Every change under `extension/` raises `version` in `extension/manifest.json` and adds a line
below. `npm run check-version` fails when `extension/` differs from `origin/main` and the version
was not raised.

## Versions

- **0.3.0**: hidden numbers are spoiler bars instead of `?.??` and `#?`, one width for every
  number; a tooltip says a click shows it; a clicked one keeps a dotted underline.
- **0.2.1**: fixes 0.1.0 and 0.2.0 hiding nothing in current Chrome and Edge, whose elements
  now carry a `pseudo()` method that the add-on mistook for its own marker.
- **0.2.0**: the version is shown on the settings page and marked on each MyAnimeList page.
- **0.1.0**: the first build, the Favorites count included.

_Parts of this repository were drafted with the help of an LLM agent; reviewed and verified locally._
