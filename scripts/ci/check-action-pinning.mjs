import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const WORKFLOWS = join(ROOT, ".github", "workflows");
const USES = /^\s*(?:-\s*)?uses:\s*([^\s#]+)/gm;
const PIN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/[^@\s]+)?@[0-9a-f]{40}$/;

export function inspectWorkflow(source, name = "workflow.yml") {
  const findings = [];
  let found = 0;
  for (const match of source.matchAll(USES)) {
    found += 1;
    if (!PIN.test(match[1])) {
      const line = source.slice(0, match.index).split("\n").length;
      findings.push(`${name}:${line}: unveränderliche 40-stellige Action-Commitkennung fehlt: ${match[1]}`);
    }
  }
  return { found, findings };
}

export function auditWorkflows(dir = WORKFLOWS) {
  const problems = [];
  let total = 0;
  for (const name of readdirSync(dir).filter(x => /\.ya?ml$/.test(x)).sort()) {
    const { found, findings } = inspectWorkflow(readFileSync(join(dir, name), "utf8"), name);
    total += found;
    problems.push(...findings);
  }
  if (total === 0) problems.push("Keine GitHub-Actions-Verweise gefunden; Prüfung ist unvollständig.");
  return { total, problems };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { total, problems } = auditWorkflows();
  for (const problem of problems) console.error("ROT:", problem);
  if (problems.length) process.exitCode = 1;
  else console.log(`PASS: ${total} GitHub-Actions-Verweise mit unveränderlichen Commitkennungen gesichert.`);
}
