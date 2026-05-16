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
// Helper to destroy existing chart instances (useful for hot‑reload)
function destroyIfExists(name) {
  const instance = window[name];
  if (instance instanceof Chart && typeof instance.destroy === "function") {
    instance.destroy();
  }
}

// Initialize the 4 charts
function initCharts() {
  ["chartConvergence", "chartNoise", "chartSecurityTax", "chartBandwidth"].forEach(destroyIfExists);

  // Federated Convergence (Dual Y-Axis Line Chart)
  window.chartConvergence = new Chart(document.getElementById("chartConvergence"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Accuracy", yAxisID: "y", borderColor: "#003366", data: [], tension: 0.2 },
        { label: "Loss", yAxisID: "y1", borderColor: "#808080", borderDash: [6,4], data: [], tension: 0.2 }
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

  // Noise Budget Decay (Line Chart)
  window.chartNoise = new Chart(document.getElementById("chartNoise"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Noise Budget", borderColor: "#FF8C00", data: [], tension: 0.2, fill: true, backgroundColor: "rgba(255, 140, 0, 0.2)" }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { min: 0, max: 45, title: { display: true, text: "Noise Budget" } },
        x: { title: { display: true, text: "Round Number" } }
      },
      plugins: {
        annotation: {
          annotations: [{
            type: "line",
            yMin: 5,
            yMax: 5,
            borderColor: "red",
            borderWidth: 2,
            label: { content: "Critical Threshold", enabled: true, position: "end" }
          }]
        }
      }
    }
  });

  // Security Tax Latency (Stacked Bar Chart)
  window.chartSecurityTax = new Chart(document.getElementById("chartSecurityTax"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        { label: "Local Training", backgroundColor: "#003366", data: [] },
        { label: "Encryption Overhead", backgroundColor: "#FF8C00", data: [] },
        { label: "Signing Overhead", backgroundColor: "#808080", data: [] }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Round Number" } },
        y: { stacked: true, title: { display: true, text: "Latency (ms)" } }
      }
    }
  });

  // Bandwidth Optimization (Grouped Bar Chart)
  window.chartBandwidth = new Chart(document.getElementById("chartBandwidth"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        { label: "Raw Payload", backgroundColor: "#808080", data: [] },
        { label: "Compressed Payload", backgroundColor: "#003366", data: [] }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Round Number" } },
        y: { title: { display: true, text: "Payload Size (KB)" } }
      }
    }
  });
}

// Update syncMetrics for 4-plot layout
async function syncMetrics() {
  try {
    const rows = await PqcApi.fetchMetrics();
    rows.forEach(row => {
      const round = parseInt(row.round_number, 10);
      if (!window.chartConvergence.data.labels.includes(round)) {
        // Federated Convergence
        window.chartConvergence.data.labels.push(round);
        window.chartConvergence.data.datasets[0].data.push(parseFloat(row.accuracy));
        window.chartConvergence.data.datasets[1].data.push(parseFloat(row.loss));
        window.chartConvergence.update('none');

        // Noise Budget Decay
        window.chartNoise.data.labels.push(round);
        window.chartNoise.data.datasets[0].data.push(parseFloat(row.noise_budget));
        window.chartNoise.update('none');

        // Security Tax Latency
        window.chartSecurityTax.data.labels.push(round);
        window.chartSecurityTax.data.datasets[0].data.push(parseFloat(row.local_training));
        window.chartSecurityTax.data.datasets[1].data.push(parseFloat(row.encryption_overhead));
        window.chartSecurityTax.data.datasets[2].data.push(parseFloat(row.signing_overhead));
        window.chartSecurityTax.update('none');

        // Bandwidth Optimization
        window.chartBandwidth.data.labels.push(round);
        window.chartBandwidth.data.datasets[0].data.push(parseFloat(row.raw_payload));
        window.chartBandwidth.data.datasets[1].data.push(parseFloat(row.compressed_payload));
        window.chartBandwidth.update('none');
      }
    });
  } catch (e) {
    console.error("Failed to sync metrics:", e);
  }
}

// Boot the dashboard
function boot() {
  console.info("Dashboard API:", PqcApi.API_BASE_URL);
  initCharts();
  syncMetrics();
  setInterval(syncMetrics, 6000);
}

boot();
