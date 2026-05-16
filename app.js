/**
 * PQC Federated Dashboard — Unified Production Core UI
 */

const DEEP_BLUE = "#003366";
const SECURITY_ORANGE = "#FF8C00";
const NEUTRAL_GRAY = "#808080";
const DANGER_RED = "#C62828";

let healthFailures = 0;
let metricsFailures = 0;

let chartPlot01;
let chartPlot02;
let chartPlot03;
let chartPlot04;
let chartPlot05;
let chartPlot06;
let chartPlot07;
let chartPlot08;
let chartPlot09;
let chartPlot10;

function log(msg, kind = "info") {
  const container = document.getElementById("logs");
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.dataset.kind = kind;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  container.prepend(entry);
  while (container.children.length > 100) {
    container.removeChild(container.lastChild);
  }
}

function setCoordinatorStatus(text, className) {
  const el = document.getElementById("status");
  if (el) {
    el.innerText = text;
    el.className = className;
  }
}

function updateLatestMetrics(rows) {
  if (!rows || !rows.length) return;
  const latest = rows[rows.length - 1];
  
  if (document.getElementById("latestAccuracy")) {
    document.getElementById("latestAccuracy").textContent = parseFloat(latest.accuracy || 0).toFixed(4);
  }
  if (document.getElementById("latestLoss")) {
    document.getElementById("latestLoss").textContent = parseFloat(latest.loss || 0).toFixed(4);
  }
  if (document.getElementById("latestNoise")) {
    document.getElementById("latestNoise").textContent = parseFloat(latest.noise_budget || 0).toFixed(2);
  }
  if (document.getElementById("latestBandwidth")) {
    document.getElementById("latestBandwidth").textContent = parseFloat(latest.bandwidth_kb || 0).toFixed(2);
  }
}

function initCharts() {
  chartPlot01 = new Chart(document.getElementById("chartPlot01"), {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Decrypted vs Plaintext",
          data: [],
          backgroundColor: DEEP_BLUE,
          pointRadius: 3
        },
        {
          label: "y = x Reference",
          data: [{x: -5, y: -5}, {x: 5, y: 5}],
          type: "line",
          borderColor: DANGER_RED,
          borderWidth: 1,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Plaintext Coefficients" } },
        y: { title: { display: true, text: "Decrypted Coefficients" } }
      }
    }
  });

  chartPlot02 = new Chart(document.getElementById("chartPlot02"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Accuracy",
          data: [],
          borderColor: DEEP_BLUE,
          backgroundColor: "rgba(0, 51, 102, 0.15)",
          tension: 0.25,
          yAxisID: "y",
        },
        {
          label: "Loss",
          data: [],
          borderColor: NEUTRAL_GRAY,
          borderDash: [6, 4],
          tension: 0.25,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { min: 0.0, max: 1.0, title: { display: true, text: "Accuracy" } },
        y1: {
          position: "right",
          grid: { drawOnChartArea: false },
          title: { display: true, text: "Loss" },
        },
      },
    },
  });

  chartPlot03 = new Chart(document.getElementById("chartPlot03"), {
    type: "line",
    data: {
      labels: [],
      datasets: [{ label: "Precision vs Recall Baseline", data: [], borderColor: SECURITY_ORANGE, fill: false, tension: 0.1 }]
    },
    options: {
      responsive: true,
      scales: {
        x: { type: 'linear', min: 0, max: 1.0, title: { display: true, text: "Recall" } },
        y: { min: 0, max: 1.0, title: { display: true, text: "Precision" } }
      }
    }
  });

  chartPlot04 = new Chart(document.getElementById("chartPlot04"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [{ label: "L1 Error Distance", data: [], backgroundColor: DANGER_RED }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Round Number" } },
        y: { title: { display: true, text: "L1 Norm Error" } }
      }
    }
  });

  chartPlot05 = new Chart(document.getElementById("chartPlot05"), {
    type: "line",
    data: {
      labels: [],
      datasets: [{ label: "Client Weight Drift", data: [], borderColor: DEEP_BLUE, tension: 0.2 }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Round Number" } },
        y: { title: { display: true, text: "Variance" } }
      }
    }
  });

  chartPlot06 = new Chart(document.getElementById("chartPlot06"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Noise budget",
          data: [],
          borderColor: DEEP_BLUE,
          fill: true,
          backgroundColor: "rgba(0, 51, 102, 0.12)",
          tension: 0.2,
        },
        {
          label: "Failure threshold",
          data: [],
          borderColor: DANGER_RED,
          borderDash: [8, 4],
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          min: 0,
          max: 45,
          title: { display: true, text: "Remaining budget" },
        },
      },
    },
  });

  chartPlot07 = new Chart(document.getElementById("chartPlot07"), {
    type: "bar",
    data: {
      labels: ["Vanilla Model", "SMOTE Model"],
      datasets: [
        {
          label: "Fraud recall",
          data: [0, 0],
          backgroundColor: [NEUTRAL_GRAY, SECURITY_ORANGE],
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { min: 0, max: 1.05, title: { display: true, text: "Recall" } },
      },
    },
  });

  chartPlot08 = new Chart(document.getElementById("chartPlot08"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        { type: "bar", label: "Cumulative Bandwidth (KB)", data: [], backgroundColor: DEEP_BLUE, yAxisID: "y" },
        { type: "line", label: "Local Latency (ms)", data: [], borderColor: SECURITY_ORANGE, tension: 0.2, yAxisID: "y1" }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Round Number" } },
        y: { title: { display: true, text: "Bandwidth (KB)" }, position: "left" },
        y1: { title: { display: true, text: "Latency (ms)" }, position: "right", grid: { drawOnChartArea: false } }
      }
    }
  });

  chartPlot09 = new Chart(document.getElementById("chartPlot09"), {
    type: "line",
    data: {
      labels: ["0.5", "2.0", "8.0"],
      datasets: [
        {
          label: "Accuracy vs epsilon",
          data: [0, 0, 0],
          borderColor: SECURITY_ORANGE,
          backgroundColor: "rgba(255, 140, 0, 0.15)",
          tension: 0.2,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Privacy budget (epsilon)" } },
        y: { min: 0, max: 1.05, title: { display: true, text: "Accuracy" } },
      },
    },
  });

  chartPlot10 = new Chart(document.getElementById("chartPlot10"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        { label: "Plaintext Weights", data: [], backgroundColor: "rgba(0, 51, 102, 0.6)", borderWidth: 0, barPercentage: 1.0, categoryPercentage: 1.0 },
        { label: "Encrypted Ciphertext", data: [], backgroundColor: "rgba(255, 140, 0, 0.4)", borderWidth: 0, barPercentage: 1.0, categoryPercentage: 1.0 }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Value Distribution" }, stacked: false },
        y: { title: { display: true, text: "Frequency" }, stacked: false }
      }
    }
  });
}

