/* =====================================================================
   CIRCUIT SIMULATOR — CORE LOGIC
   ECE Mini Project: RC / RL / RLC simulation with Chart.js visualization
   No backend — everything runs locally in the browser.
   ===================================================================== */

/* ---------------------- DOM REFERENCES ---------------------- */
const circuitTypeEl   = document.getElementById('circuitType');
const resistanceEl    = document.getElementById('resistance');
const capacitanceEl   = document.getElementById('capacitance');
const inductanceEl    = document.getElementById('inductance');
const voltageEl       = document.getElementById('voltage');
const frequencyEl     = document.getElementById('frequency');

const resistanceSlider  = document.getElementById('resistanceSlider');
const capacitanceSlider = document.getElementById('capacitanceSlider');
const inductanceSlider  = document.getElementById('inductanceSlider');
const voltageSlider     = document.getElementById('voltageSlider');

const simulateBtn     = document.getElementById('simulateBtn');
const resetBtn        = document.getElementById('resetBtn');
const exportBtn       = document.getElementById('exportBtn');
const spinner         = document.getElementById('spinner');
const simulateBtnText = document.getElementById('simulateBtnText');
const statusPill      = document.getElementById('statusPill');
const inputError      = document.getElementById('inputError');

const graphTitle    = document.getElementById('graphTitle');
const circuitBadge  = document.getElementById('circuitBadge');
const equationsBox  = document.getElementById('equationsBox');

const resTau    = document.getElementById('resTau');
const resFreq   = document.getElementById('resFreq');
const resSteady = document.getElementById('resSteady');
const resQ      = document.getElementById('resQ');

const themeToggle = document.getElementById('themeToggle');

const ctx = document.getElementById('waveformChart').getContext('2d');

/* ---------------------- CHART INSTANCE ---------------------- */
let waveformChart = null;

/* Colour per circuit type (used for the line + glow) */
const CIRCUIT_COLORS = {
  RC:  { line: '#22d3ee', fill: 'rgba(34,211,238,0.15)' },
  RL:  { line: '#3b82f6', fill: 'rgba(59,130,246,0.15)' },
  RLC: { line: '#a78bfa', fill: 'rgba(167,139,250,0.15)' }
};

/* =====================================================================
   FIELD VISIBILITY — show only the inputs relevant to the chosen circuit
   ===================================================================== */
function updateFieldVisibility() {
  const type = circuitTypeEl.value;
  const map = {
    RC:  ['R', 'C', 'V'],
    RL:  ['R', 'L', 'V'],
    RLC: ['R', 'L', 'C', 'F']
  };
  const visible = map[type];

  document.querySelectorAll('.field[data-field]').forEach(field => {
    const key = field.getAttribute('data-field');
    field.classList.toggle('field-hidden', !visible.includes(key));
  });

  circuitBadge.textContent =
    type === 'RC' ? 'RC LOW-PASS' : type === 'RL' ? 'RL CIRCUIT' : 'RLC FILTER';

  graphTitle.textContent =
    type === 'RLC' ? 'Frequency Response' : 'Time-Domain Response';

  updateEquationsBox(type);
}

function updateEquationsBox(type) {
  if (type === 'RC') {
    equationsBox.textContent =
      'τ = R × C\nVout(t) = Vin × (1 − e^(−t/τ))\nfc = 1 / (2πRC)';
  } else if (type === 'RL') {
    equationsBox.textContent =
      'τ = L / R\nV(t) = Vin × (1 − e^(−t/τ))\nfc = R / (2πL)';
  } else {
    equationsBox.textContent =
      'f0 = 1 / (2π√(LC))\nQ = (1/R) × √(L/C)\n|H(jω)| = 1 / √((1−ω²LC)² + (ωRC)²)';
  }
}

/* =====================================================================
   INPUT SYNC — keep number fields and range sliders in sync
   ===================================================================== */
function linkSlider(numberEl, sliderEl) {
  numberEl.addEventListener('input', () => { sliderEl.value = numberEl.value; });
  sliderEl.addEventListener('input', () => { numberEl.value = sliderEl.value; });
}
linkSlider(resistanceEl, resistanceSlider);
linkSlider(capacitanceEl, capacitanceSlider);
linkSlider(inductanceEl, inductanceSlider);
linkSlider(voltageEl, voltageSlider);

/* =====================================================================
   VALIDATION
   ===================================================================== */
