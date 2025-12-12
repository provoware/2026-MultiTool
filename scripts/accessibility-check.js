const pa11y = require('pa11y');

const urls = [
  'http://localhost:5000/GenresTool.html',
  'http://localhost:5000/SONGTEXTTOOL.html',
  'http://localhost:5000/index_templates_tool.html',
];

const threshold = 20;

async function run() {
  let totalIssues = 0;
  for (const url of urls) {
    const results = await pa11y(url, {
      standard: 'WCAG2A',
      includeNotices: false,
      includeWarnings: false,
      chromeLaunchConfig: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });
    const count = results.issues.length;
    totalIssues += count;
    console.log(`Pa11y: ${url} -> ${count} Befunde`);
  }

  if (totalIssues > threshold) {
    console.error(`Abbruch: ${totalIssues} Befunde überschreiten den Grenzwert von ${threshold}.`);
    process.exit(1);
  }

  console.log(`Gesamt: ${totalIssues} Befunde (Grenzwert ${threshold}).`);
}

run().catch((error) => {
  console.error('Pa11y-Lauf fehlgeschlagen:', error);
  process.exit(1);
});
