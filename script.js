/**
 * Cpu-Scheduling-Visualizer
 */

const PROCESS_COLORS = [  '#3d8bfd', '#3ecf8e', '#e8a838', '#e5534b', '#a371f7',
  '#39c5cf', '#f778ba', '#56d364', '#d2a8ff', '#79c0ff',
  '#ff9a3c', '#bc8cff', '#6eb5ff', '#7ee787', '#ffa198'
];

const IDLE_PID = 'IDLE';
const ANIM_SPEED = 10;
const ANIM_INTERVAL = 600 / ANIM_SPEED;
/** Metadata for each supported algorithm */
const ALGORITHM_INFO = {
  fcfs: {
    name: 'First Come First Serve',
    type: 'Non-Preemptive',
    complexity: 'O(n log n)',
    description: 'Processes are executed in order of arrival. Simple and fair in terms of arrival order, but can cause convoy effect.',
    advantages: ['Simple to implement', 'No starvation', 'Low overhead'],
    disadvantages: ['Convoy effect', 'Poor average waiting time', 'Not optimal for short jobs']
  },
  'sjf-np': {
    name: 'Shortest Job First (Non-Preemptive)',
    type: 'Non-Preemptive',
    complexity: 'O(n²)',
    description: 'Selects the process with the smallest burst time among ready processes. Optimal for minimum average waiting time when all jobs arrive simultaneously.',
    advantages: ['Minimizes average waiting time', 'Good for batch systems'],
    disadvantages: ['May cause starvation of long processes', 'Requires knowledge of burst time', 'Not suitable for interactive systems']
  },
  'sjf-p': {
    name: 'Shortest Remaining Time First',
    type: 'Preemptive',
    complexity: 'O(n²)',
    description: 'Preemptive version of SJF. At each time unit, the process with the shortest remaining burst time is selected.',
    advantages: ['Optimal average waiting time', 'Responsive to short jobs'],
    disadvantages: ['Starvation possible', 'High context-switch overhead', 'Needs burst time estimation']
  },
  'priority-np': {
    name: 'Priority Scheduling (Non-Preemptive)',
    type: 'Non-Preemptive',
    complexity: 'O(n²)',
    description: 'Each process has a priority. The highest priority (lowest number) ready process is selected and runs to completion.',
    advantages: ['Important tasks served first', 'Flexible for real-time systems'],
    disadvantages: ['Starvation of low-priority processes', 'Priority inversion risk', 'Requires careful priority assignment']
  },
  'priority-p': {
    name: 'Priority Scheduling (Preemptive)',
    type: 'Preemptive',
    complexity: 'O(n²)',
    description: 'Preemptive priority scheduling. A running process is preempted if a higher-priority process arrives.',
    advantages: ['Fast response for critical tasks', 'Suitable for real-time OS'],
    disadvantages: ['Starvation without aging', 'Frequent context switches', 'Complex priority management']
  },
  rr: {
    name: 'Round Robin',
    type: 'Preemptive (Time Quantum)',
    complexity: 'O(n)',
    description: 'Each process gets a fixed time quantum in cyclic order. Ideal for time-sharing systems with fair CPU allocation.',
    advantages: ['Fair allocation', 'Good response time', 'No starvation'],
    disadvantages: ['Performance depends on quantum size', 'Higher context-switch overhead', 'Not optimal for batch workloads']
  }
};

const EXAMPLE_PROCESSES = [
  { arrival: 0, burst: 5, priority: 2 },
  { arrival: 1, burst: 3, priority: 1 },
  { arrival: 2, burst: 8, priority: 3 },
  { arrival: 3, burst: 6, priority: 2 },
  { arrival: 4, burst: 4, priority: 1 }
];

const state = {  processes: [],
  nextId: 1,
  algorithm: 'fcfs',
  simulation: null,  currentTime: 0,
  isRunning: false,
  animFrameId: null,
  lastTick: 0
};

