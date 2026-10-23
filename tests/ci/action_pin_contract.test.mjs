import assert from "node:assert/strict";
import test from "node:test";
import { inspectWorkflow, auditWorkflows } from "../../scripts/ci/check-action-pinning.mjs";

const sha = "3d3c42e5aac5ba805825da76410c181273ba90b1";

test("Repo-Workflows benutzen ausschließlich vollständige 40-stellige Commit-SHAs", () => {
  const result = auditWorkflows();
  assert.ok(result.total > 0, "Es muss mindestens ein Action-Verweis vorhanden sein");
  assert.deepEqual(result.problems, []);
});
test("bewegliche Tags und Branch-Namen werden abgewiesen", () => {
  for (const ref of ["actions/checkout@v7", "actions/checkout@main", "actions/checkout@HEAD"]) {
    const audit = inspectWorkflow(`steps:\n  - uses: ${ref}\n`);
    assert.equal(audit.findings.length, 1, ref);
  }
});
test("verkürzte oder fehlerhafte Prüfsummen werden abgewiesen", () => {
  for (const ref of ["actions/checkout@deadbeef", "actions/checkout@" + "f".repeat(39), "actions/checkout@" + "z".repeat(40)]) {
    assert.equal(inspectWorkflow(`- uses: ${ref}\n`).findings.length, 1, ref);
  }
});
test("ein vollständiger SHA-Verweis mit Versionskommentar wird akzeptiert", () => {
  const c = inspectWorkflow(`- uses: actions/checkout@${sha} # v7\n`);
  assert.equal(c.found, 1);
  assert.deepEqual(c.findings, []);
});
test("eine fremde bewegliche Action zwischen sicheren Referenzen bleibt sichtbar", () => {
  const c = inspectWorkflow(`steps:\n- uses: actions/checkout@${sha}\n- uses: bad/ci@v1\n`);
  assert.equal(c.found, 2);
  assert.equal(c.findings.length, 1);
});
