// Hides what rules.js finds, keeps it hidden as the page changes, and shows a unit again on a
// deliberate click. Nothing here listens to hover or mouse movement (CLAUDE.md).
(function (g) {
  'use strict';
  const MSH = g.MSH || (g.MSH = {});

  // State lives in data attributes, not classes: MAL's own scripts rewrite className.
  const UNIT = 'data-msh-unit';
  const HIDDEN = 'data-msh-h';
  const ANCHOR = 'data-msh-anchor';
  const PH = 'data-msh-ph';
  const AFTER = 'data-msh-ha';
  const AFTER_UNIT = 'data-msh-ha-unit';
  const KEY = 'data-msh-key';
  const BLOCK = 'data-msh-block';
  const READY = 'data-msh-ready';

  const PLACEHOLDER = { score: '?.??', rank: '#?', popularity: '#?', members: '?', review: '?' };
  const BLOCK_LABEL = { distribution: 'Show the score distribution' };

  MSH.kindHidden = (kind, s) => {
    switch (kind) {
      case 'popularity':
      case 'members':
        return s.hideCounts;
      case 'distribution':
        return s.hideDistribution;
      case 'review':
        return s.hideReviewRating;
      default:
        return true;
    }
  };

  // Until the stored settings are read: hide every kind, reveal nothing by itself.
  const CLOSED = { hideCounts: true, revealScope: 'one', autoReveal: 'never', hideDistribution: true, hideReviewRating: true };

  MSH.start = (doc, store) => {
    const units = new Map();
    let seq = 0;
    const state = { settings: CLOSED, remembered: new Set(), rated: new Set(), pageRevealed: false };

    const owner = (n) => (n.nodeType === 1 ? n : n.parentElement);
    const claimed = (n) => !!owner(n)?.closest(`[${UNIT}]`);

    // Wraps a text node, less its surrounding whitespace, in a span of ours.
    function wrap(text) {
      let n = text;
      const lead = n.data.length - n.data.trimStart().length;
      if (lead) n = n.splitText(lead);
      const trail = n.data.length - n.data.trimEnd().length;
      if (trail) n.splitText(n.data.length - trail);
      const span = doc.createElement('span');
      n.replaceWith(span);
      span.append(n);
      return span;
    }

    function add(found) {
      const fresh = found.pieces.filter((p) => p && (p.pseudo ? !p.node.hasAttribute(AFTER_UNIT) : !claimed(p)));
      if (!fresh.length) return;
      const keyed = found.key?.getAttribute(KEY);
      let unit = keyed ? units.get(keyed) : null;
      if (!unit) {
        if (!fresh.some((p) => !p.pseudo)) return; // nothing yet to hold the placeholder
        unit = {
          id: String(++seq),
          kind: found.kind,
          mode: found.mode || 'inline',
          showId: found.showId || null,
          revealed: state.pageRevealed,
          els: [],
          afters: [],
          anchor: null,
          block: null,
        };
        units.set(unit.id, unit);
        found.key?.setAttribute(KEY, unit.id);
      }
      for (const p of fresh) {
        if (p.pseudo) {
          p.node.setAttribute(AFTER_UNIT, unit.id);
          unit.afters.push(p.node);
          continue;
        }
        const el = p.nodeType === 3 ? wrap(p) : p;
        el.setAttribute(UNIT, unit.id);
        unit.els.push(el);
        if (unit.mode === 'block' && !unit.block) {
          const b = doc.createElement('button');
          b.type = 'button';
          b.setAttribute(BLOCK, unit.id);
          b.textContent = BLOCK_LABEL[unit.kind] || 'Show';
          el.before(b);
          unit.block = b;
        } else if (unit.mode === 'inline' && !unit.anchor) {
          unit.anchor = el;
          el.setAttribute(ANCHOR, '');
          el.setAttribute(PH, PLACEHOLDER[unit.kind] || '?');
        }
      }
    }

    function hides(u) {
      if (u.revealed || !MSH.kindHidden(u.kind, state.settings)) return false;
      const auto = state.settings.autoReveal;
      if (u.showId && auto === 'rated' && state.rated.has(u.showId)) return false;
      if (u.showId && auto === 'remembered' && state.remembered.has(u.showId)) return false;
      return true;
    }

    const flag = (el, attr, on) => {
      if (on !== el.hasAttribute(attr)) on ? el.setAttribute(attr, '') : el.removeAttribute(attr);
    };

    function apply() {
      for (const u of units.values()) {
        const h = hides(u);
        for (const el of u.els) flag(el, HIDDEN, h);
        for (const el of u.afters) flag(el, AFTER, h);
        if (u.block && u.block.hidden === h) u.block.hidden = !h;
      }
    }

    function scan() {
      for (const rule of MSH.rules) {
        let found;
        try {
          found = rule.find(doc);
        } catch {
          continue; // one rule broken by a markup change must not stop the others
        }
        for (const f of found) add(f);
      }
      for (const [id, u] of units) if (!u.els.some((el) => el.isConnected)) units.delete(id);
      state.rated = MSH.ratedShows(doc);
      apply();
      observer.takeRecords(); // the mutations just made are ours
    }

    function reveal(u) {
      if (state.settings.revealScope === 'page') {
        state.pageRevealed = true;
        for (const x of units.values()) x.revealed = true;
      } else {
        u.revealed = true;
      }
      if (state.settings.autoReveal === 'remembered' && u.showId && !state.remembered.has(u.showId)) {
        state.remembered.add(u.showId);
        Promise.resolve()
          .then(() => store.remember(u.showId))
          .catch(() => {});
      }
      apply();
    }

    function onClick(e) {
      const t = e.target?.closest?.(`[${ANCHOR}][${HIDDEN}], button[${BLOCK}]`);
      if (!t) return;
      const u = units.get(t.getAttribute(UNIT) || t.getAttribute(BLOCK));
      if (!u) return;
      e.preventDefault();
      e.stopPropagation();
      reveal(u);
    }

    const observer = new g.MutationObserver(scan);
    observer.observe(doc, { childList: true, subtree: true, characterData: true });
    doc.addEventListener('click', onClick, true);
    doc.addEventListener('change', (e) => e.target?.matches?.(MSH.RATED_INPUTS) && scan(), true);
    scan();

    // load() is called now, not in a later task, so the read starts as early as it can.
    const ready = new Promise((resolve) => resolve(store.load()))
      .catch(() => ({ settings: {}, revealed: [] }))
      .then(({ settings, revealed }) => {
        state.settings = MSH.normalize(settings);
        for (const id of revealed || []) state.remembered.add(id);
        scan();
      })
      .finally(() => doc.documentElement?.setAttribute(READY, ''));

    store.onSettings?.((s) => {
      state.settings = MSH.normalize(s);
      scan();
    });

    return {
      ready,
      scan,
      units,
      stop() {
        observer.disconnect();
        doc.removeEventListener('click', onClick, true);
      },
    };
  };
})(globalThis);