const DOM = {};
function cacheDOM() {
  DOM.algorithmSelect = document.getElementById('algorithmSelect');
  DOM.quantumGroup = document.getElementById('quantumGroup');
  DOM.timeQuantum = document.getElementById('timeQuantum');
  DOM.btnRun = document.getElementById('btnRun');
  DOM.btnStep = document.getElementById('btnStep');
  DOM.btnResetSim = document.getElementById('btnResetSim');
  DOM.btnLoadExample = document.getElementById('btnLoadExample');
  DOM.btnRandom = document.getElementById('btnRandom');
  DOM.btnResetAll = document.getElementById('btnResetAll');
  DOM.simStatus = document.getElementById('simStatus');
  DOM.algoInfo = document.getElementById('algoInfo');
  DOM.ganttContainer = document.getElementById('ganttContainer');
  DOM.ganttLegend = document.getElementById('ganttLegend');
  DOM.readyQueueDisplay = document.getElementById('readyQueueDisplay');
  DOM.cpuProcess = document.getElementById('cpuProcess');
  DOM.resultsBody = document.getElementById('resultsBody');
  DOM.metricsSummary = document.getElementById('metricsSummary');
  DOM.processList = document.getElementById('processList');
  DOM.processCount = document.getElementById('processCount');
  DOM.addProcessForm = document.getElementById('addProcessForm');
  DOM.formError = document.getElementById('formError');
  DOM.inputArrival = document.getElementById('inputArrival');
  DOM.inputBurst = document.getElementById('inputBurst');
  DOM.inputPriority = document.getElementById('inputPriority');
  DOM.editModal = document.getElementById('editModal');
  DOM.editProcessForm = document.getElementById('editProcessForm');
  DOM.editFormError = document.getElementById('editFormError');
  DOM.editProcessId = document.getElementById('editProcessId');
  DOM.editArrival = document.getElementById('editArrival');
  DOM.editBurst = document.getElementById('editBurst');
  DOM.editPriority = document.getElementById('editPriority');
  DOM.editCancel = document.getElementById('editCancel');
  DOM.editModalClose = document.getElementById('editModalClose');
  DOM.quantumError = document.getElementById('quantumError');
  DOM.tooltip = document.getElementById('tooltip');
}

function generateProcessId() {
  return `P${state.nextId++}`;
}

function getProcessColor(pid) {
  if (pid === IDLE_PID) return '#3a3f48';
  const num = parseInt(pid.replace(/\D/g, ''), 10) || 0;
  return PROCESS_COLORS[(num - 1) % PROCESS_COLORS.length];
}

function cloneProcesses(processes) {
  return processes.map(p => ({
    id: p.id,
    arrival: p.arrival,
    burst: p.burst,
    priority: p.priority,
    remaining: p.burst,
    completion: null,
    responseStart: null
  }));
}

/** Merge consecutive gantt segments with the same process */
function mergeGanttSegments(segments) {
  if (!segments.length) return [];
  const merged = [{ pid: segments[0].pid, start: segments[0].start, end: segments[0].end }];
  for (let i = 1; i < segments.length; i++) {
    const last = merged[merged.length - 1];
    const curr = segments[i];
    if (curr.pid === last.pid && curr.start === last.end) {
      last.end = curr.end;
    } else {
      merged.push({ pid: curr.pid, start: curr.start, end: curr.end });
    }
  }
  return merged;
}

/** Calculate performance metrics from completed processes */
function calculateMetrics(processes, makespan) {
  const n = processes.length;
  if (n === 0) {
    return { avgWaiting: 0, avgTurnaround: 0, avgResponse: 0, cpuUtilization: 0, throughput: 0 };
  }

  let totalWaiting = 0;
  let totalTurnaround = 0;
  let totalResponse = 0;
  let totalBurst = 0;

  processes.forEach(p => {
    const waiting = p.completion - p.arrival - p.burst;
    const turnaround = p.completion - p.arrival;
    const response = p.responseStart - p.arrival;
    totalWaiting += waiting;
    totalTurnaround += turnaround;
    totalResponse += response;
    totalBurst += p.burst;
  });

  return {
    avgWaiting: +(totalWaiting / n).toFixed(2),
    avgTurnaround: +(totalTurnaround / n).toFixed(2),
    avgResponse: +(totalResponse / n).toFixed(2),
    cpuUtilization: makespan > 0 ? +((totalBurst / makespan) * 100).toFixed(1) : 0,
    throughput: makespan > 0 ? +(n / makespan).toFixed(3) : 0
  };
}

/** Build per-process result rows from simulation state */
function buildResults(processes) {
  return processes.map(p => ({
    id: p.id,
    arrival: p.arrival,
    burst: p.burst,
    priority: p.priority,
    completion: p.completion,
    waiting: p.completion - p.arrival - p.burst,
    turnaround: p.completion - p.arrival,
    response: p.responseStart - p.arrival
  }));
}

/** Validate process input fields */
function validateProcessInput(arrival, burst, priority) {
  if (arrival === '' || burst === '' || priority === '') {
    return 'All fields are required.';
  }
  const a = Number(arrival);
  const b = Number(burst);
  const pr = Number(priority);
  if (!Number.isInteger(a) || a < 0) return 'Arrival time must be a non-negative integer.';
  if (!Number.isInteger(b) || b < 1) return 'Burst time must be a positive integer.';
  if (!Number.isInteger(pr) || pr < 0) return 'Priority must be a non-negative integer.';
  return null;
}

