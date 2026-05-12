const API_BASE_URL =
  window.__API_BASE_URL__ ||
  "https://pq-federated-coordinator-v3.onrender.com";
const MODEL_ENDPOINT = `${API_BASE_URL}/global_model`;
const METRICS_ENDPOINT = `${API_BASE_URL}/metrics`;
const BLINDNESS_ENDPOINT = `${API_BASE_URL}/api/verify_blindness`;
const HEALTH_ENDPOINT = `${API_BASE_URL}/health`;

let globalCiphertext = { u: [], v: [] };
let ciphertextTupleBytes = 0;
let coordinatorHealthy = false;

const EXPECTED_CLIENTS = 2;
const PRECISION = 6;
const HIGH_ENTROPY_THRESHOLD = 6.5;

/* ---------------- LOGGING ---------------- */

function log(msg, kind = "info") {
  const container = document.getElementById("logs");

  const entry = document.createElement("div");

  entry.className = "log-entry";
  entry.dataset.kind = kind;

  entry.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}`;

  container.prepend(entry);
}

function clearTransientWarnings() {
  document
    .querySelectorAll('.log-entry[data-kind="warning"]')
    .forEach((entry) => {
      const text = entry.textContent || "";
      if (
        text.includes("Coordinator unreachable") ||
        text.includes("Metrics unavailable")
      ) {
        entry.remove();
      }
    });
}

function persistCiphertext(ciphertext) {
  globalCiphertext = {
    u: Array.isArray(ciphertext?.u) ? ciphertext.u.slice() : [],
    v: Array.isArray(ciphertext?.v) ? ciphertext.v.slice() : [],
  };

  ciphertextTupleBytes =
    (globalCiphertext.u.length + globalCiphertext.v.length) * 8;
}

function getLatestMetricsSnapshot(data) {
  if (Array.isArray(data?.history) && data.history.length > 0) {
    return data.history[data.history.length - 1];
  }

  if (data?.current_round && typeof data.current_round === "object") {
    return data.current_round;
  }

  return null;
}

/* ---------------- CHARTS ---------------- */

function createChart(id, label) {
  const ctx = document.getElementById(id).getContext("2d");

  return new Chart(ctx, {
    type: "line",

    data: {
      labels: [],
      datasets: [
        {
          label: label,
          data: [],
          borderColor: "#58a6ff",
          backgroundColor: "rgba(88,166,255,0.1)",
          tension: 0.3,
        },
      ],
    },

    options: {
      responsive: true,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#8b949e",
            callback: (value) => Number(value).toFixed(3),
          },
        },
      },
    },
  });
}

const gradChart = createChart("gradChart", "Gradient");

const latChart = createChart("latChart", "Latency");

const sizeChart = createChart("sizeChart", "Update Size");

function updateChart(chart, value) {
  chart.data.labels.push("");

  chart.data.datasets[0].data.push(value);

  if (chart.data.labels.length > 20) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }

  chart.update();
}

/* ---------------- MODEL SYNC ---------------- */

async function syncModel() {
  try {
    const response = await fetch(MODEL_ENDPOINT, { cache: "no-store" });

    if (!response.ok) throw new Error("Coordinator offline");

    const data = await response.json();

    const ciphertext = data.ciphertext
      ? data.ciphertext
      : { u: data.ciphertext_u || [], v: data.ciphertext_v || [] };

    persistCiphertext(ciphertext);

    document.getElementById("status").innerText = "ONLINE (BLIND AGGREGATOR)";

    document.getElementById("status").className = "status-online";

    document.getElementById("round").innerText = data.round;

    document.getElementById("ciphertextSize").innerText =
      `${ciphertextTupleBytes}`;

    log(
      `Encrypted payload received. Round ${data.round} | ciphertext tuple updated`,
    );
  } catch (e) {
    document.getElementById("status").innerText = "OFFLINE";

    document.getElementById("status").className = "status-offline";

    if (!coordinatorHealthy) {
      log("Coordinator unreachable", "warning");
    }
  }
}

/* ---------------- METRICS SYNC ---------------- */
async function syncMetrics() {
  try {
    const res = await fetch(METRICS_ENDPOINT, { cache: "no-store" });

    if (!res.ok) throw new Error();

    const data = await res.json();

    const m = getLatestMetricsSnapshot(data);
    if (!m) return;

    const clients =
      m.client_count ??
      m.federated_metrics?.participating_clients ??
      data.expected_clients ??
      0;
    const percent = Math.min(100, (clients / EXPECTED_CLIENTS) * 100);

    document.getElementById("progressBar").style.width = percent + "%";

    const grad = m.gradient_norm ?? m.training_metrics?.gradient_norm ?? 0;
    const lat =
      m.aggregation_ms ??
      m.mean_ring_encryption_ms ??
      m.system_metrics?.communication_latency ??
      0;
    const size =
      m.update_size_bytes ??
      m.system_metrics?.update_size_bytes ??
      ciphertextTupleBytes;

    document.getElementById("clients").innerText = clients;

    document.getElementById("gradNorm").innerText = grad.toFixed(PRECISION);

    document.getElementById("latency").innerText =
      Number(lat).toFixed(PRECISION);

    document.getElementById("updateSize").innerText = size;

    updateChart(gradChart, grad);

    updateChart(latChart, lat);

    updateChart(sizeChart, size);
  } catch {
    if (!coordinatorHealthy) {
      log("Metrics unavailable", "warning");
    }
  }
}

/* ---------------- BLINDNESS VERIFY ---------------- */
async function syncBlindness() {
  try {
    const response = await fetch(BLINDNESS_ENDPOINT, { cache: "no-store" });

    if (!response.ok) throw new Error("Blindness endpoint unavailable");

    const data = await response.json();
    const entropy = Number(data.entropy_bits ?? 0);
    const variance = Number(data.variance ?? 0);
    const state =
      entropy >= HIGH_ENTROPY_THRESHOLD
        ? "CRYPTOGRAPHICALLY BLIND"
        : "UNDER REVIEW";

    const label = document.getElementById("blindnessStatus");
    label.innerText = `Aggregator State: ${state}`;
    label.className =
      entropy >= HIGH_ENTROPY_THRESHOLD ? "blindness-ok" : "blindness-warn";

    document.getElementById("blindnessEntropy").innerText =
      entropy.toFixed(PRECISION);
    document.getElementById("blindnessVariance").innerText =
      variance.toFixed(PRECISION);

    log(`Blindness verified. Entropy ${entropy.toFixed(PRECISION)}`);
  } catch {
    const label = document.getElementById("blindnessStatus");
    label.innerText = "Aggregator State: VERIFICATION UNAVAILABLE";
    label.className = "blindness-warn";
  }
}

/* ---------------- HEALTH SYNC ---------------- */
async function syncHealth() {
  try {
    const response = await fetch(HEALTH_ENDPOINT, { cache: "no-store" });

    if (!response.ok) throw new Error("Health check failed");

    if (!coordinatorHealthy) {
      coordinatorHealthy = true;
      clearTransientWarnings();
      document.getElementById("status").innerText = "ONLINE (BLIND AGGREGATOR)";
      document.getElementById("status").className = "status-online";
      log("Coordinator health check passed");
    }
  } catch {
    coordinatorHealthy = false;
  }
}

/* ---------------- POLLING ---------------- */

setInterval(syncModel, 5000);

setInterval(syncMetrics, 5000);

setInterval(syncBlindness, 7000);

setInterval(syncHealth, 4000);

syncModel();
syncMetrics();
syncBlindness();
syncHealth();