function validateInputs(type) {
  const R = parseFloat(resistanceEl.value);
  const C = parseFloat(capacitanceEl.value);
  const L = parseFloat(inductanceEl.value);
  const V = parseFloat(voltageEl.value);
  const F = parseFloat(frequencyEl.value);

  const needed = {
    RC:  { R, C, V },
    RL:  { R, L, V },
    RLC: { R, L, C, F }
  }[type];

  for (const [key, val] of Object.entries(needed)) {
    if (isNaN(val) || val <= 0) {
      return `Please enter a valid positive value for ${key}.`;
    }
  }
  return null;
}

/* =====================================================================
   CIRCUIT CALCULATIONS
   Values entered in convenient units are converted to SI units:
   Capacitance: µF -> F   |   Inductance: mH -> H
   ===================================================================== */

function calculateRC() {
  const R = parseFloat(resistanceEl.value);
  const C = parseFloat(capacitanceEl.value) * 1e-6;
  const V = parseFloat(voltageEl.value);

  const tau = R * C;                       // time constant (s)
  const fc = 1 / (2 * Math.PI * tau);      // cutoff frequency (Hz)

  const points = 200;
  const tMax = 5 * tau;                    // simulate ~5 time constants
  const time = [];
  const output = [];

  for (let i = 0; i <= points; i++) {
    const t = (tMax / points) * i;
    const vOut = V * (1 - Math.exp(-t / tau));
    time.push(t);
    output.push(vOut);
  }

  return {
    time, output,
    tau, fc,
    steady: V,
    q: null,
    xLabel: 'Time (s)', yLabel: 'Voltage (V)',
    logX: false
  };
}

function calculateRL() {
  const R = parseFloat(resistanceEl.value);
  const L = parseFloat(inductanceEl.value) * 1e-3;
  const V = parseFloat(voltageEl.value);

  const tau = L / R;                        // time constant (s)
  const fc = R / (2 * Math.PI * L);         // characteristic cutoff frequency (Hz)

  const points = 200;
  const tMax = 5 * tau;
  const time = [];
  const output = [];

  for (let i = 0; i <= points; i++) {
    const t = (tMax / points) * i;
    const vOut = V * (1 - Math.exp(-t / tau)); // voltage across R as current builds
    time.push(t);
    output.push(vOut);
  }

  return {
    time, output,
    tau, fc,
    steady: V,
    q: null,
    xLabel: 'Time (s)', yLabel: 'Voltage (V)',
    logX: false
  };
}

function calculateRLC() {
  const R = parseFloat(resistanceEl.value);
  const L = parseFloat(inductanceEl.value) * 1e-3;
  const C = parseFloat(capacitanceEl.value) * 1e-6;
  const fMax = parseFloat(frequencyEl.value);

  const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));  // resonant frequency (Hz)
  const Q = (1 / R) * Math.sqrt(L / C);              // quality factor

  const points = 300;
  const fMin = 1;
  const time = [];   // holds frequency values here (reused field name for chart x-axis)
  const output = []; // holds |H(jw)| magnitude in dB

  for (let i = 0; i <= points; i++) {
    // logarithmic sweep from fMin to fMax
    const logF = Math.log10(fMin) + (Math.log10(fMax) - Math.log10(fMin)) * (i / points);
    const f = Math.pow(10, logF);
    const w = 2 * Math.PI * f;

    const magnitude = 1 / Math.sqrt(
      Math.pow(1 - w * w * L * C, 2) + Math.pow(w * R * C, 2)
    );
    const magnitudeDb = 20 * Math.log10(magnitude);

    time.push(f);
    output.push(magnitudeDb);
  }

  return {
    time, output,
    tau: null,
    fc: f0,
    steady: null,
    q: Q,
    xLabel: 'Frequency (Hz)', yLabel: 'Magnitude (dB)',
    logX: true
  };
}

/* =====================================================================
   GRAPH RENDERING
   ===================================================================== */
function updateGraph(result, type) {
  const colors = CIRCUIT_COLORS[type];

  const chartData = {
    labels: result.time,
    datasets: [{
      label: type === 'RLC' ? 'Frequency Response |H(jω)|' : 'Output Response',
      data: result.output,
      borderColor: colors.line,
      backgroundColor: colors.fill,
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      borderWidth: 2.5
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: 'easeOutQuart' },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10,20,35,0.9)',
        titleColor: '#22d3ee',
        bodyColor: '#e7edf7',
        borderColor: 'rgba(34,211,238,0.3)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: (items) => {
            const v = items[0].parsed.x;
            return type === 'RLC' ? `f = ${v.toFixed(1)} Hz` : `t = ${v.toExponential(2)} s`;
          }
        }
      }
    },
    scales: {
      x: {
        type: result.logX ? 'logarithmic' : 'linear',
        title: { display: true, text: result.xLabel, color: '#93a4c3' },
        ticks: { color: '#93a4c3', maxTicksLimit: 8 },
        grid: { color: 'rgba(148,163,184,0.08)' }
      },
      y: {
        title: { display: true, text: result.yLabel, color: '#93a4c3' },
        ticks: { color: '#93a4c3' },
        grid: { color: 'rgba(148,163,184,0.08)' }
      }
    }
  };

  if (waveformChart) {
    waveformChart.data = chartData;
    waveformChart.options = options;
    waveformChart.update();
  } else {
    waveformChart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options
    });
  }
}

