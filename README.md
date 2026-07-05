# CPU Scheduling Visualizer

An interactive **CPU Scheduling Algorithm Visualizer** built using **HTML, CSS, and JavaScript**. The application simulates multiple CPU scheduling algorithms through animated Gantt charts, real-time process execution, ready queue visualization, and comprehensive performance metrics, making it a useful learning tool for Operating Systems students.

---

## Features

- Interactive visualization of CPU scheduling algorithms
- Animated Gantt Chart with process execution timeline
- Live Ready Queue visualization
- Real-time CPU execution state
- Step-by-step simulation mode
- Automatic simulation mode
- Add, edit, and delete processes
- Input validation for process data
- Example dataset loader
- Random process generator
- Performance metrics calculation
- Responsive developer-tool inspired interface
- Keyboard shortcuts for quick simulation control

---

## Supported Algorithms

| Algorithm | Type |
|-----------|------|
| First Come First Serve (FCFS) | Non-Preemptive |
| Shortest Job First (SJF) | Non-Preemptive |
| Shortest Remaining Time First (SRTF) | Preemptive |
| Priority Scheduling | Non-Preemptive |
| Priority Scheduling | Preemptive |
| Round Robin | Preemptive |

---

## Performance Metrics

The simulator automatically calculates:

- Completion Time
- Waiting Time
- Turnaround Time
- Response Time
- Average Waiting Time
- Average Turnaround Time
- Average Response Time
- CPU Utilization
- Throughput

Priority scheduling assumes **lower priority values indicate higher priority**.

---

## Screenshots

### Dashboard

*(Add screenshot here)*

### Simulation Running

*(Add screenshot here)*

## Folder Structure

```text
cpu-scheduling-visualizer/
│
├── index.html
├── style.css
├── script.js
├── test-scheduler.js
├── README.md
└── docs/
    └── screenshot.png
```

---

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6)
- CSS Grid
- Flexbox
- IBM Plex Sans
- IBM Plex Mono

No frameworks, libraries, or build tools are used.

---

## Run Locally

Clone the repository

```bash
git clone https://github.com/yourusername/cpu-scheduling-visualizer.git
```

Navigate to the project

```bash
cd cpu-scheduling-visualizer
```

Open the project

Simply open **index.html** in your preferred browser.

Or start a local server

```bash
npx serve .
```

---

## Running Tests

Algorithm correctness tests can be executed using Node.js.

```bash
node test-scheduler.js
```

---

## Usage

1. Add processes manually or generate sample processes.
2. Select a scheduling algorithm.
3. Specify a time quantum when using Round Robin.
4. Click **Run** to start the simulation or **Step** to execute one time unit at a time.
5. Observe:
   - Gantt Chart
   - Ready Queue
   - CPU State
   - Performance Metrics
6. Compare the behavior of different scheduling algorithms.

---

## Metrics Formula

| Metric | Formula |
|--------|---------|
| Waiting Time | Completion − Arrival − Burst |
| Turnaround Time | Completion − Arrival |
| Response Time | First CPU Execution − Arrival |
| CPU Utilization | (Total Burst Time / Makespan) × 100 |
| Throughput | Total Processes / Makespan |

---

## Future Enhancements

- Export simulation results as CSV
- Side-by-side algorithm comparison
- Multi-core CPU scheduling simulation
- Priority aging
- Timeline playback controls
- Performance comparison charts
- Import process data from CSV
- Dark/Light theme switch

---

## Author

**Sumanth P Shetty**

GitHub: https://github.com/sumanth6002

Repository: https://github.com/sumanth6002/Cpu-Scheduling-Visualizer

---

## License

This project is licensed under the MIT License.
