import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { transform } from "esbuild";

// Use the project's compiler dependency, keeping these tests compatible with Node 22 as well.
const { code } = await transform(await readFile(new URL("../src/practice/rules.ts", import.meta.url), "utf8"), { loader: "ts", format: "esm" });
const { SlackRound, makeInspections, ROUND_MS, PREPARE_MS } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const start = () => {
  const round = new SlackRound(0, []);
  round.advance(PREPARE_MS);
  return round;
};

test("countdown is separate and input before start is ignored", () => {
  const round = new SlackRound(0, []);
  assert.equal(round.setSlacking(true, 2_999).phase, "countdown");
  assert.equal(round.advance(3_000).slacking, false);
  assert.equal(round.snapshot().remaining, ROUND_MS);
});

test("multipliers integrate exactly and reset on working", () => {
  const round = start();
  round.setSlacking(true, 3_000);
  assert.equal(round.advance(6_000).pending, 30);
  assert.equal(round.advance(9_000).pending, 75);
  assert.equal(round.advance(10_000).pending, 95);
  assert.equal(round.setSlacking(false, 10_000).multiplier, 1);
  assert.equal(round.advance(10_999).banked, 0);
  assert.equal(round.advance(11_000).banked, 95);
  assert.equal(round.snapshot().largestBank, 95);
});

test("interrupted banking preserves pending but restarts the full second", () => {
  const round = start();
  round.setSlacking(true, 3_000);
  round.setSlacking(false, 4_000);
  round.setSlacking(true, 4_999);
  round.setSlacking(false, 5_999);
  assert.equal(round.advance(6_998).banked, 0);
  assert.equal(round.advance(6_999).banked, 20);
  assert.equal(round.snapshot().banks, 1);
});

test("catch removes only pending, recovers for two seconds and cannot repeat per window", () => {
  const round = new SlackRound(0, [{ warning: 5_000, start: 6_500, end: 12_000 }]);
  round.advance(3_000);
  round.setSlacking(true, 3_000);
  round.setSlacking(false, 4_000);
  round.advance(5_000);
  round.setSlacking(true, 5_000);
  const caught = round.advance(9_500);
  assert.equal(caught.catches, 1);
  assert.equal(caught.banked, 10);
  assert.equal(caught.pending, 0);
  assert.equal(caught.recovery, 2_000);
  assert.equal(round.setSlacking(true, 11_499).slacking, false);
  assert.equal(round.setSlacking(true, 11_500).slacking, true);
  assert.equal(round.advance(12_000).catches, 1);
});

test("working is safe immediately, entering an active inspection is caught immediately", () => {
  const visits = [{ warning: 1_000, start: 2_500, end: 4_000 }];
  const safe = new SlackRound(0, visits);
  safe.setSlacking(true, 3_000);
  safe.setSlacking(false, 5_499);
  assert.equal(safe.advance(5_500).catches, 0);
  assert.equal(safe.advance(6_499).banks, 1);
  assert.equal(safe.setSlacking(true, 6_500).catches, 1);
});

test("final deadline discards unbanked points; banking exactly at deadline succeeds", () => {
  const late = start();
  late.setSlacking(true, 60_000);
  late.setSlacking(false, 62_001);
  assert.equal(late.advance(100_000).banked, 0);
  assert.ok(late.snapshot().expired > 0);
  const exact = start();
  exact.setSlacking(true, 61_000);
  exact.setSlacking(false, 62_000);
  assert.equal(exact.advance(63_000).banked, 10);
  assert.equal(exact.snapshot().valid, true);
});

test("idle and aborted rounds are invalid; terminal state never changes", () => {
  const idle = start();
  assert.equal(idle.advance(90_000).valid, false);
  const round = start();
  round.setSlacking(true, 3_000);
  round.setSlacking(false, 4_000);
  round.advance(5_000);
  const aborted = round.abort(6_000);
  assert.equal(aborted.valid, false);
  assert.equal(aborted.phase, "aborted");
  assert.deepEqual(round.setSlacking(true, 70_000), aborted);
});

test("coarse and fine frame schedules produce the same outcome", () => {
  const visits = [{ warning: 4_000, start: 5_500, end: 7_000 }];
  const coarse = new SlackRound(0, visits);
  const fine = new SlackRound(0, visits);
  for (const round of [coarse, fine]) round.setSlacking(true, 3_000);
  coarse.advance(15_000);
  for (let time = 3_010; time <= 15_000; time += 10) fine.advance(time);
  assert.deepEqual(coarse.snapshot(), fine.snapshot());
});

test("generated rounds contain 4-6 nonoverlapping visits with accessible warnings", () => {
  for (let attempt = 0; attempt < 200; attempt++) {
    const visits = makeInspections();
    assert.ok(visits.length >= 4 && visits.length <= 6);
    visits.forEach((visit, index) => {
      assert.ok(visit.start - visit.warning >= 1_500);
      assert.ok(visit.end < ROUND_MS);
      if (index) assert.ok(visit.warning > visits[index - 1].end);
    });
  }
});