/** Get ready processes (arrived, not completed, with work remaining) */
function getReady(processes, time) {
  return processes.filter(p => p.arrival <= time && p.completion === null && p.remaining > 0);
}

/** Get ready-queue IDs for display (excludes the running process) */
function getReadyQueueIds(procs, time, runningId) {
  return procs
    .filter(p => p.arrival <= time && p.completion === null && p.remaining > 0 && p.id !== runningId)
    .sort((a, b) => a.arrival - b.arrival || a.id.localeCompare(b.id))
    .map(p => p.id);
}

function nextPendingProcess(procs) {
  let next = null;
  for (const p of procs) {
    if (p.completion !== null) continue;
    if (!next || p.arrival < next.arrival) next = p;
  }
  return next;
}

function skipIdleUntil(time, target, procs, timeline, ganttRaw, onTime) {
  while (time < target) {
    recordTick(timeline, ganttRaw, time, IDLE_PID, getReadyQueueIds(procs, time, null));
    time++;
    if (onTime) onTime(time);
  }
  return time;
}
/** Record one tick of execution in the simulation trace */
function recordTick(timeline, ganttRaw, time, running, ready) {
  timeline.push({ time, running, ready: [...ready] });
  ganttRaw.push({ pid: running, start: time, end: time + 1 });
}

/** Finalize simulation output from internal state */
function finalizeSimulation(processes, timeline, ganttRaw) {
  const completions = processes.map(p => p.completion ?? 0);
  const makespan = completions.length ? Math.max(...completions) : 0;
  const sorted = [...processes].sort((a, b) => {
    const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
    return numA - numB || a.id.localeCompare(b.id);
  });
  return {
    gantt: mergeGanttSegments(ganttRaw),
    timeline,
    results: buildResults(sorted),
    metrics: calculateMetrics(sorted, makespan),
    makespan
  };
}

function scheduleFCFS(processes) {  const procs = cloneProcesses(processes);
  const timeline = [];
  const ganttRaw = [];
  let time = 0;
  const completed = new Set();

  while (completed.size < procs.length) {
    const ready = procs
      .filter(p => p.arrival <= time && p.completion === null)
      .sort((a, b) => a.arrival - b.arrival || a.id.localeCompare(b.id));

    if (ready.length === 0) {
      const next = nextPendingProcess(procs);
      if (!next) break;
      time = skipIdleUntil(time, next.arrival, procs, timeline, ganttRaw);
      continue;
    }
    const current = ready[0];
    if (current.responseStart === null) current.responseStart = time;

    while (current.remaining > 0) {
      const readyIds = getReadyQueueIds(procs, time, current.id);
      recordTick(timeline, ganttRaw, time, current.id, readyIds);
      current.remaining--;
      time++;
      if (current.remaining === 0) {
        current.completion = time;
        completed.add(current.id);
      }
    }
  }

  return finalizeSimulation(procs, timeline, ganttRaw);
}

/** SJF Non-Preemptive — Shortest Job First */
function scheduleSJF_NP(processes) {
  const procs = cloneProcesses(processes);
  const timeline = [];
  const ganttRaw = [];
  let time = 0;
  const completed = new Set();

  while (completed.size < procs.length) {
    const ready = getReady(procs, time)
      .sort((a, b) => a.burst - b.burst || a.arrival - b.arrival || a.id.localeCompare(b.id));

    if (ready.length === 0) {
      const next = nextPendingProcess(procs);
      if (!next) break;
      time = skipIdleUntil(time, next.arrival, procs, timeline, ganttRaw);
      continue;
    }
    const current = ready[0];
    if (current.responseStart === null) current.responseStart = time;

    while (current.remaining > 0) {
      const readyIds = getReadyQueueIds(procs, time, current.id);
      recordTick(timeline, ganttRaw, time, current.id, readyIds);
      current.remaining--;
      time++;
      if (current.remaining === 0) {
        current.completion = time;
        completed.add(current.id);
      }
    }
  }

  return finalizeSimulation(procs, timeline, ganttRaw);
}

