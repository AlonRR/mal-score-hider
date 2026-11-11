// Where MyAnimeList shows a community score, one rule per kind of place (docs/survey.md).
// A rule finds what to hide and says what it is; core.js does the hiding and the reveal.
//
// A rule's find(doc) returns units: { kind, pieces, key?, showId?, mode? }
//   kind     score | rank | popularity | members | distribution | review
//   pieces   nodes to hide; the first element or text node holds the placeholder. A text node is
//            wrapped in a span of ours. { node, pseudo: 'after' } hides only that element's ::after.
//   key      an element standing for the unit, so pieces that arrive later join it
//   showId   'anime:5114', for showing the score of a show you have scored
//   mode     'block' hides the pieces entirely behind a button, instead of a placeholder in place
(function (g) {
  'use strict';
  const MSH = g.MSH || (g.MSH = {});

  const SHOW_PATH = /^\/(anime|manga)\/(\d+)(?:\/|$)/;

  MSH.idFromHref = (href, base) => {
    try {
      const u = new URL(href, base);
      if (u.hostname !== 'myanimelist.net') return null;
      const m = u.pathname.match(SHOW_PATH);
      return m ? `${m[1]}:${m[2]}` : null;
    } catch {
      return null;
    }
  };

  MSH.pageShowId = (doc) => MSH.idFromHref(doc.URL, doc.URL);

  // The show a node belongs to: the nearest ancestor holding links to exactly one show.
  MSH.showIdNear = (node, maxUp = 10) => {
    let el = node.nodeType === 1 ? node : node.parentElement;
    for (let i = 0; el && i < maxUp; el = el.parentElement, i++) {
      const ids = new Set();
      const links = [...el.querySelectorAll('a[href]')];
      if (el.matches('a[href]')) links.push(el);
      for (const a of links) {
        const id = MSH.idFromHref(a.getAttribute('href'), el.ownerDocument.URL);
        if (id) ids.add(id);
      }
      if (ids.size === 1) return [...ids][0];
      if (ids.size > 1) return null;
    }
    return null;
  };

  const isText = (n) => n.nodeType === 3;
  const hasText = (n) => isText(n) && n.data.trim() !== '';

  // Splits a text node so the regex's first group stands alone, and returns that node.
  function isolate(node, re) {
    const m = re.exec(node.data);
    if (!m) return null;
    const start = m.index + m[0].indexOf(m[1]);
    let n = start > 0 ? node.splitText(start) : node;
    if (m[1].length < n.data.length) n.splitText(m[1].length);
    return n;
  }

  function textNodes(root) {
    const out = [];
    const walk = root.ownerDocument.createTreeWalker(root, 4);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) out.push(n);
    return out;
  }

  // The nodes after a "Score:"-style label, up to the next label or line break.
  const LABELS = { 'Score:': 'score', 'Ranked:': 'rank', 'Popularity:': 'popularity', 'Members:': 'members' };
  const SKIP = 'meta, link, script, style, .statistics-info';
  function afterLabel(label) {
    const pieces = [];
    for (let n = label.nextSibling; n; n = n.nextSibling) {
      if (n.nodeType === 1 && (n.tagName === 'BR' || n.matches('span.dark_text'))) break;
      if (n.nodeType === 1 && n.matches(SKIP)) continue;
      if (n.nodeType === 1 || hasText(n)) pieces.push(n);
    }
    return pieces;
  }

  const SCORED = /^\s*Scored\s+(\d+(?:\.\d+)?|N\/A)\s*$/;
  const MEMBERS = /^\s*([\d,]+)\s+members\s*$/i;
  const COLUMNS = { Score: 'score', Members: 'members' };

  MSH.rules = [
    {
      name: 'entry score box',
      find: (doc) =>
        [...doc.querySelectorAll('.stats-block div.fl-l.score')].map((box) => ({
          kind: 'score',
          key: box,
          showId: MSH.pageShowId(doc),
          pieces: [...box.querySelectorAll('.score-label'), { node: box, pseudo: 'after' }],
        })),
    },
    {
      name: 'entry header numbers',
      find: (doc) =>
        [['ranked', 'rank'], ['popularity', 'popularity'], ['members', 'members']].flatMap(([cls, kind]) =>
          [...doc.querySelectorAll(`.stats-block span.numbers.${cls} > strong`)].map((el) => ({
            kind,
            showId: MSH.pageShowId(doc),
            pieces: [el],
          })),
        ),
    },
    {
      // The entry page's sidebar, and the popup shown on hovering a title.
      name: 'labelled lines',
      find: (doc) =>
        [...doc.querySelectorAll('.leftside span.dark_text, .hoverinfo span.dark_text')].flatMap((label) => {
          const kind = LABELS[label.textContent.trim()];
          if (!kind) return [];
          const popup = label.closest('.hoverinfo');
          const showId = popup ? MSH.showIdNear(popup.querySelector('a.hovertitle') || popup, 1) : MSH.pageShowId(doc);
          return [{ kind, key: label, showId, pieces: afterLabel(label) }];
        }),
    },
    {
      // Search results, a genre page's list view, top anime: a column found by its header.
      name: 'table columns',
      find(doc) {
        const out = [];
        for (const table of doc.querySelectorAll('table')) {
          const rows = [...table.rows];
          const h = rows.findIndex((r) => [...r.cells].some((c) => c.textContent.trim() in COLUMNS));
          if (h < 0) continue;
          const width = rows[h].cells.length;
          const cols = [...rows[h].cells]
            .map((c, i) => [COLUMNS[c.textContent.trim()], i])
            .filter(([kind]) => kind);
          for (const row of rows.slice(h + 1)) {
            if (row.cells.length !== width) continue;
            for (const [kind, i] of cols) {
              const cell = row.cells[i];
              const pieces = [...cell.childNodes].filter((n) => n.nodeType === 1 || hasText(n));
              if (pieces.length) out.push({ kind, key: cell, showId: MSH.showIdNear(row, 1), pieces });
            }
          }
        }
        return out;
      },
    },
    {
      // Lines like "Scored 9.11" and "3,755,276 members" (search, all categories; top anime).
      name: 'information lines',
      find(doc) {
        const out = [];
        for (const info of doc.querySelectorAll('div.information')) {
          for (const n of textNodes(info)) {
            if (n.parentElement.closest('[data-msh-unit]')) continue;
            const [re, kind] = SCORED.test(n.data) ? [SCORED, 'score'] : MEMBERS.test(n.data) ? [MEMBERS, 'members'] : [];
            if (!re) continue;
            const showId = MSH.showIdNear(n);
            const num = isolate(n, re);
            if (num) out.push({ kind, showId, pieces: [num] });
          }
        }
        return out;
      },
    },
    {
      // Seasonal, genre, studio and producer tiles.
      name: 'tiles',
      find: (doc) =>
        [
          ['.scormem-item.score', 'score'],
          ['.scormem-item.member', 'members'],
          ['.seasonal-anime .widget > .stars', 'score'],
          ['.seasonal-anime .widget > .users', 'members'],
        ].flatMap(([sel, kind]) =>
          [...doc.querySelectorAll(sel)].map((el) => ({ kind, showId: MSH.showIdNear(el), pieces: [el] })),
        ),
    },
    {
      name: 'score distribution',
      find: (doc) =>
        [...doc.querySelectorAll('table.score-stats')].map((t) => ({
          kind: 'distribution',
          mode: 'block',
          showId: MSH.pageShowId(doc),
          pieces: [t],
        })),
    },
    {
      name: 'review rating',
      find: (doc) =>
        [...doc.querySelectorAll('.review-element .rating .num')].map((el) => ({
          kind: 'review',
          showId: MSH.pageShowId(doc) || MSH.showIdNear(el),
          pieces: [el],
        })),
    },
  ];

  // Shows the owner has scored, as far as this page says: the entry page's own score control, and
  // the Your Score column on top anime.
  MSH.ratedShows = (doc) => {
    const out = new Set();
    const page = MSH.pageShowId(doc);
    if (page) {
      for (const s of doc.querySelectorAll('select#myinfo_score, select.js-form-user-score')) {
        if (/^[1-9]\d?$/.test(s.value)) out.add(page);
      }
    }
    for (const cell of doc.querySelectorAll('td.your-score')) {
      if (!/^\d+$/.test(cell.textContent.trim())) continue;
      const id = MSH.showIdNear(cell.closest('tr') || cell, 1);
      if (id) out.add(id);
    }
    return out;
  };
  MSH.RATED_INPUTS = 'select#myinfo_score, select.js-form-user-score';
})(globalThis);
