/**
 * PQC Federated Dashboard — Unified Production Core UI
 */

const DEEP_BLUE = "#003366";
const SECURITY_ORANGE = "#FF8C00";
const NEUTRAL_GRAY = "#808080";
const DANGER_RED = "#C62828";

let healthFailures = 0;
let metricsFailures = 0;
let chartConvergence;
let chartNoise;
let chartSmote;
let chartDp;

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
  el.innerText = text;
  el.className = className;
}

function updateLatestMetrics(rows) {
  if (!rows.length) return;
  const latest = rows[rows.length - 1];
  document.getElementById("latestAccuracy").textContent = Number(
    latest.accuracy,
  ).toFixed(4);
  document.getElementById("latestLoss").textContent = Number(latest.loss).toFixed(
    4,
  );
  document.getElementById("latestNoise").textContent = Number(
    latest.noise_budget,
  ).toFixed(2);
  document.getElementById("latestBandwidth").textContent = Number(
    latest.bandwidth_kb,
  ).toFixed(2);
}

function initCharts() {
  chartConvergence = new Chart(document.getElementById("chartConvergence"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Test accuracy",
          data: [],
          borderColor: DEEP_BLUE,
          backgroundColor: "rgba(0, 51, 102, 0.15)",
          tension: 0.25,
          yAxisID: "y",
        },
        {
          label: "Test loss",
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
        y: { min: 0.45, max: 1.02, title: { display: true, text: "Accuracy" } },
        y1: {
          position: "right",
          grid: { drawOnChartArea: false },
          title: { display: true, text: "Loss" },
        },
      },
    },
  });

  chartNoise = new Chart(document.getElementById("chartNoise"), {
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

  chartSmote = new Chart(document.getElementById("chartSmote"), {
    type: "bar",
    data: {
      labels: ["Federated Vanilla", "Federated SMOTE"],
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

  chartDp = new Chart(document.getElementById("chartDp"), {
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
}

function renderMetricsCharts(rows) {
  const labels = rows.map((row) => String(row.round_number));
  const accuracies = rows.map((row) => Number(row.accuracy));
  const losses = rows.map((row) => Number(row.loss));
  const noise = rows.map((row) => Number(row.noise_budget));
  const threshold = labels.map(() => 5);

  chartConvergence.data.labels = labels;
  chartConvergence.data.datasets[0].data = accuracies;
  chartConvergence.data.datasets[1].data = losses;
  chartConvergence.update();

  chartNoise.data.labels = labels;
  chartNoise.data.datasets[0].data = noise;
  chartNoise.data.datasets[1].data = threshold;
  chartNoise.update();
}

function renderSmoteChart(payload) {
  if (!payload) {
    log("SMOTE artifact missing — bundle plots_data_smote.json with the dashboard", "warning");
    return;
  }
  const vanilla = Number(payload.vanilla_recall);
  const smote = Number(payload.smote_recall);
  chartSmote.data.datasets[0].data = [vanilla, smote];
  chartSmote.update();
  log(`SMOTE recall lift: ${vanilla.toFixed(2)} → ${smote.toFixed(2)}`);
}

function renderDpChart(payload) {
  if (!payload || !payload.points) {
    log("DP artifact missing — bundle plots_data_dp.json with the dashboard", "warning");
    return;
  }
  const sorted = [...payload.points].sort(
    (left, right) => Number(left.epsilon) - Number(right.epsilon),
  );
  chartDp.data.labels = sorted.map((point) => String(point.epsilon));
  chartDp.data.datasets[0].data = sorted.map((point) => Number(point.accuracy));
  chartDp.update();
  log("DP trade-off curve refreshed (low ε → low accuracy)");
}

async function syncHealth() {
  try {
    const data = await PqcApi.fetchHealth();
    healthFailures = 0;
    document.getElementById("round").textContent = data.round ?? "—";
    document.getElementById("clientCount").textContent = data.clients ?? "—";
    setCoordinatorStatus("ONLINE", "status-online");
    log("Health check passed (/health, no auth token)");
  } catch (error) {
    healthFailures += 1;
    setCoordinatorStatus(
      healthFailures < 3 ? "BOOTING" : "OFFLINE",
      healthFailures < 3 ? "status-booting" : "status-offline",
    );
    if (healthFailures === 1) {
      log("Coordinator unreachable on /health", "warning");
    }
  }
}

async function syncMetrics() {
  try {
    const rows = await PqcApi.fetchMetrics();
    metricsFailures = 0;
    updateLatestMetrics(rows);
    renderMetricsCharts(rows);
    log(`Metrics synced — ${rows.length} rounds (merged by round_number)`);
  } catch (error) {
    metricsFailures += 1;
    if (metricsFailures === 1) {
      log("Metrics fetch failed — verify X-Client-Token", "warning");
    }
  }
}

async function syncGlobalModel() {
  try {
    const data = await PqcApi.fetchGlobalModel();
    if (data.ciphertext_u && data.ciphertext_v) {
      log(`Global ciphertext available for round ${data.round}`);
    } else {
      log(`Round ${data.round}: ${data.message || "awaiting aggregation"}`);
    }
  } catch {
    /* metrics + health already surface connectivity */
  }
}

async function syncLocalArtifacts() {
  const smote = await PqcApi.fetchLocalArtifact("plots_data_smote.json");
  const dp = await PqcApi.fetchLocalArtifact("plots_data_dp.json");
  renderSmoteChart(smote);
  renderDpChart(dp);
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