/** SJF Preemptive — Shortest Remaining Time First (SRTF) */
function scheduleSJF_P(processes) {
  const procs = cloneProcesses(processes);
  const timeline = [];
  const ganttRaw = [];
  let time = 0;
  const completed = new Set();

  while (completed.size < procs.length) {
    const ready = getReady(procs, time)
      .sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival || a.id.localeCompare(b.id));

    if (ready.length === 0) {
      const next = nextPendingProcess(procs);
      if (!next) break;
      time = skipIdleUntil(time, next.arrival, procs, timeline, ganttRaw);
      continue;
    }
    const current = ready[0];
    if (current.responseStart === null) current.responseStart = time;

    const readyIds = getReadyQueueIds(procs, time, current.id);
    recordTick(timeline, ganttRaw, time, current.id, readyIds);
    current.remaining--;
    time++;

    if (current.remaining === 0) {
      current.completion = time;
      completed.add(current.id);
    }
  }

  return finalizeSimulation(procs, timeline, ganttRaw);
}

/** Priority Non-Preemptive */
function schedulePriority_NP(processes) {
  const procs = cloneProcesses(processes);
  const timeline = [];
  const ganttRaw = [];
  let time = 0;
  const completed = new Set();

  while (completed.size < procs.length) {
    const ready = getReady(procs, time)
      .sort((a, b) => a.priority - b.priority || a.arrival - b.arrival || a.id.localeCompare(b.id));

    if (ready.length === 0) {
      const next = nextPendingProcess(procs);
      if (!next) break;
      time = skipIdleUntil(time, next.arrival, procs, timeline, ganttRaw);
      continue;
    }
    const current = ready[0];
    if (current.responseStart === null) current.responseStart = time;

    while (current.remaining > 0) {
      const readyIds = getReadyQueueIds(procs, time, current.id);
      recordTick(timeline, ganttRaw, time, current.id, readyIds);
      current.remaining--;
      time++;
      if (current.remaining === 0) {
        current.completion = time;
        completed.add(current.id);
      }
    }
  }

  return finalizeSimulation(procs, timeline, ganttRaw);
}

/** Priority Preemptive */
function schedulePriority_P(processes) {
  const procs = cloneProcesses(processes);
  const timeline = [];
  const ganttRaw = [];
  let time = 0;
  const completed = new Set();

  while (completed.size < procs.length) {
    const ready = getReady(procs, time)
      .sort((a, b) => a.priority - b.priority || a.arrival - b.arrival || a.id.localeCompare(b.id));

    if (ready.length === 0) {
      const next = nextPendingProcess(procs);
      if (!next) break;
      time = skipIdleUntil(time, next.arrival, procs, timeline, ganttRaw);
      continue;
    }
    const current = ready[0];
    if (current.responseStart === null) current.responseStart = time;

    const readyIds = getReadyQueueIds(procs, time, current.id);
    recordTick(timeline, ganttRaw, time, current.id, readyIds);
    current.remaining--;
    time++;

    if (current.remaining === 0) {
      current.completion = time;
      completed.add(current.id);
    }
  }

  return finalizeSimulation(procs, timeline, ganttRaw);
}

/** Round Robin */
function scheduleRoundRobin(processes, quantum) {
  const procs = cloneProcesses(processes);
  const timeline = [];
  const ganttRaw = [];
  let time = 0;
  const completed = new Set();
  const queue = [];
  /** Tracks processes that have entered the ready queue (waiting or running) */
  const inQueue = new Set();

  /** Add newly arrived processes to the tail of the ready queue */
  function enqueueArrivals() {
    procs
      .filter(p => p.arrival <= time && p.completion === null && !inQueue.has(p.id))
      .sort((a, b) => a.arrival - b.arrival || a.id.localeCompare(b.id))
      .forEach(p => {
        queue.push(p);
        inQueue.add(p.id);
      });
  }

  while (completed.size < procs.length) {
    enqueueArrivals();

    if (queue.length === 0) {
      const next = nextPendingProcess(procs);
      if (!next) break;
      time = skipIdleUntil(time, next.arrival, procs, timeline, ganttRaw, enqueueArrivals);
      continue;
    }
    const current = queue.shift();
    if (current.responseStart === null) current.responseStart = time;

    const slice = Math.min(quantum, current.remaining);
    for (let i = 0; i < slice; i++) {
      const readyIds = queue.map(p => p.id);
      recordTick(timeline, ganttRaw, time, current.id, readyIds);
      current.remaining--;
      time++;
      enqueueArrivals();
    }

    if (current.remaining === 0) {
      current.completion = time;
      completed.add(current.id);
      inQueue.delete(current.id);
    } else {
      queue.push(current);
    }
  }

  return finalizeSimulation(procs, timeline, ganttRaw);
}

/** Dispatcher — routes to the correct algorithm */
function runScheduler(algorithm, processes, quantum) {
  if (processes.length === 0) return null;

  switch (algorithm) {
    case 'fcfs': return scheduleFCFS(processes);
    case 'sjf-np': return scheduleSJF_NP(processes);
    case 'sjf-p': return scheduleSJF_P(processes);
    case 'priority-np': return schedulePriority_NP(processes);
    case 'priority-p': return schedulePriority_P(processes);
    case 'rr': return scheduleRoundRobin(processes, quantum);
    default: return scheduleFCFS(processes);
  }
}

