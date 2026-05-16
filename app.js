// PQC Federated Dashboard — Unified Production Core UI

// Color palette
const DEEP_BLUE = "#003366";
const SECURITY_ORANGE = "#FF8C00";
const NEUTRAL_GRAY = "#808080";
const DANGER_RED = "#C62828";

// Global chart variables
let chartPlot01, chartPlot02, chartPlot03, chartPlot04, chartPlot05,
    chartPlot06, chartPlot07, chartPlot08, chartPlot09, chartPlot10;

// Utility logging
function log(msg, kind = "info") {
  const container = document.getElementById("logs");
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.dataset.kind = kind;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  container.prepend(entry);
  while (container.children.length > 100) container.removeChild(container.lastChild);
}

function setCoordinatorStatus(text, className) {
  const el = document.getElementById("status");
  if (el) { el.innerText = text; el.className = className; }
}

function updateLatestMetrics(rows) {
  if (!rows || !rows.length) return;
  const latest = rows[rows.length - 1];
  const setIf = (id, value, fmt) => { const el = document.getElementById(id); if (el) el.textContent = fmt(parseFloat(value || 0)); };
  setIf("latestAccuracy", latest.accuracy, v => v.toFixed(4));
  setIf("latestLoss", latest.loss, v => v.toFixed(4));
  setIf("latestNoise", latest.noise_budget, v => v.toFixed(2));
  setIf("latestBandwidth", latest.bandwidth_kb, v => v.toFixed(2));
}

// Helper to destroy existing chart instances (useful for hot‑reload)
function destroyIfExists(name) { if (window[name]) window[name].destroy(); }

function initCharts() {
  // Ensure previous instances are cleaned
  ["chartPlot01","chartPlot02","chartPlot03","chartPlot04","chartPlot05",
   "chartPlot06","chartPlot07","chartPlot08","chartPlot09","chartPlot10"].forEach(destroyIfExists);

  // 01 – Utility Integrity (Scatter)
  chartPlot01 = new Chart(document.getElementById("chartPlot01"), {
    type: "scatter",
    data: {
      datasets: [
        { label: "Plaintext vs Decrypted", data: [], backgroundColor: SECURITY_ORANGE },
        { label: "y = x reference", data: [], type: "line", borderColor: "orange", borderDash: [6,4], fill: false }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Plaintext Weights" } },
        y: { title: { display: true, text: "Decrypted Weights" } }
      }
    }
  });

  // 02 – Federated Convergence Curve (Accuracy & Loss)
  chartPlot02 = new Chart(document.getElementById("chartPlot02"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Test Accuracy", yAxisID: "y", borderColor: DEEP_BLUE, data: [], tension: 0.2 },
        { label: "Cross‑Entropy Loss", yAxisID: "y1", borderColor: NEUTRAL_GRAY, borderDash: [6,4], data: [], tension: 0.2 }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { min: 0.5, max: 1.0, title: { display: true, text: "Accuracy" } },
        y1: { position: "right", min: 0, max: 1.0, title: { display: true, text: "Loss" }, grid: { drawOnChartArea: false } }
      }
    }
  });

  // 03 – Fraud Detection Precision‑Recall Baseline
  chartPlot03 = new Chart(document.getElementById("chartPlot03"), {
    type: "line",
    data: { labels: [], datasets: [{ label: "Precision‑Recall", borderColor: SECURITY_ORANGE, backgroundColor: "rgba(255,140,0,0.15)", fill: true, data: [], tension: 0.2 }] },
    options: { responsive: true, scales: { x: { title: { display: true, text: "Recall" }, min: 0, max: 1 }, y: { title: { display: true, text: "Precision" }, min: 0, max: 1 } } }
  });

  // 04 – Security Tax (Stacked Bar – Latency Breakdown)
  chartPlot04 = new Chart(document.getElementById("chartPlot04"), {
    type: "bar",
    data: { labels: [], datasets: [
      { label: "Training (est.)", backgroundColor: DEEP_BLUE, data: [] },
      { label: "HE Encryption / Aggregation", backgroundColor: SECURITY_ORANGE, data: [] },
      { label: "Signing Overhead (est.)", backgroundColor: NEUTRAL_GRAY, data: [] }
    ] },
    options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true, title: { display: true, text: "Time (ms)" } } } }
  });

  // 05 – Bandwidth Optimization (Grouped Bar)
  chartPlot05 = new Chart(document.getElementById("chartPlot05"), {
    type: "bar",
    data: { labels: [], datasets: [
      { label: "Raw Ciphertext", backgroundColor: NEUTRAL_GRAY, data: [] },
      { label: "Compressed (est.)", backgroundColor: DEEP_BLUE, data: [] }
    ] },
    options: { responsive: true, scales: { x: { stacked: false, title: { display: true, text: "Round" } }, y: { title: { display: true, text: "Size (KB)" } } } }
  });

  // 06 – Noise Budget Decay (Line + Threshold + Shaded Area)
  chartPlot06 = new Chart(document.getElementById("chartPlot06"), {
    type: "line",
    data: { labels: [], datasets: [
      { label: "Remaining Noise Budget", borderColor: DEEP_BLUE, backgroundColor: "rgba(0,51,102,0.12)", fill: true, data: [] },
      { label: "Failure Threshold", borderColor: DANGER_RED, borderDash: [8,4], pointRadius: 0, data: [] }
    ] },
    options: { responsive: true, scales: { y: { min: 0, max: 45, title: { display: true, text: "Remaining budget" } } } }
  });

  // 07 – Impact of SMOTE on Fraud Recall (Bar)
  chartPlot07 = new Chart(document.getElementById("chartPlot07"), {
    type: "bar",
    data: { labels: ["Federated Vanilla", "Federated SMOTE"], datasets: [{ label: "Fraud recall", backgroundColor: [NEUTRAL_GRAY, SECURITY_ORANGE], data: [0,0] }] },
    options: { responsive: true, scales: { y: { min: 0, max: 1.05, title: { display: true, text: "Recall" } } } }
  });

  // 08 – Server‑Side Scalability (Line)
  chartPlot08 = new Chart(document.getElementById("chartPlot08"), {
    type: "line",
    data: { labels: [], datasets: [{ label: "Aggregation Time (ms)", borderColor: DEEP_BLUE, data: [] }] },
    options: { responsive: true, scales: { x: { title: { display: true, text: "Connected Clients" } }, y: { title: { display: true, text: "Time (ms)" } } } }
  });

  // 09 – DP Privacy‑Utility Trade‑off (Line with markers)
  chartPlot09 = new Chart(document.getElementById("chartPlot09"), {
    type: "line",
    data: { labels: [], datasets: [{ label: "Accuracy", borderColor: SECURITY_ORANGE, backgroundColor: "rgba(255,140,0,0.15)", fill: true, data: [] }] },
    options: { responsive: true, scales: { x: { title: { display: true, text: "Epsilon" } }, y: { min: 0, max: 1.05, title: { display: true, text: "Accuracy" } } } }
  });

  // 10 – Entropy of Blindness (Zero‑spacing Histogram)
  chartPlot10 = new Chart(document.getElementById("chartPlot10"), {
    type: "bar",
    data: { labels: [], datasets: [
      { label: "Plaintext Weights", backgroundColor: "rgba(0,51,102,0.6)", data: [] },
      { label: "Ciphertext u mod q", backgroundColor: "rgba(255,140,0,0.4)", data: [] }
    ] },
    options: { responsive: true, scales: { x: { title: { display: true, text: "Value" }, stacked: false }, y: { title: { display: true, text: "Frequency" }, stacked: false } } }
  });
}

