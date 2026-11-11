// The settings, their defaults, and where they are kept. Shared by the content script and the
// settings page, so the page's controls and the defaults come from this one list.
(function (g) {
  'use strict';
  const MSH = g.MSH || (g.MSH = {});

  // Each entry is one control on the settings page. The default is the owner's answer to the
  // decision it names (11 Nov 2026).
  MSH.SETTINGS = [
    {
      key: 'hideCounts',
      decision: 'D3',
      type: 'boolean',
      default: true,
      label: 'Hide the Popularity rank and member counts',
    },
    {
      key: 'revealScope',
      decision: 'D4',
      type: 'choice',
      default: 'one',
      label: 'A click on a hidden score shows',
      choices: [
        ['one', 'that score only'],
        ['page', 'every score on the page'],
      ],
    },
    {
      key: 'autoReveal',
      decision: 'D5',
      type: 'choice',
      default: 'rated',
      label: 'Shows you have scored',
      choices: [
        ['rated', 'show the community score where the page shows your own score'],
        ['never', 'keep it hidden until clicked'],
        ['remembered', 'remember each show whose score I click, on every page'],
      ],
    },
    {
      key: 'hideDistribution',
      decision: 'D6',
      type: 'boolean',
      default: true,
      label: 'Hide the score distribution on a show’s Stats tab',
    },
    {
      key: 'hideReviewRating',
      decision: 'D7',
      type: 'boolean',
      default: false,
      label: 'Hide the reviewer’s rating in written reviews',
    },
  ];

  MSH.defaults = () => Object.fromEntries(MSH.SETTINGS.map((s) => [s.key, s.default]));

  const valid = (s, v) => (s.type === 'boolean' ? typeof v === 'boolean' : s.choices.some(([c]) => c === v));

  // Stored values that are missing, mistyped or unknown fall back to the default.
  MSH.normalize = (stored) => {
    const src = stored && typeof stored === 'object' ? stored : {};
    return Object.fromEntries(MSH.SETTINGS.map((s) => [s.key, valid(s, src[s.key]) ? src[s.key] : s.default]));
  };

  // Settings and the shows remembered under D5 (c) live in chrome.storage.local. Not sync: that
  // would send them through the owner's Chrome account, and nothing here needs to leave the machine.
  MSH.chromeStore = (chrome) => ({
    async load() {
      const [s, l] = await Promise.all([chrome.storage.local.get('settings'), chrome.storage.local.get('revealed')]);
      return { settings: s.settings || {}, revealed: Object.keys(l.revealed || {}) };
    },
    async remember(id) {
      const l = await chrome.storage.local.get('revealed');
      const revealed = l.revealed || {};
      revealed[id] = Date.now();
      await chrome.storage.local.set({ revealed });
    },
    async forget() {
      await chrome.storage.local.remove('revealed');
    },
    async save(settings) {
      await chrome.storage.local.set({ settings: MSH.normalize(settings) });
    },
    onSettings(cb) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.settings) cb(changes.settings.newValue || {});
      });
    },
  });

  // Used where chrome.storage is missing: everything stays at its default.
  MSH.memoryStore = () => ({
    load: async () => ({ settings: {}, revealed: [] }),
    remember: async () => {},
    onSettings: () => {},
  });
})(globalThis);