function addProcess(arrival, burst, priority) {  const error = validateProcessInput(arrival, burst, priority);
  if (error) return error;

  state.processes.push({
    id: generateProcessId(),
    arrival: Number(arrival),
    burst: Number(burst),
    priority: Number(priority)
  });
  return null;
}

function updateProcess(id, arrival, burst, priority) {
  const error = validateProcessInput(arrival, burst, priority);
  if (error) return error;

  const proc = state.processes.find(p => p.id === id);
  if (!proc) return 'Process not found.';
  proc.arrival = Number(arrival);
  proc.burst = Number(burst);
  proc.priority = Number(priority);
  return null;
}

function deleteProcess(id) {
  state.processes = state.processes.filter(p => p.id !== id);
}

function clearSimulationState() {
  stopAnimation();
  state.simulation = null;
  state.currentTime = 0;
  resetSimulationUI();
  updateSimStatus('idle');
  setSimButtons({ running: false, hasSim: false });
}

function resetAll() {
  clearSimulationState();
  state.processes = [];
  state.nextId = 1;
  renderProcessList();
}

function loadExampleData() {
  clearSimulationState();
  state.processes = [];
  state.nextId = 1;
  EXAMPLE_PROCESSES.forEach(p => {
    state.processes.push({ id: generateProcessId(), ...p });
  });
  renderProcessList();
}

function generateRandomProcesses() {
  clearSimulationState();
  state.processes = [];
  state.nextId = 1;
  const count = Math.floor(Math.random() * 4) + 3;
  let lastArrival = 0;

  for (let i = 0; i < count; i++) {
    const arrival = i === 0 ? 0 : lastArrival + Math.floor(Math.random() * 4);
    lastArrival = arrival;
    state.processes.push({
      id: generateProcessId(),
      arrival,
      burst: Math.floor(Math.random() * 8) + 2,
      priority: Math.floor(Math.random() * 5)
    });
  }
  renderProcessList();
}

function prepareSimulation() {  if (state.processes.length === 0) return false;

  const quantum = state.algorithm === 'rr' ? Number(DOM.timeQuantum.value) : 0;
  if (state.algorithm === 'rr' && (!Number.isInteger(quantum) || quantum < 1)) {
    showFormError(DOM.quantumError, 'Time quantum must be a positive integer.');
    return false;
  }
  hideFormError(DOM.quantumError);

  stopAnimation();
  state.simulation = runScheduler(state.algorithm, state.processes, quantum);  state.currentTime = 0;

  renderGanttStructure(state.simulation);
  renderResults(state.simulation, true);
  updateSimStatus('ready');
  setSimButtons({ running: false, hasSim: true });

  return true;
}

function startAnimation() {
  if (!state.simulation && !prepareSimulation()) return;

  state.isRunning = true;
  updateSimStatus('running');
  setSimButtons({ running: true, hasSim: true });
  renderProcessList();
  state.lastTick = performance.now();
  animate();
}
function animate() {
  if (!state.isRunning) return;

  const interval = ANIM_INTERVAL;  const now = performance.now();

  if (now - state.lastTick >= interval) {
    state.lastTick = now;
    if (!stepSimulation()) {
      completeSimulation();
      return;
    }
  }

  state.animFrameId = requestAnimationFrame(animate);
}

function stepSimulation() {
  if (!state.simulation) {
    if (!prepareSimulation()) return false;
  }

  const { timeline, makespan } = state.simulation;

  if (state.currentTime >= makespan) return false;

  const tick = timeline[state.currentTime];
  updateVisualization(tick, state.currentTime);
  state.currentTime++;

  if (state.currentTime >= makespan) return false;
  return true;
}

function stopAnimation() {
  state.isRunning = false;
  if (state.animFrameId) {
    cancelAnimationFrame(state.animFrameId);
    state.animFrameId = null;
  }
}

function completeSimulation() {
  stopAnimation();
  updateSimStatus('complete');
  setSimButtons({ running: false, hasSim: true });
  renderProcessList();
  renderResults(state.simulation, false);
  revealAllGanttBlocks();
}
function resetSimulation() {
  clearSimulationState();
  renderProcessList();
}

