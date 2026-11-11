// Live check: paste into a MyAnimeList page's console (or run it through a browser tool) and it
// returns what a reader can see that looks like a community score, rank or count.
//
// It reads rendered visibility (checkVisibility: display, visibility, content-visibility), and the
// text of ::before / ::after, which plain innerText misses (the score box draws "N users" there).
//
//   positives  how many known score elements the page has (docs/survey.md). Zero means this page
//              proves nothing: a check that matches nothing cannot pass.
//   visible    visible text that looks like a score (score), a rank (rank), "scored by" (scoredBy)
//              or a count (count), with where it sits
//   negatives  the owner's own score, which must stay visible
(() => {
  const POSITIVES = [
    '.score-label', '.stats-block .numbers strong', '.js-statistics-info', '.scormem-item',
    '.seasonal-anime .widget', 'table.score-stats', 'div.information', '.hoverinfo span.dark_text',
  ];
  const KINDS = {
    score: /(?<![\d.])\d{1,2}\.\d{2}(?![\d.])/,
    rank: /#\d+/,
    scoredBy: /scored by|\d\s*users/i,
    count: /\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d)?[KM]\b|\(\d+ votes\)|\d+(?:\.\d)?%/,
  };
  const where = (el) => {
    const p = [];
    for (let e = el; e && e !== document.body && p.length < 3; e = e.parentElement) {
      p.unshift(e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim()
        ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''));
    }
    return p.join('>');
  };
  const seen = (el) => el.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true });
  const visible = Object.fromEntries(Object.keys(KINDS).map((k) => [k, []]));
  const note = (text, el, how) => {
    for (const [k, re] of Object.entries(KINDS)) {
      if (re.test(text)) { visible[k].push(`${JSON.stringify(text.trim().slice(0, 24))} ${how}${where(el)}`); break; }
    }
  };
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const el = n.parentElement;
    if (!n.data.trim() || !el || el.closest('script, style, noscript, option, select, header, #headerSmall')) continue;
    if (el.closest('td.your-score')) continue;
    if (seen(el)) note(n.data, el, '');
  }
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('header, #headerSmall, .header')) continue;
    for (const p of ['::before', '::after']) {
      const c = getComputedStyle(el, p);
      if (!c.content || c.content === 'none' || c.content === 'normal' || c.visibility !== 'visible') continue;
      if (el.checkVisibility()) note(c.content.replace(/^"|"$/g, ''), el, p + ' ');
    }
  }
  const own = [...document.querySelectorAll('tr.ranking-list td.your-score .score-label, select#myinfo_score')];
  return JSON.stringify({
    page: location.pathname,
    ready: document.documentElement.hasAttribute('data-msh-ready'),
    positives: POSITIVES.reduce((n, s) => n + document.querySelectorAll(s).length, 0),
    counts: Object.fromEntries(Object.entries(visible).map(([k, v]) => [k, v.length])),
    visible: Object.fromEntries(Object.entries(visible).map(([k, v]) => [k, [...new Set(v)].slice(0, 4)])),
    negatives: { ownScores: own.length, ownScoresVisible: own.filter(seen).length },
  });
})();
