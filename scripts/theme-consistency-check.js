#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const projectRoot = path.resolve(__dirname, '..');
const configPath = path.join(projectRoot, 'config', 'themes.json');
const themesCssPath = path.join(projectRoot, 'assets', 'themes.css');

if (!fs.existsSync(configPath)) {
  console.error('config/themes.json fehlt. Bitte zentrale Theme-Datei hinzufügen.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const themes = (config.themes || []).map((entry) => entry.id).filter(Boolean);

if (!themes.length) {
  console.error('Keine Themes in config/themes.json gefunden.');
  process.exit(1);
}

const themeCss = fs.readFileSync(themesCssPath, 'utf8');
const missingInCss = themes.filter((theme) => {
  if (theme === 'light') return false; // Basiswerte im :root Block
  return !new RegExp(`data-theme=\\"${theme}\\"`).test(themeCss);
});

if (missingInCss.length) {
  console.error(`Folgende Themes fehlen in assets/themes.css: ${missingInCss.join(', ')}`);
  process.exit(1);
}
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