function resetSimulationUI() {
  DOM.ganttContainer.innerHTML = '<div class="gantt-empty"><p>Add processes and run a simulation to see the Gantt chart.</p></div>';
  DOM.ganttLegend.innerHTML = '';
  DOM.readyQueueDisplay.innerHTML = '<span class="queue-empty">—</span>';
  DOM.cpuProcess.textContent = 'IDLE';
  DOM.cpuProcess.className = 'value idle';
  DOM.cpuProcess.style.borderColor = '';
  DOM.cpuProcess.style.color = '';
  DOM.resultsBody.innerHTML = '<tr class="empty-row"><td colspan="8">No results yet</td></tr>';
  DOM.metricsSummary.innerHTML = '';
  lastReadyHtml = '';
}

function renderProcessList() {
  DOM.processCount.textContent = state.processes.length;
  const locked = state.isRunning;

  if (state.processes.length === 0) {
    DOM.processList.innerHTML = '<li class="process-empty">No processes added</li>';
    return;
  }

  DOM.processList.innerHTML = state.processes.map(p => `
    <li class="process-item" data-id="${p.id}">
      <div class="process-item-info">
        <span class="process-color-dot" style="background:${getProcessColor(p.id)}"></span>
        <div>
          <strong>${p.id}</strong>
          <div class="process-item-details">
            <span>AT:${p.arrival}</span>
            <span>BT:${p.burst}</span>
            <span>PR:${p.priority}</span>
          </div>
        </div>
      </div>
      <div class="process-item-actions">
        <button type="button" class="btn-icon-only edit-btn" data-id="${p.id}" title="Edit" aria-label="Edit ${p.id}" ${locked ? 'disabled' : ''}>✎</button>
        <button type="button" class="btn-icon-only danger delete-btn" data-id="${p.id}" title="Delete" aria-label="Delete ${p.id}" ${locked ? 'disabled' : ''}>✕</button>
      </div>
    </li>
  `).join('');
}
function renderGanttStructure(sim) {
  const { gantt, makespan } = sim;
  const unitWidth = Math.max(40, Math.min(72, 800 / makespan));
  const gap = 3;

  DOM.ganttLegend.innerHTML = state.processes.map(p => `
    <span class="legend-item">
      <span class="legend-swatch" style="background:${getProcessColor(p.id)}"></span>
      ${p.id}
    </span>
  `).join('') + `<span class="legend-item"><span class="legend-swatch" style="background:var(--idle)"></span>IDLE</span>`;

  const wrap = document.createElement('div');
  wrap.className = 'gantt-wrap';

  const track = document.createElement('div');
  track.className = 'gantt-track';

  const segmentMeta = [];
  let cursor = 0;

  gantt.forEach((seg, i) => {
    const duration = seg.end - seg.start;
    const segmentWidth = duration * unitWidth;

    const segment = document.createElement('div');
    segment.className = 'gantt-segment';
    segment.style.width = `${segmentWidth}px`;

    const block = document.createElement('div');
    block.className = `gantt-block ${seg.pid === IDLE_PID ? 'idle' : ''} pending`;
    block.style.background = seg.pid === IDLE_PID ? '' : getProcessColor(seg.pid);
    block.dataset.pid = seg.pid;
    block.dataset.start = seg.start;
    block.dataset.end = seg.end;
    block.dataset.index = i;
    block.innerHTML = `
      <span class="block-label">${seg.pid === IDLE_PID ? '—' : seg.pid}</span>
      <span class="progress-fill"></span>
    `;

    segment.appendChild(block);
    track.appendChild(segment);
    segmentMeta.push({ seg, startPixel: cursor, segmentWidth });
    cursor += segmentWidth + gap;
  });

  const totalWidth = Math.max(cursor - gap, 0);
  wrap.style.width = `${totalWidth}px`;

  const ruler = document.createElement('div');
  ruler.className = 'gantt-ruler';
  ruler.style.width = `${totalWidth}px`;

  const timeToX = (t) => {
    for (const { seg, startPixel } of segmentMeta) {
      if (t >= seg.start && t <= seg.end) {
        return startPixel + (t - seg.start) * unitWidth;
      }
    }
    return totalWidth;
  };

  for (let t = 0; t <= makespan; t++) {
    const tick = document.createElement('span');
    tick.className = 'gantt-tick';
    tick.textContent = t;
    tick.style.left = `${timeToX(t)}px`;
    ruler.appendChild(tick);
  }

  wrap.appendChild(track);
  wrap.appendChild(ruler);

  DOM.ganttContainer.innerHTML = '';
  DOM.ganttContainer.appendChild(wrap);
  DOM.ganttContainer.dataset.unitWidth = unitWidth;
}

let lastReadyHtml = '';

