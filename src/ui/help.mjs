const helpButton = document.getElementById('helpBtn');
const helpPanel = document.getElementById('panelHelp');
const helpTitle = document.getElementById('helpTitle');

function setHelpOpen(open) {
  helpPanel.hidden = !open;
  helpButton.setAttribute('aria-expanded', String(open));
  if (open) {
    helpTitle.focus({ preventScroll: true });
  } else {
    helpButton.focus({ preventScroll: true });
  }
}

helpButton.addEventListener('click', () => {
  setHelpOpen(helpPanel.hidden);
});
