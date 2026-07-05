# CPU Scheduler

An interactive CPU scheduling algorithm visualizer built with vanilla HTML, CSS, and JavaScript. Designed for operating systems students and instructors who want to compare scheduling policies, inspect Gantt charts, and analyze performance metrics in real time.

![Screenshot placeholder](docs/screenshot.png)

> Add a screenshot to `docs/screenshot.png` before publishing.

## Supported Algorithms

| Algorithm | Type |
|-----------|------|
| FCFS | Non-preemptive |
| SJF | Non-preemptive |
| SJF (SRTF) | Preemptive |
| Priority | Non-preemptive |
| Priority | Preemptive |
| Round Robin | Preemptive (time quantum) |

## Features

- Add, edit, and delete processes with validation
- Animated Gantt chart with per-process colors and time ranges
- Live ready queue and CPU state during simulation
- Step-by-step or full-run simulation
- Results table: completion, waiting, turnaround, and response times
- Summary metrics: averages, CPU utilization, throughput
- Algorithm reference panel with complexity and trade-offs
- Example dataset and random process generator
- Keyboard shortcuts: `R` run, `S` step, `Esc` reset simulation

## Folder Structure

```
CPU scheduler sim/
├── index.html        # Application markup
├── style.css         # Layout and theme
├── script.js         # Scheduling logic and UI
├── test-scheduler.js # Algorithm verification (Node.js)
└── README.md
```

## Technologies

- HTML5
- CSS3 (custom properties, Grid, Flexbox)
- Vanilla JavaScript (ES6+)
- [IBM Plex Sans / Mono](https://fonts.google.com/) via Google Fonts

No frameworks, build tools, or dependencies required.

## Run Locally

1. Clone or download the repository.
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari).

For live reload during development, use any static server:

```bash
npx serve .
```

### Run Tests

Algorithm correctness tests run in Node.js without a browser:

```bash
node test-scheduler.js
```

## Usage

1. Add processes manually, load the example set, or generate random data.
2. Select a scheduling algorithm (set time quantum for Round Robin).
3. Click **Run** to animate the schedule or **Step** to advance one time unit.
4. Review the Gantt chart, ready queue, and results table.

## Metrics

| Metric | Formula |
|--------|---------|
| Waiting time | Completion − Arrival − Burst |
| Turnaround time | Completion − Arrival |
| Response time | First CPU time − Arrival |
| CPU utilization | Total burst time ÷ Makespan × 100 |
| Throughput | Process count ÷ Makespan |

Lower priority numbers represent higher priority.

## Future Improvements

- Export results to CSV
- Side-by-side algorithm comparison
- Aging for priority scheduling
- Custom process color assignment
- URL-based shareable configurations
- Dark/light theme toggle

## License

MIT
