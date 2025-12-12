#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const projectRoot = path.resolve(__dirname, '..');
const uiPath = path.join(projectRoot, 'assets', 'ui.js');
const uiContent = fs.readFileSync(uiPath, 'utf8');
const themeMatch = uiContent.match(/const\s+themes\s*=\s*\[([^\]]+)\]/m);

if (!themeMatch) {
  console.error('Konnte Theme-Liste in assets/ui.js nicht finden.');
  process.exit(1);
}

const themes = JSON.parse(`[${themeMatch[1].replace(/'/g, '"')}]`);
const htmlFiles = fs.readdirSync(projectRoot).filter((file) => file.endsWith('.html'));
let hasError = false;

htmlFiles.forEach((file) => {
  const html = fs.readFileSync(path.join(projectRoot, file), 'utf8');
  const $ = cheerio.load(html);
  const selects = $('[data-theme-select]');

  if (!selects.length) {
    console.log(`[${file}] enthält keine Theme-Auswahl (data-theme-select) – übersprungen.`);
    return;
  }

  selects.each((_, el) => {
    const optionValues = new Set();
    $(el)
      .find('option')
      .each((__, opt) => {
        const val = $(opt).attr('value');
        if (val) optionValues.add(val.trim());
      });

    const missing = themes.filter((t) => !optionValues.has(t));
    const unknown = [...optionValues].filter((t) => !themes.includes(t));

    if (missing.length || unknown.length) {
      console.error(
        `[${file}] Theme-Auswahl unterscheidet sich. Fehlend: ${missing.join(', ') || '–'} | Unbekannt: ${
          unknown.join(', ') || '–'
        }`
      );
      hasError = true;
    }
  });
});

if (hasError) {
  console.error('Theme-Listen stimmen nicht überein. Bitte HTML-Optionen und assets/ui.js angleichen.');
  process.exit(1);
}

console.log(`Theme-Liste konsistent (${themes.join(', ')}) in allen Dateien.`);
