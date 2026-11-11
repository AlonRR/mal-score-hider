// The settings page: one control per entry in MSH.SETTINGS, saved as soon as it changes.
(function (g) {
  'use strict';
  const { MSH, chrome, document } = g;
  const store = MSH.chromeStore(chrome);
  const form = document.getElementById('settings');
  const status = document.getElementById('status');

  function control(s, value) {
    if (s.type === 'boolean') {
      const label = document.createElement('label');
      label.className = 'row';
      const input = Object.assign(document.createElement('input'), { type: 'checkbox', name: s.key, checked: value });
      label.append(input, document.createTextNode(s.label));
      return label;
    }
    const set = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = s.label;
    set.append(legend);
    for (const [v, text] of s.choices) {
      const label = document.createElement('label');
      const input = Object.assign(document.createElement('input'), { type: 'radio', name: s.key, value: v, checked: v === value });
      label.append(input, document.createTextNode(text));
      set.append(label);
    }
    return set;
  }

  function read() {
    return Object.fromEntries(
      MSH.SETTINGS.map((s) => [
        s.key,
        s.type === 'boolean' ? form.elements[s.key].checked : form.querySelector(`input[name="${s.key}"]:checked`)?.value,
      ]),
    );
  }

  async function showRemembered() {
    const { revealed } = await store.load();
    const box = document.getElementById('remembered');
    box.hidden = revealed.length === 0;
    document.getElementById('remembered-count').textContent =
      `${revealed.length} show${revealed.length === 1 ? '' : 's'} remembered as revealed.`;
  }

  async function init() {
    const { settings } = await store.load();
    const current = MSH.normalize(settings);
    form.replaceChildren(...MSH.SETTINGS.map((s) => control(s, current[s.key])));
    form.addEventListener('change', async () => {
      await store.save(read());
      status.textContent = 'Saved. Open MyAnimeList pages update at once.';
    });
    document.getElementById('forget').addEventListener('click', async () => {
      await store.forget();
      await showRemembered();
      status.textContent = 'Forgotten. Those scores are hidden again on the next page load.';
    });
    await showRemembered();
  }

  init().catch((e) => {
    status.textContent = `Could not read the settings: ${e.message}`;
  });
})(globalThis);