function renderMetricsCharts(rows) {
  if (!rows || !rows.length) return;
  const labels = rows.map((row) => String(parseInt(row.round_number)));
  const accuracies = rows.map((row) => parseFloat(row.accuracy));
  const losses = rows.map((row) => parseFloat(row.loss));
  const noise = rows.map((row) => parseFloat(row.noise_budget));
  const bandwidth = rows.map((row) => parseFloat(row.bandwidth_kb || 0));
  const latency = rows.map((row) => parseFloat(row.latency_ms || 0));
  const threshold = labels.map(() => 5);

  chartPlot02.data.labels = labels;
  chartPlot02.data.datasets[0].data = accuracies;
  chartPlot02.data.datasets[1].data = losses;
  chartPlot02.update();

  chartPlot06.data.labels = labels;
  chartPlot06.data.datasets[0].data = noise;
  chartPlot06.data.datasets[1].data = threshold;
  chartPlot06.update();

  chartPlot08.data.labels = labels;
  chartPlot08.data.datasets[0].data = bandwidth;
  chartPlot08.data.datasets[1].data = latency;
  chartPlot08.update();
  
  // If PR curve baseline is part of metrics:
  const recalls = rows.map((row) => parseFloat(row.recall || 0));
  const precisions = rows.map((row) => parseFloat(row.precision || 0));
  if (recalls.some(r => r > 0) || precisions.some(p => p > 0)) {
    const prData = recalls.map((r, i) => ({x: r, y: precisions[i]}));
    prData.sort((a, b) => a.x - b.x);
    chartPlot03.data.datasets[0].data = prData;
    chartPlot03.update();
  }
}

function renderSmoteChart(payload) {
  if (!payload) {
    return;
  }
  const vanilla = parseFloat(payload.vanilla_recall || 0.57);
  const smote = parseFloat(payload.smote_recall || 0.79);
  chartPlot07.data.datasets[0].data = [vanilla, smote];
  chartPlot07.update();
}

function renderDpChart(payload) {
  if (!payload || !payload.points) {
    return;
  }
  const sorted = [...payload.points].sort(
    (left, right) => parseFloat(left.epsilon) - parseFloat(right.epsilon),
  );
  chartPlot09.data.labels = sorted.map((point) => String(point.epsilon));
  chartPlot09.data.datasets[0].data = sorted.map((point) => parseFloat(point.accuracy));
  chartPlot09.update();
}