// ---------- Render Functions (live‑rolling data) ----------
function renderConvergenceChart(rows) {
  if (!rows || !rows.length) return;
  const labels = rows.map(r => String(parseInt(r.round_number)));
  const acc = rows.map(r => parseFloat(r.accuracy));
  const loss = rows.map(r => parseFloat(r.loss));
  chartPlot02.data.labels = labels;
  chartPlot02.data.datasets[0].data = acc;
  chartPlot02.data.datasets[1].data = loss;
  chartPlot02.update();
}

function renderLatencyChart(rows) {
  if (!rows || !rows.length) return;
  const labels = rows.map(r => String(parseInt(r.round_number)));
  const training = rows.map(r => parseFloat(r.latency_training));
  const he = rows.map(r => parseFloat(r.latency_he));
  const signing = rows.map(r => parseFloat(r.latency_signing));
  chartPlot04.data.labels = labels;
  chartPlot04.data.datasets[0].data = training;
  chartPlot04.data.datasets[1].data = he;
  chartPlot04.data.datasets[2].data = signing;
  chartPlot04.update();
}

function renderBandwidthChart(rows) {
  if (!rows || !rows.length) return;
  const labels = rows.map(r => String(parseInt(r.round_number)));
  const raw = rows.map(r => parseFloat(r.bandwidth_raw));
  const comp = rows.map(r => parseFloat(r.bandwidth_compressed));
  chartPlot05.data.labels = labels;
  chartPlot05.data.datasets[0].data = raw;
  chartPlot05.data.datasets[1].data = comp;
  chartPlot05.update();
}

function renderNoiseBudgetChart(rows) {
  if (!rows || !rows.length) return;
  const labels = rows.map(r => String(parseInt(r.round_number)));
  const noise = rows.map(r => parseFloat(r.noise_budget));
  const thresh = labels.map(() => 5);
  chartPlot06.data.labels = labels;
  chartPlot06.data.datasets[0].data = noise;
  chartPlot06.data.datasets[1].data = thresh;
  chartPlot06.update();
}