/* =====================================================================
   RESULTS DISPLAY
   ===================================================================== */
function displayResults(result) {
  resTau.textContent    = result.tau !== null ? `${formatSI(result.tau)}s` : '—';
  resFreq.textContent   = result.fc !== null ? `${formatSI(result.fc)}Hz` : '—';
  resSteady.textContent = result.steady !== null ? `${result.steady.toFixed(2)} V` : '—';
  resQ.textContent      = result.q !== null ? result.q.toFixed(2) : '—';
}

/* Format small/large numbers using SI-style prefixes for readability */
function formatSI(value) {
  if (value >= 1000) return (value / 1000).toFixed(2) + ' k';
  if (value >= 1) return value.toFixed(3) + ' ';
  if (value >= 1e-3) return (value * 1e3).toFixed(2) + ' m';
  if (value >= 1e-6) return (value * 1e6).toFixed(2) + ' µ';
  return value.toExponential(2) + ' ';
}

/* =====================================================================
   SIMULATE — main entry point triggered by the Simulate button
   ===================================================================== */
function runSimulation() {
  const type = circuitTypeEl.value;
  const error = validateInputs(type);

  if (error) {
    inputError.textContent = error;
    return;
  }
  inputError.textContent = '';

  setBusyState(true);

  // Small delay to show the loading animation — simulates "computation"
  setTimeout(() => {
    let result;
    if (type === 'RC') result = calculateRC();
    else if (type === 'RL') result = calculateRL();
    else result = calculateRLC();

    updateGraph(result, type);
    displayResults(result);
    setBusyState(false);
  }, 350);
}

function setBusyState(isBusy) {
  simulateBtn.disabled = isBusy;
  spinner.hidden = !isBusy;
  simulateBtnText.textContent = isBusy ? 'Simulating…' : 'Simulate';
  statusPill.classList.toggle('busy', isBusy);
  statusPill.innerHTML = isBusy
    ? '<span class="dot"></span> Computing'
    : '<span class="dot"></span> Ready';
}

/* =====================================================================
   RESET — restore default values and clear the chart
   ===================================================================== */
function resetSimulation() {
  circuitTypeEl.value = 'RC';
  resistanceEl.value = 1000;  resistanceSlider.value = 1000;
  capacitanceEl.value = 10;   capacitanceSlider.value = 10;
  inductanceEl.value = 100;   inductanceSlider.value = 100;
  voltageEl.value = 5;        voltageSlider.value = 5;
  frequencyEl.value = 10000;

  inputError.textContent = '';
  updateFieldVisibility();

  resTau.textContent = '—';
  resFreq.textContent = '—';
  resSteady.textContent = '—';
  resQ.textContent = '—';

  if (waveformChart) {
    waveformChart.destroy();
    waveformChart = null;
  }
}

/* =====================================================================
   EXPORT GRAPH — download the current chart as a PNG image
   ===================================================================== */
function exportGraph() {
  if (!waveformChart) {
    inputError.textContent = 'Run a simulation before exporting the graph.';
    return;
  }
  const link = document.createElement('a');
  link.download = `circuit-simulation-${circuitTypeEl.value.toLowerCase()}.png`;
  link.href = waveformChart.toBase64Image();
  link.click();
}

/* =====================================================================
   THEME TOGGLE — dark / light mode
   ===================================================================== */
function toggleTheme() {
  const body = document.body;
  const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  body.setAttribute('data-theme', next);
}

/* =====================================================================
   EVENT LISTENERS
   ===================================================================== */
circuitTypeEl.addEventListener('change', updateFieldVisibility);
simulateBtn.addEventListener('click', runSimulation);
resetBtn.addEventListener('click', resetSimulation);
exportBtn.addEventListener('click', exportGraph);
themeToggle.addEventListener('click', toggleTheme);

/* =====================================================================
   INITIALISE ON LOAD
   ===================================================================== */
updateFieldVisibility();
runSimulation();