# Store listing

The text to paste into each store's form, one section per field. The same text serves both stores,
so it names no browser (Edge developer policy 1.1.2). `test/store.test.js` checks the fields are
here, the lengths, and that the short description matches the manifest's.

Images: `store/logo-300.png` (Edge's logo), `extension/icons/icon-128.png` (Chrome's store icon),
`store/promo-440x280.png` (the small promo tile, both stores) and `store/screenshots/` (1280x800,
both stores). The upload is the zip from `npm run pack`.

## Name

Score Hider for MyAnimeList

## Short description

Hides MyAnimeList's community scores, ranks and counts until you click one, so your rating is your own.

## Description

Score Hider for MyAnimeList hides the community's scores, ranks and counts on MyAnimeList, so you can watch a show and rate it on its own merits before you see what everyone else thought.

Each hidden number becomes a spoiler bar, the same width whatever the number, so its length gives nothing away. Click a bar and that one score comes back. Hovering never shows anything.

What it hides:
• the score, Ranked and Popularity lines, member count and Favorites count on anime and manga pages
• the popup that opens when you hover a title
• the score and member columns of search results, Top Anime and genre lists
• the scores on seasonal, genre, studio and producer pages
• the score distribution on a show's Stats tab, behind a button

Your own score is never hidden. In the settings you choose whether a click shows one score or every score on the page, whether shows you have scored show their community score, and whether member counts and reviewers' ratings are hidden too.

It runs only on myanimelist.net, makes no network requests and collects nothing. Your settings stay on your computer.

Not made by or affiliated with MyAnimeList.

## Category

Entertainment (Chrome Web Store: Lifestyle, then Entertainment; Edge Add-ons: Entertainment).

## Single purpose

Hides the community scores, ranks and counts on MyAnimeList pages until the user clicks one.

## Permission: storage

Keeps the user's settings, and, only if the user picks the setting that remembers shows, the list of shows whose score they clicked. Both stay in the browser's own extension storage on the device and are never sent anywhere.

## Site access: myanimelist.net

The content script runs on myanimelist.net only, which is where it hides the scores. It reads the page to find them, changes how they are drawn, and makes no requests of its own.

## Remote code

No, I am not using remote code. Every script is in the package.

## Data use

Collects no data: tick none of the data types. Tick each certification the form lists. The settings and the remembered shows never leave the device.

## Privacy policy

`PRIVACY.md` in this repository; its public address depends on where the repository is published.
