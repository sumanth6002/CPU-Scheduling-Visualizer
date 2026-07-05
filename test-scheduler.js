/**
 * Scheduler verification tests — run with: node test-scheduler.js
 * Loads scheduling logic from script.js (strips browser/DOM code).
 */

const fs = require('fs');
const path = require('path');

let code = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');
const cut = code.search(/\nfunction addProcess\(/);
code = code.slice(0, cut);
eval(code);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function approx(a, b, msg) {
  assert(Math.abs(a - b) < 0.01, `${msg}: expected ${b}, got ${a}`);
}

function run(algo, procs, q = 2) {
  return runScheduler(algo, procs.map((p, i) => ({
    id: `P${i + 1}`,
    arrival: p[0],
    burst: p[1],
    priority: p[2] ?? 0
  })), q);
}

// ── FCFS classic ──────────────────────────────────────────
// P1(0,8) P2(1,4) P3(2,9)
{
  const r = run('fcfs', [[0, 8, 0], [1, 4, 0], [2, 9, 0]]);
  const byId = Object.fromEntries(r.results.map(x => [x.id, x]));
  assert(byId.P1.completion === 8, 'FCFS P1 completion');
  assert(byId.P2.completion === 12, 'FCFS P2 completion');
  assert(byId.P3.completion === 21, 'FCFS P3 completion');
  assert(byId.P1.waiting === 0, 'FCFS P1 waiting');
  assert(byId.P2.waiting === 7, 'FCFS P2 waiting'); // 12-1-4
  assert(byId.P3.waiting === 10, 'FCFS P3 waiting'); // 21-2-9
  assert(byId.P2.response === 7, 'FCFS P2 response'); // first run at 8
  approx(r.metrics.avgWaiting, (0 + 7 + 10) / 3, 'FCFS avg waiting');
  approx(r.metrics.cpuUtilization, (8 + 4 + 9) / 21 * 100, 'FCFS CPU util');
  approx(r.metrics.throughput, 3 / 21, 'FCFS throughput');
  console.log('✓ FCFS classic');
}

// ── SJF Non-Preemptive ────────────────────────────────────
// P1(0,7) P2(2,4) P3(4,1) P4(5,4)
// At t=0: P1. At t=7: ready P2(4),P3(1),P4(4) -> P3 first
{
  const r = run('sjf-np', [[0, 7, 0], [2, 4, 0], [4, 1, 0], [5, 4, 0]]);
  const byId = Object.fromEntries(r.results.map(x => [x.id, x]));
  assert(byId.P1.completion === 7, 'SJF-NP P1');
  assert(byId.P3.completion === 8, 'SJF-NP P3');
  assert(byId.P2.completion === 12, 'SJF-NP P2');
  assert(byId.P4.completion === 16, 'SJF-NP P4');
  console.log('✓ SJF Non-Preemptive');
}

// ── SRTF ──────────────────────────────────────────────────
// P1(0,8) P2(1,4) P3(2,9)
{
  const r = run('sjf-p', [[0, 8, 0], [1, 4, 0], [2, 9, 0]]);
  const byId = Object.fromEntries(r.results.map(x => [x.id, x]));
  assert(byId.P2.completion === 5, 'SRTF P2 completion'); // runs 1-5
  assert(byId.P1.completion === 12, 'SRTF P1 completion'); // 1 + 7 remaining after preemption
  assert(byId.P3.completion === 21, 'SRTF P3 completion');
  assert(byId.P2.waiting === 0, 'SRTF P2 waiting'); // 5-1-4
  console.log('✓ SRTF');
}

// ── Priority Preemptive ───────────────────────────────────
// P1(0,5,2) P2(1,4,1) — P2 preempts P1
{
  const r = run('priority-p', [[0, 5, 2], [1, 4, 1]]);
  const byId = Object.fromEntries(r.results.map(x => [x.id, x]));
  assert(byId.P2.completion === 5, 'Pri-P P2');
  assert(byId.P1.completion === 9, 'Pri-P P1');
  assert(byId.P1.waiting === 4, 'Pri-P P1 waiting'); // 9-0-5
  assert(byId.P2.response === 0, 'Pri-P P2 response');
  console.log('✓ Priority Preemptive');
}

// ── Round Robin q=2 ───────────────────────────────────────
// P1(0,5) P2(1,3) P3(2,3)
{
  const r = run('rr', [[0, 5, 0], [1, 3, 0], [2, 3, 0]], 2);
  const byId = Object.fromEntries(r.results.map(x => [x.id, x]));
  // P1:0-2, P2:2-4, P3:4-6, P1:6-8, P2:8-9, P3:9-10, P1:10-11
  assert(byId.P2.completion === 9, 'RR P2 completion');
  assert(byId.P3.completion === 10, 'RR P3 completion');
  assert(byId.P1.completion === 11, 'RR P1 completion');
  assert(r.makespan === 11, 'RR makespan');
  console.log('✓ Round Robin');
}

// ── Idle CPU gap ──────────────────────────────────────────
{
  const r = run('fcfs', [[3, 2, 0]]);
  assert(r.gantt[0].pid === 'IDLE', 'idle segment exists');
  assert(r.gantt[0].start === 0 && r.gantt[0].end === 3, 'idle 0-3');
  assert(r.results[0].completion === 5, 'delayed arrival completion');
  approx(r.metrics.cpuUtilization, 40, 'idle reduces util'); // 2/5
  console.log('✓ Idle CPU gap');
}

// ── Gantt segments merge correctly ────────────────────────
{
  const r = run('sjf-p', [[0, 4, 0]]);
  assert(r.gantt.length === 1, 'single gantt block');
  assert(r.gantt[0].start === 0 && r.gantt[0].end === 4, 'gantt span');
  console.log('✓ Gantt merge');
}

// ── Example dataset (Load Example button) ─────────────────
{
  const ex = [[0, 5, 2], [1, 3, 1], [2, 8, 3], [3, 6, 2], [4, 4, 1]];
  const procs = ex.map((p, i) => ({ id: `P${i + 1}`, arrival: p[0], burst: p[1], priority: p[2] }));

  const fcfs = runScheduler('fcfs', procs, 2);
  assert(fcfs.makespan === 26, 'Example FCFS makespan');
  approx(fcfs.metrics.avgWaiting, (0 + 4 + 6 + 13 + 18) / 5, 'Example FCFS avg WT');

  const rr = runScheduler('rr', procs, 2);
  assert(rr.makespan === 26, 'Example RR makespan');
  const rrById = Object.fromEntries(rr.results.map(x => [x.id, x]));
  assert(rrById.P1.completion === 16, 'Example RR P1');
  assert(rrById.P5.completion === 20, 'Example RR P5');
  console.log('✓ Example dataset (FCFS + RR)');
}

console.log('\nAll scheduler tests passed.');