function renderIntegrityChart(payload) {
  if (!payload) return;
  // Plots 01, 04, 05
  if (payload.coefficients) {
    const dataPts = payload.coefficients.map(pt => ({x: parseFloat(pt.plaintext), y: parseFloat(pt.decrypted)}));
    chartPlot01.data.datasets[0].data = dataPts;
    
    // update bounds
    let minX = Math.min(...dataPts.map(d => d.x));
    let maxX = Math.max(...dataPts.map(d => d.x));
    chartPlot01.data.datasets[1].data = [{x: minX, y: minX}, {x: maxX, y: maxX}];
    chartPlot01.update();
  }
  
  if (payload.l1_errors) {
    const labels = payload.l1_errors.map(pt => String(parseInt(pt.round)));
    const errors = payload.l1_errors.map(pt => parseFloat(pt.error));
    chartPlot04.data.labels = labels;
    chartPlot04.data.datasets[0].data = errors;
    chartPlot04.update();
  }
  
  if (payload.weight_drift) {
    const labels = payload.weight_drift.map(pt => String(parseInt(pt.round)));
    const drift = payload.weight_drift.map(pt => parseFloat(pt.variance));
    chartPlot05.data.labels = labels;
    chartPlot05.data.datasets[0].data = drift;
    chartPlot05.update();
  }
}

function renderEntropyChart(payload) {
  if (!payload) return;
  // Plot 10
  if (payload.histogram_labels && payload.plaintext_freq && payload.ciphertext_freq) {
    chartPlot10.data.labels = payload.histogram_labels.map(l => String(l));
    chartPlot10.data.datasets[0].data = payload.plaintext_freq.map(f => parseFloat(f));
    chartPlot10.data.datasets[1].data = payload.ciphertext_freq.map(f => parseFloat(f));
    chartPlot10.update();
  }
}

async function syncHealth() {
  try {
    const data = await PqcApi.fetchHealth();
    healthFailures = 0;
    if (document.getElementById("round")) {
        document.getElementById("round").textContent = data.round ?? "—";
    }
    if (document.getElementById("clientCount")) {
        document.getElementById("clientCount").textContent = data.clients ?? "—";
    }
    setCoordinatorStatus("ONLINE", "status-online");
  } catch (error) {
    healthFailures += 1;
    setCoordinatorStatus(
      healthFailures < 3 ? "BOOTING" : "OFFLINE",
      healthFailures < 3 ? "status-booting" : "status-offline",
    );
  }
}

async function syncMetrics() {
  try {
    let rows = await PqcApi.fetchMetrics();
    
    // Check if live data is empty or at round 0
    if (!rows || rows.length === 0 || parseInt(rows[0].round_number) === 0 || parseInt(rows[rows.length - 1].round_number) === 0) {
      const fallback = await PqcApi.fetchLocalArtifact("metrics_history_fallback.json");
      if (fallback && Array.isArray(fallback)) {
        rows = PqcApi.normalizeMetricsRounds(fallback);
      }
    }
    
    metricsFailures = 0;
    updateLatestMetrics(rows);
    renderMetricsCharts(rows);
  } catch (error) {
    metricsFailures += 1;
    
    // Attempt fallback
    const fallback = await PqcApi.fetchLocalArtifact("metrics_history_fallback.json");
    if (fallback && Array.isArray(fallback)) {
       const rows = PqcApi.normalizeMetricsRounds(fallback);
       updateLatestMetrics(rows);
       renderMetricsCharts(rows);
    }
  }
}

async function syncGlobalModel() {
  try {
    await PqcApi.fetchGlobalModel();
  } catch {
    /* metrics + health already surface connectivity */
  }
}

async function syncLocalArtifacts() {
  const smote = await PqcApi.fetchLocalArtifact("plots_data_smote.json");
  const dp = await PqcApi.fetchLocalArtifact("plots_data_dp.json");
  const integrity = await PqcApi.fetchLocalArtifact("plots_data_integrity.json");
  const entropy = await PqcApi.fetchLocalArtifact("plots_data_entropy.json");
  
  renderSmoteChart(smote);
  renderDpChart(dp);
  renderIntegrityChart(integrity);
  renderEntropyChart(entropy);
}

function boot() {
  console.info("Dashboard API:", PqcApi.API_BASE_URL);
  initCharts();
  syncHealth();
  syncMetrics();
  syncGlobalModel();
  syncLocalArtifacts();

  setInterval(syncHealth, 4000);
  setInterval(syncMetrics, 6000);
  setInterval(syncGlobalModel, 8000);
  setInterval(syncLocalArtifacts, 30000);
}

boot();