function updateVisualization(tick, time) {
  if (!tick) return;

  const blocks = DOM.ganttContainer.querySelectorAll('.gantt-block');

  blocks.forEach(block => {
    const start = Number(block.dataset.start);
    const end = Number(block.dataset.end);
    const fill = block.querySelector('.progress-fill');

    if (time >= start) {
      block.classList.add('active');
      block.classList.remove('pending');
    }

    if (time >= start && time < end) {
      block.classList.add('current');
      const progress = ((time - start + 1) / (end - start)) * 100;
      if (fill) fill.style.width = `${progress}%`;
    } else {
      block.classList.remove('current');
      if (time >= end && fill) fill.style.width = '100%';
    }
  });

  const readyHtml = tick.ready.length
    ? tick.ready.map(id => `<span class="queue-chip" style="border-color:${getProcessColor(id)}40;background:${getProcessColor(id)}15">${id}</span>`).join('')
    : '<span class="queue-empty">Empty</span>';

  if (readyHtml !== lastReadyHtml) {
    DOM.readyQueueDisplay.innerHTML = readyHtml;
    lastReadyHtml = readyHtml;
  }
  const cpuEl = DOM.cpuProcess;
  if (tick.running === IDLE_PID) {
    cpuEl.textContent = 'IDLE';
    cpuEl.className = 'value idle';
  } else {
    cpuEl.textContent = tick.running;
    cpuEl.style.borderColor = getProcessColor(tick.running);
    cpuEl.style.color = getProcessColor(tick.running);
    cpuEl.className = 'value running';
  }

  DOM.ganttContainer.scrollLeft = Math.max(0, (() => {
    const ticks = DOM.ganttContainer.querySelectorAll('.gantt-tick');
    const tickEl = ticks[time];
    if (!tickEl) return 0;
    const x = parseFloat(tickEl.style.left) || 0;
    return x - DOM.ganttContainer.clientWidth / 2;
  })());
}

function revealAllGanttBlocks() {
  DOM.ganttContainer.querySelectorAll('.gantt-block').forEach(block => {
    block.classList.add('active');
    block.classList.remove('pending', 'current');
    const fill = block.querySelector('.progress-fill');
    if (fill) fill.style.width = '100%';
  });

  if (state.simulation && state.simulation.timeline.length > 0) {
    const lastTick = state.simulation.timeline[state.simulation.timeline.length - 1];
    updateVisualization(lastTick, lastTick.time);
  }
}

function renderResults(sim, partial) {
  if (!sim) return;

  const rows = partial
    ? sim.results.map(r => ({ ...r, completion: '—', waiting: '—', turnaround: '—', response: '—' }))
    : sim.results;

  DOM.resultsBody.innerHTML = rows.map(r => `
    <tr>
      <td><span class="process-color-dot" style="background:${getProcessColor(r.id)}"></span>${r.id}</td>
      <td>${r.arrival}</td>
      <td>${r.burst}</td>
      <td>${r.priority}</td>
      <td>${r.completion}</td>
      <td>${r.waiting}</td>
      <td>${r.turnaround}</td>
      <td>${r.response}</td>
    </tr>
  `).join('');

  if (!partial) {
    const m = sim.metrics;
    DOM.metricsSummary.innerHTML = `
      <span class="metric-chip">Avg WT: <strong>${m.avgWaiting}</strong></span>
      <span class="metric-chip">Avg TAT: <strong>${m.avgTurnaround}</strong></span>
      <span class="metric-chip">Avg RT: <strong>${m.avgResponse}</strong></span>
      <span class="metric-chip">CPU: <strong>${m.cpuUtilization}%</strong></span>
      <span class="metric-chip">Throughput: <strong>${m.throughput}</strong></span>
    `;
  }
}

function renderAlgoInfo(algorithm) {
  const info = ALGORITHM_INFO[algorithm];
  if (!info) return;

  DOM.algoInfo.innerHTML = `
    <p>${info.description}</p>
    <h4>Properties</h4>
    <p>
      <span class="info-tag">${info.type}</span>
      <span class="info-tag">${info.complexity}</span>
    </p>
    <h4>Advantages</h4>
    <ul class="info-list">${info.advantages.map(a => `<li>${a}</li>`).join('')}</ul>
    <h4>Disadvantages</h4>
    <ul class="info-list">${info.disadvantages.map(d => `<li>${d}</li>`).join('')}</ul>
  `;
}

function updateSimStatus(status) {
  DOM.simStatus.className = 'nav-status';
  const text = DOM.simStatus.querySelector('.status-text');

  const labels = {
    idle: 'Idle',
    ready: 'Ready',
    running: 'Running',
    complete: 'Complete'
  };

  if (status !== 'idle') DOM.simStatus.classList.add(status);
  text.textContent = labels[status] || 'Idle';
}

