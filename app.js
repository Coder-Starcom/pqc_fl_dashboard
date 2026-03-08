const MODEL_ENDPOINT =
  "https://pq-federated-coordinator-v3.onrender.com/global_model";

const METRICS_ENDPOINT =
  "https://pq-federated-coordinator-v3.onrender.com/metrics";

let globalWeights = [];
let globalBias = 0;

const EXPECTED_CLIENTS = 2;
const PRECISION = 6;

/* ---------------- LOGGING ---------------- */

function log(msg) {
  const container = document.getElementById("logs");

  const entry = document.createElement("div");

  entry.className = "log-entry";

  entry.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}`;

  container.prepend(entry);
}

/* ---------------- MODEL NORM ---------------- */

function calculateNorm(w) {
  if (!w || w.length === 0) return "0.00";

  return Math.sqrt(w.reduce((sum, val) => sum + val * val, 0)).toFixed(
    PRECISION,
  );
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
        y: { ticks: { color: "#8b949e" } },
      },
    },
  });
}

const gradChart = createChart("gradChart", "Gradient");

const latChart = createChart("latChart", "Latency");

const driftChart = createChart("driftChart", "Model Drift");

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

    if (!data.weights) return;

    globalWeights = data.weights;
    globalBias = data.bias;

    document.getElementById("status").innerText = "ONLINE (PQC SECURE)";

    document.getElementById("status").className = "status-online";

    document.getElementById("round").innerText = data.round;

    document.getElementById("modelNorm").innerText =
      calculateNorm(globalWeights);

    log(`Model synced. Round ${data.round}`);
  } catch (e) {
    document.getElementById("status").innerText = "OFFLINE";

    document.getElementById("status").className = "status-offline";

    log("Coordinator unreachable");
  }
}

/* ---------------- METRICS SYNC ---------------- */
async function syncMetrics() {
  try {
    const res = await fetch(METRICS_ENDPOINT, { cache: "no-store" });

    if (!res.ok) throw new Error();

    const data = await res.json();

    if (!data.current_round) return;

    const m = data.current_round;

    const clients = m.federated_metrics?.participating_clients ?? 0;
    const percent = Math.min(100, (clients / EXPECTED_CLIENTS) * 100);

    document.getElementById("progressBar").style.width = percent + "%";

    const drift = (m.federated_metrics?.convergence ?? 0) * 1000;

    const grad = m.training_metrics?.gradient_norm ?? 0;

    const lat = (m.system_metrics?.communication_latency ?? 0) * 1000;

    const size = m.system_metrics?.update_size_bytes ?? 0;

    document.getElementById("clients").innerText = clients;

    document.getElementById("modelDrift").innerText = drift.toFixed(PRECISION);

    document.getElementById("gradNorm").innerText = grad.toFixed(PRECISION);

    document.getElementById("latency").innerText = lat.toFixed(PRECISION);

    document.getElementById("updateSize").innerText = size;

    updateChart(gradChart, grad);

    updateChart(latChart, lat);

    updateChart(driftChart, Number(drift.toFixed(PRECISION)));
  } catch {
    log("Metrics unavailable");
  }
}

/* ---------------- INFERENCE ---------------- */

function predict() {
  const input = document.getElementById("inputVector").value;

  const x = input.split(",").map(Number);

  if (x.length !== globalWeights.length) {
    alert(`Model expects ${globalWeights.length} features`);

    return;
  }

  let z = globalWeights.reduce((sum, w, i) => sum + w * x[i], 0) + globalBias;

  const prob = 1 / (1 + Math.exp(-z));

  const pred = prob >= 0.5 ? "Fraud (1)" : "Legit (0)";

  document.getElementById("predictionResult").innerText =
    `Prediction: ${pred} | Confidence ${(prob * 100).toFixed(2)}%`;

  log(`Inference executed. Prob ${prob.toFixed(PRECISION)}`);
}

/* ---------------- POLLING ---------------- */

setInterval(syncModel, 5000);

setInterval(syncMetrics, 5000);

syncModel();
syncMetrics();
