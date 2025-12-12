(function(){
  const THEME_KEY = 'multitool_theme';
  const FONT_KEY = 'multitool_fontsize';
  const ariaAnnouncerId = 'global-aria-live';
  const themes = ['light', 'dark', 'contrast', 'solar'];
  const fontSizes = ['small', 'base', 'large'];

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
      sel.setAttribute('aria-label', `Farbschema wählen (aktuell: ${value})`);
    });
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', `Theme wechseln (aktuell: ${value})`);
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

  document.addEventListener('DOMContentLoaded', () => {
    const initialTheme = applyTheme(getPreferredTheme());
    syncThemeSelect(initialTheme);
    bindThemeControls();

    const storedFont = localStorage.getItem(FONT_KEY) || 'base';
    const initialFont = applyFontSize(storedFont);
    syncFontControls(initialFont);
    bindFontControls();

    startupAudit();
  });

  window.SharedUI = { applyTheme, cycleTheme, bindThemeControls, announce, validateFilled, applyFontSize };
})();