function renderScalabilityChart(rows) {
  if (!rows || !rows.length) return;
  const labels = rows.map(r => String(parseInt(r.client_count)));
  const times = rows.map(r => parseFloat(r.aggregation_time));
  chartPlot08.data.labels = labels;
  chartPlot08.data.datasets[0].data = times;
  chartPlot08.update();
}

// ---------- Snapshot renderers (static per‑round data) ----------
function renderIntegrityChart(payload) {
  if (!payload || !payload.plaintext || !payload.decrypted) return;
  const points = payload.plaintext.map((x,i) => ({ x: parseFloat(x), y: parseFloat(payload.decrypted[i]) }));
  chartPlot01.data.datasets[0].data = points;
  const minVal = Math.min(...points.map(p => Math.min(p.x,p.y)));
  const maxVal = Math.max(...points.map(p => Math.max(p.x,p.y)));
  chartPlot01.data.datasets[1].data = [{ x: minVal, y: minVal }, { x: maxVal, y: maxVal }];
  chartPlot01.update();
}

function renderPrecisionRecallChart(payload) {
  if (!payload || !payload.recall || !payload.precision) return;
  const recall = payload.recall.map(v => parseFloat(v));
  const precision = payload.precision.map(v => parseFloat(v));
  chartPlot03.data.labels = recall;
  chartPlot03.data.datasets[0].data = precision;
  chartPlot03.update();
}

function renderImpactSmoteChart(payload) {
  if (!payload) return;
  const vanilla = parseFloat(payload.vanilla_recall ?? 0.57);
  const smote = parseFloat(payload.smote_recall ?? 0.79);
  chartPlot07.data.datasets[0].data = [vanilla, smote];
  chartPlot07.update();
}

function renderDpTradeoffChart(payload) {
  if (!payload || !payload.points) return;
  const sorted = [...payload.points].sort((a,b) => parseFloat(a.epsilon)-parseFloat(b.epsilon));
  chartPlot09.data.labels = sorted.map(p => String(p.epsilon));
  chartPlot09.data.datasets[0].data = sorted.map(p => parseFloat(p.accuracy));
  chartPlot09.update();
}

function renderEntropyHistogram(payload) {
  if (!payload || !payload.histogram_labels) return;
  chartPlot10.data.labels = payload.histogram_labels.map(l => String(l));
  chartPlot10.data.datasets[0].data = payload.plaintext_freq.map(f => parseFloat(f));
  chartPlot10.data.datasets[1].data = payload.ciphertext_freq.map(f => parseFloat(f));
  chartPlot10.update();
}

// ---------- Data fetching orchestration ----------
async function syncHealth() {
  try {
    const data = await PqcApi.fetchHealth();
    healthFailures = 0;
    if (document.getElementById("round")) document.getElementById("round").textContent = data.round ?? "—";
    if (document.getElementById("clientCount")) document.getElementById("clientCount").textContent = data.clients ?? "—";
    setCoordinatorStatus("ONLINE", "status-online");
  } catch (e) {
    healthFailures = (healthFailures ?? 0) + 1;
    setCoordinatorStatus(healthFailures < 3 ? "BOOTING" : "OFFLINE", healthFailures < 3 ? "status-booting" : "status-offline");
  }
}

async function syncMetrics() {
  try {
    const rows = await PqcApi.fetchMetrics();
    metricsFailures = 0;
    updateLatestMetrics(rows);
    // Live‑rolling charts
    renderConvergenceChart(rows);
    renderLatencyChart(rows);
    renderBandwidthChart(rows);
    renderNoiseBudgetChart(rows);
    renderScalabilityChart(rows);
    // If no data yet, fall back to local artifacts for snapshot charts
    if (!rows || rows.length === 0) syncLocalArtifacts();
  } catch (e) {
    metricsFailures = (metricsFailures ?? 0) + 1;
    syncLocalArtifacts();
  }
}

async function syncLocalArtifacts() {
  const integrity = await PqcApi.fetchLocalArtifact("plots_data_integrity.json");
  if (integrity) renderIntegrityChart(integrity);
  const pr = await PqcApi.fetchLocalArtifact("plots_data_pr.json"); // precision‑recall data
  if (pr) renderPrecisionRecallChart(pr);
  const smote = await PqcApi.fetchLocalArtifact("plots_data_smote.json");
  if (smote) renderImpactSmoteChart(smote);
  const dp = await PqcApi.fetchLocalArtifact("plots_data_dp.json");
  if (dp) renderDpTradeoffChart(dp);
  const entropy = await PqcApi.fetchLocalArtifact("plots_data_entropy.json");
  if (entropy) renderEntropyHistogram(entropy);
}

function boot() {
  console.info("Dashboard API:", PqcApi.API_BASE_URL);
  initCharts();
  syncHealth();
  syncMetrics();
  setInterval(syncHealth, 4000);
  setInterval(syncMetrics, 6000);
}

boot();
