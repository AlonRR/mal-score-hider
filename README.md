# mal-score-hider

A Chrome extension that hides MyAnimeList's community scores, ranks and counts, so you can rate a
show on its own merits before seeing what others thought. A hidden score shows as `?.??` (a rank as
`#?`) and comes back when you click it. Hovering never reveals it.

## What it hides

On anime and manga entry pages, the score box, the sidebar's Score, "scored by N users" and
Ranked lines, the Popularity rank and the member count. The same goes for the popup that opens
when you hover a title, for the score and member columns of search results, top anime and genre
list views, for seasonal, genre, studio and producer tiles, and for the "Scored 9.11" lines of
the all-categories search. On a show's Stats tab, the score distribution sits behind a button.

Your own score is never hidden. Top Anime's rank column stays, since the order of that page gives
the ranking away anyway.

## Settings

Open them from the extension's toolbar button, or from Extension options on `chrome://extensions`.

| Setting | Default |
|---|---|
| Hide the Popularity rank and member counts | on |
| A click shows that score only, or every score on the page | that score only |
| Shows you have scored: show the community score where the page shows your own score, keep it hidden, or remember each show whose score you click | show it where the page shows your score |
| Hide the score distribution on the Stats tab | on |
| Hide the reviewer's rating in written reviews | off |

## Install

1. Open `chrome://extensions` and turn on **Developer mode** (top right).
2. Click **Load unpacked** and choose this repository's `extension` folder.
3. Open any MyAnimeList page. After a code change, click the extension's reload arrow on
   `chrome://extensions`, then reload the page.

It asks for two things: access to `https://myanimelist.net/*` and `storage`, which holds its
settings. It makes no network requests.

## Develop

`npm install`, then `npm test`. The tests run the content scripts in jsdom against hand-written
pages in `test/fixtures.js`. Where each score sits on the real site is recorded in
`docs/survey.md`. `tools/visible-scores.js`, run in a MyAnimeList page, lists anything visible
that looks like a score, rank or count. `tools/page-bundle.mjs` builds the content scripts into one
script that can be tried in a page before the extension is installed.

_Parts of this repository were drafted with the help of an LLM agent; reviewed and verified locally._
