/* CytogeneticsPro — plant cytogenetics in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* CytogeneticsPro — language (Spanish / English).

   How translation works, so that nothing is ever left half translated:
   1. Rich text in the HTML is written twice, side by side:
        <span data-l="es">…</span><span data-l="en">…</span>
      CSS hides the language that is not active (html[lang]), so switching is
      instant and needs no dictionary lookups.
   2. Short plain texts that cannot be duplicated (options of a <select>,
      button captions, placeholders, tooltips) carry both versions as
      attributes: data-es / data-en, data-es-ph / data-en-ph,
      data-es-title / data-en-title. `I18N.apply()` copies the active one.
   3. Text built by JavaScript uses T('español', 'English'), and every module
      that draws something listens to the 'langchange' event to redraw it.

   The initial language is the one saved by the user; otherwise Spanish, as in
   every app of the LABG Suite, whatever the language of the browser. The
   colour theme is handled by LABG.theme (labg-core.js). */
(function () {
  const KEY_LANG = 'cytogeneticspro.lang';
  const read = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } };

  function initialLang() {
    const saved = read(KEY_LANG);
    return saved === 'es' || saved === 'en' ? saved : 'es';
  }

  const I18N = {
    lang: initialLang(),

    set(lang) {
      if (lang !== 'es' && lang !== 'en') return;
      const changed = lang !== I18N.lang;
      I18N.lang = lang;
      write(KEY_LANG, lang);
      I18N.apply();
      if (changed) document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
    },

    /* copy the active language into the attribute-translated nodes */
    apply(root) {
      const L = I18N.lang;
      document.documentElement.lang = L;
      const scope = root || document;
      scope.querySelectorAll('[data-es]').forEach(n => { const v = n.getAttribute('data-' + L); if (v != null) n.textContent = v; });
      scope.querySelectorAll('[data-es-html]').forEach(n => { const v = n.getAttribute('data-' + L + '-html'); if (v != null) n.innerHTML = v; });
      scope.querySelectorAll('[data-es-ph]').forEach(n => { const v = n.getAttribute('data-' + L + '-ph'); if (v != null) n.setAttribute('placeholder', v); });
      scope.querySelectorAll('[data-es-title]').forEach(n => {
        const v = n.getAttribute('data-' + L + '-title');
        if (v != null) { n.setAttribute('title', v); n.setAttribute('aria-label', v); }
      });
      const t = document.querySelector('title');
      if (t && t.dataset.es) document.title = t.getAttribute('data-' + L);
      document.querySelectorAll('.lang-seg button').forEach(b => {
        b.classList.toggle('on', b.dataset.lang === L);
        b.setAttribute('aria-pressed', b.dataset.lang === L ? 'true' : 'false');
      });
    },
  };

  /* T('texto', 'text') → the active language. An object {es, en} or a pair
     [es, en] is also accepted. */
  function T(es, en) {
    if (Array.isArray(es) && en === undefined) return I18N.lang === 'en' ? es[1] : es[0];
    if (es && typeof es === 'object') return I18N.lang === 'en' ? es.en : es.es;
    return I18N.lang === 'en' ? en : es;
  }

  document.documentElement.lang = I18N.lang;
  document.addEventListener('DOMContentLoaded', () => {
    I18N.apply();
    document.querySelectorAll('.lang-seg button').forEach(b => b.addEventListener('click', () => I18N.set(b.dataset.lang)));
  });

  window.I18N = I18N;
  window.T = T;
})();
