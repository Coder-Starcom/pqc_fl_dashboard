const API_BASE_URL =
  window.__API_BASE_URL__ ||
  "https://pq-federated-coordinator-v3.onrender.com";
const MODEL_ENDPOINT = `${API_BASE_URL}/global_model`;
const BLINDNESS_ENDPOINT = `${API_BASE_URL}/api/verify_blindness`;
const HEALTH_ENDPOINT = `${API_BASE_URL}/health`;
const STATUS_ENDPOINT = `${API_BASE_URL}/status`;

console.info("Dashboard origin:", window.location.origin || "null");
console.info("Coordinator API:", API_BASE_URL);

let coordinatorHealthy = false;
let healthFailures = 0;
let modelFailures = 0;
let blindnessFailures = 0;

function setCoordinatorStatus(text, className) {
  const el = document.getElementById("status");
  el.innerText = text;
  el.className = className;
}

function buildRequestOptions() {
  return {
    cache: "no-store",
  };
}

function warningKey(text) {
  return text;
}

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
      if (text.includes("Coordinator unreachable")) {
        entry.remove();
      }
    });
}

function logOnce(key, msg, kind = "info") {
  const existing = Array.from(document.querySelectorAll(".log-entry")).some(
    (entry) => entry.dataset.logKey === key,
  );
  if (existing) return;

  const container = document.getElementById("logs");
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.dataset.kind = kind;
  entry.dataset.logKey = key;
  entry.innerHTML = `[${new Date().toLocaleTimeString()}] ${msg}`;
  container.prepend(entry);
}

/* ---------------- MODEL SYNC ---------------- */

async function syncModel() {
  try {
    const response = await fetch(MODEL_ENDPOINT, {
      ...buildRequestOptions(),
    });

    if (!response.ok) throw new Error(`Coordinator offline (${response.status})`);

    const data = await response.json();

    setCoordinatorStatus("ONLINE (BLIND AGGREGATOR)", "status-online");

    document.getElementById("round").innerText = data.round;

    log(
      `Encrypted payload received. Round ${data.round} is available.`,
    );
    modelFailures = 0;
  } catch (e) {
    console.warn("syncModel failed", e, "origin=", window.location.origin || "null");
    modelFailures += 1;
    if (healthFailures < 3) {
      setCoordinatorStatus("BOOTING", "status-booting");
    } else {
      setCoordinatorStatus("OFFLINE", "status-offline");
    }

    if (modelFailures === 1) {
      logOnce(warningKey("Coordinator unreachable"), "Coordinator unreachable", "warning");
    }
  }
}

/* ---------------- BLINDNESS VERIFY ---------------- */
async function syncBlindness() {
  try {
    const response = await fetch(BLINDNESS_ENDPOINT, {
      ...buildRequestOptions(),
    });

    if (!response.ok) throw new Error("Blindness endpoint unavailable");

    const data = await response.json();
    const verified = Boolean(data.verified);
    const state = verified ? "CRYPTOGRAPHICALLY BLIND" : "UNDER REVIEW";

    const label = document.getElementById("blindnessStatus");
    label.innerText = `Aggregator State: ${state}`;
    label.className =
      verified ? "blindness-ok" : "blindness-warn";

    document.getElementById("blindnessEntropy").innerText =
      verified ? "hidden" : "0";
    document.getElementById("blindnessVariance").innerText =
      verified ? "hidden" : "0";

    log(`Blindness verification status: ${state}`);
    blindnessFailures = 0;
  } catch (e) {
    console.warn("syncBlindness failed", e, "origin=", window.location.origin || "null");
    blindnessFailures += 1;
    const label = document.getElementById("blindnessStatus");
    label.innerText = blindnessFailures < 3
      ? "Aggregator State: INITIALIZING"
      : "Aggregator State: VERIFICATION UNAVAILABLE";
    label.className = "blindness-warn";
  }
}

/* ---------------- HEALTH SYNC ---------------- */
async function syncHealth() {
  try {
    let response = await fetch(STATUS_ENDPOINT, {
      ...buildRequestOptions(),
    });

    if (!response.ok) {
      response = await fetch(HEALTH_ENDPOINT, {
        ...buildRequestOptions(),
      });
    }

    if (!response.ok) throw new Error("Health check failed");

    const data = await response.json();
    coordinatorHealthy = true;
    healthFailures = 0;

    if (data?.status === "ok") {
      clearTransientWarnings();
      if (data.has_aggregate_ciphertext) {
        setCoordinatorStatus("ONLINE (BLIND AGGREGATOR)", "status-online");
      } else {
        setCoordinatorStatus("ONLINE (BOOTING)", "status-booting");
      }
      log("Coordinator health check passed");
    }
  } catch (e) {
    console.warn("syncHealth failed", e, "origin=", window.location.origin || "null");
    healthFailures += 1;
    coordinatorHealthy = false;
    if (healthFailures < 3) {
      setCoordinatorStatus("BOOTING", "status-booting");
    } else {
      setCoordinatorStatus("OFFLINE", "status-offline");
    }
  }
}

/* ---------------- POLLING ---------------- */

setInterval(syncModel, 5000);

setInterval(syncBlindness, 7000);

setInterval(syncHealth, 4000);

syncModel();
syncBlindness();
syncHealth();