function setSimButtons({ running, hasSim }) {
  DOM.btnRun.disabled = running;
  DOM.btnStep.disabled = running;
  DOM.btnResetSim.disabled = !hasSim;
}

function showFormError(el, message) {
  el.textContent = message;
  el.classList.remove('hidden');
}

function hideFormError(el) {
  el.classList.add('hidden');
  el.textContent = '';
}

function toggleQuantumField() {
  const isRR = state.algorithm === 'rr';
  DOM.quantumGroup.classList.toggle('hidden', !isRR);
}

function initTooltips() {  let timeout;

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-tooltip]');
    if (!target) return;

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      DOM.tooltip.textContent = target.dataset.tooltip;
      DOM.tooltip.hidden = false;
    }, 400);
  });

  document.addEventListener('mousemove', (e) => {
    if (DOM.tooltip.hidden) return;
    DOM.tooltip.style.left = `${e.clientX + 12}px`;
    DOM.tooltip.style.top = `${e.clientY + 12}px`;
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('[data-tooltip]');
    if (!target) return;
    const related = e.relatedTarget;
    if (related && target.contains(related)) return;
    clearTimeout(timeout);
    DOM.tooltip.hidden = true;
  });
}

function bindEvents() {  DOM.algorithmSelect.addEventListener('change', (e) => {
    state.algorithm = e.target.value;
    toggleQuantumField();
    renderAlgoInfo(state.algorithm);
    resetSimulation();
  });

  DOM.timeQuantum.addEventListener('change', () => {
    hideFormError(DOM.quantumError);
    resetSimulation();
  });
  DOM.btnRun.addEventListener('click', startAnimation);
  DOM.btnStep.addEventListener('click', () => {
    if (!state.simulation && !prepareSimulation()) return;
    if (!stepSimulation()) completeSimulation();
    else updateSimStatus('ready');
  });

  DOM.btnResetSim.addEventListener('click', resetSimulation);
  DOM.btnLoadExample.addEventListener('click', loadExampleData);

  DOM.btnRandom.addEventListener('click', generateRandomProcesses);

  DOM.btnResetAll.addEventListener('click', resetAll);

  DOM.addProcessForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideFormError(DOM.formError);
    const error = addProcess(
      DOM.inputArrival.value,
      DOM.inputBurst.value,
      DOM.inputPriority.value
    );
    if (error) {
      showFormError(DOM.formError, error);
      return;
    }
    resetSimulation();
    renderProcessList();
    DOM.addProcessForm.reset();
    DOM.inputArrival.value = '0';
    DOM.inputBurst.value = '1';
    DOM.inputPriority.value = '0';
  });

  DOM.processList.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');

    if (editBtn) {
      if (state.isRunning) return;
      const proc = state.processes.find(p => p.id === editBtn.dataset.id);
      if (!proc) return;
      DOM.editProcessId.value = proc.id;
      DOM.editArrival.value = proc.arrival;
      DOM.editBurst.value = proc.burst;
      DOM.editPriority.value = proc.priority;
      hideFormError(DOM.editFormError);
      DOM.editModal.showModal();
    }

    if (deleteBtn) {
      if (state.isRunning) return;      deleteProcess(deleteBtn.dataset.id);
      resetSimulation();
      renderProcessList();
    }
  });

  DOM.editProcessForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideFormError(DOM.editFormError);
    const id = DOM.editProcessId.value;
    const error = updateProcess(
      id,
      DOM.editArrival.value,
      DOM.editBurst.value,
      DOM.editPriority.value
    );    if (error) {
      showFormError(DOM.editFormError, error);
      return;
    }
    DOM.editModal.close();
    resetSimulation();
    renderProcessList();
  });

  DOM.editCancel.addEventListener('click', () => DOM.editModal.close());
  DOM.editModalClose.addEventListener('click', () => DOM.editModal.close());
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    if (DOM.editModal.open) return;

    switch (e.key.toLowerCase()) {
      case 'r':
        e.preventDefault();
        startAnimation();
        break;
      case 's':
        e.preventDefault();
        if (!state.simulation && !prepareSimulation()) return;
        if (!stepSimulation()) completeSimulation();
        else updateSimStatus('ready');
        break;
      case 'escape':
        resetSimulation();
        break;
    }
  });

}

function init() {
  cacheDOM();
  state.algorithm = DOM.algorithmSelect.value;
  bindEvents();
  initTooltips();
  toggleQuantumField();
  renderAlgoInfo(state.algorithm);
  renderProcessList();
  updateSimStatus('idle');
  setSimButtons({ running: false, hasSim: false });
}

document.addEventListener('DOMContentLoaded', init);
