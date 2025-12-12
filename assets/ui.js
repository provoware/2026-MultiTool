(function(){
  const THEME_KEY = 'multitool_theme';
  const FONT_KEY = 'multitool_fontsize';
  const ariaAnnouncerId = 'global-aria-live';
  const CONFIG_THEMES_URL = 'config/themes.json';
  const defaultThemes = [
    { id: 'light', label: 'Hell' },
    { id: 'dark', label: 'Dunkel' },
    { id: 'contrast', label: 'Kontrast' },
    { id: 'solar', label: 'Solar' }
  ];
  let themes = defaultThemes.map((t) => t.id);
  let themeLabels = Object.fromEntries(defaultThemes.map((t) => [t.id, t.label]));
  const fontSizes = ['small', 'base', 'large'];

  async function loadThemeConfig(){
    try {
      const response = await fetch(CONFIG_THEMES_URL, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const config = await response.json();
      if (config && Array.isArray(config.themes) && config.themes.length > 0) {
        themes = config.themes
          .map((entry) => (entry && typeof entry.id === 'string' ? entry.id.trim() : ''))
          .filter((id) => id);
        themeLabels = {};
        config.themes.forEach((entry) => {
          if (entry && typeof entry.id === 'string') {
            themeLabels[entry.id] = entry.label || entry.id;
          }
        });
      }
    } catch (error) {
      console.warn('Theme-Konfiguration konnte nicht geladen werden – Standardwerte werden genutzt.', error);
      themes = defaultThemes.map((t) => t.id);
      themeLabels = Object.fromEntries(defaultThemes.map((t) => [t.id, t.label]));
    }
    return themes;
  }

  function getPreferredTheme(){
    const stored = localStorage.getItem(THEME_KEY);
    if(themes.includes(stored)) return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme){
    const next = themes.includes(theme) ? theme : 'light';
    document.documentElement.setAttribute('data-theme', next);
    if(document.body){
      document.body.setAttribute('data-theme', next);
    }
    localStorage.setItem(THEME_KEY, next);
    announce(`Theme gesetzt auf ${next}`);
    return next;
  }

  function applyFontSize(size){
    const next = fontSizes.includes(size) ? size : 'base';
    if(document.body){
      document.body.setAttribute('data-font-size', next);
    }
    localStorage.setItem(FONT_KEY, next);
    announce(`Schriftgröße auf ${next} gesetzt`);
    return next;
  }

  function cycleTheme(){
    const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    const idx = themes.indexOf(current);
    const next = themes[(idx + 1) % themes.length];
    applyTheme(next);
    syncThemeSelect(next);
    return next;
  }

  function syncThemeSelect(value){
    document.querySelectorAll('[data-theme-select]').forEach(sel => {
      if(sel.value !== value) sel.value = value;
      const label = themeLabels[value] || value;
      sel.setAttribute('aria-label', `Farbschema wählen (aktuell: ${label})`);
    });
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.setAttribute('aria-pressed', 'false');
      const label = themeLabels[value] || value;
      btn.setAttribute('aria-label', `Theme wechseln (aktuell: ${label})`);
    });
  }

  function renderThemeOptions(){
    document.querySelectorAll('[data-theme-select]').forEach(sel => {
      while (sel.firstChild) sel.removeChild(sel.firstChild);
      themes.forEach((theme) => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = themeLabels[theme] || theme;
        sel.appendChild(option);
      });
    });
  }

  function syncFontControls(value){
    document.querySelectorAll('[data-font-select]').forEach(sel => {
      if(sel.value !== value) sel.value = value;
    });
  }

  function bindThemeControls(){
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', cycleTheme);
      btn.setAttribute('aria-pressed', 'false');
    });
    document.querySelectorAll('[data-theme-select]').forEach(sel => {
      sel.addEventListener('change', e => applyTheme(e.target.value));
    });
  }

  function bindFontControls(){
    document.querySelectorAll('[data-font-select]').forEach(sel => {
      sel.addEventListener('change', e => applyFontSize(e.target.value));
    });
    document.querySelectorAll('[data-font-button]').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.getAttribute('data-font-button');
        applyFontSize(value);
        syncFontControls(value);
      });
    });
  }

  function ensureAriaAnnouncer(){
    let live = document.getElementById(ariaAnnouncerId);
    if(!live){
      live = document.createElement('div');
      live.id = ariaAnnouncerId;
      live.className = 'hidden';
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('aria-atomic', 'true');
      document.body.appendChild(live);
    }
    return live;
  }

  function announce(message){
    const live = ensureAriaAnnouncer();
    live.textContent = message;
  }

  function validateFilled(value){
    return typeof value === 'string' && value.trim().length > 0;
  }

  function attachHelpTips(){
    const targets = Array.from(document.querySelectorAll('[data-help]'));
    let counter = 0;

    targets.forEach((el) => {
      const textRaw = el.getAttribute('data-help');
      if(!validateFilled(textRaw)) return;

      const helpText = textRaw.trim();
      const helpId = `${el.id || 'help'}-hint-${++counter}`;
      const host = el.parentElement || document.body;
      let hiddenHint = document.getElementById(helpId);

      if(!hiddenHint){
        hiddenHint = document.createElement('span');
        hiddenHint.id = helpId;
        hiddenHint.className = 'sr-only';
        host.appendChild(hiddenHint);
      }

      hiddenHint.textContent = helpText;

      const describedBy = new Set((el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      describedBy.add(helpId);
      el.setAttribute('aria-describedby', Array.from(describedBy).join(' '));

      if(!el.getAttribute('title')){
        el.setAttribute('title', helpText);
      }
    });

    return targets.length > 0;
  }

  function startupAudit(){
    const missing = [];
    ['body','main','header'].forEach(sel => { if(!document.querySelector(sel)) missing.push(sel); });
    if(missing.length){
      announce(`Warnung: fehlende Kern-Container ${missing.join(', ')}`);
      console.warn('Fehlende Elemente:', missing);
    }
    document.querySelectorAll('input[required], textarea[required]').forEach(el => {
      if(!validateFilled(el.value)) el.setAttribute('aria-invalid', 'true');
    });
    document.querySelectorAll('[data-validate-length]').forEach(el => {
      const limit = Number(el.getAttribute('data-validate-length'));
      if(Number.isFinite(limit) && el.value && el.value.length > limit){
        el.setAttribute('aria-invalid', 'true');
        el.setAttribute('data-feedback', `Maximal ${limit} Zeichen erlaubt`);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadThemeConfig();
    renderThemeOptions();
    const initialTheme = applyTheme(getPreferredTheme());
    syncThemeSelect(initialTheme);
    bindThemeControls();

    const storedFont = localStorage.getItem(FONT_KEY) || 'base';
    const initialFont = applyFontSize(storedFont);
    syncFontControls(initialFont);
    bindFontControls();

    startupAudit();
    attachHelpTips();
  });

  window.SharedUI = { applyTheme, cycleTheme, bindThemeControls, announce, validateFilled, applyFontSize, attachHelpTips };
})();
