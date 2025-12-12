(function(){
  const THEME_KEY = 'multitool_theme';
  const ariaAnnouncerId = 'global-aria-live';
  const themes = ['light', 'dark', 'contrast'];

  function getPreferredTheme(){
    const stored = localStorage.getItem(THEME_KEY);
    if(themes.includes(stored)) return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme){
    const next = themes.includes(theme) ? theme : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    announce(`Theme gesetzt auf ${next}`);
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
  }

  document.addEventListener('DOMContentLoaded', () => {
    const initial = applyTheme(getPreferredTheme());
    syncThemeSelect(initial);
    bindThemeControls();
    startupAudit();
  });

  window.SharedUI = { applyTheme, cycleTheme, bindThemeControls, announce, validateFilled };
})();
