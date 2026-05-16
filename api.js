/**
 * Unified Production Core — frontend API integration layer.
 * Mirrors coordinator_service.py auth: token on all routes except /health.
 */

const API_BASE_URL =
  window.__API_BASE_URL__ || "https://pq-federated-coordinator-v3.onrender.com";

const API_AUTH_TOKEN = window.__API_AUTH_TOKEN__ || "pq-fed-auth-token";
const API_SIGNATURE_SECRET =
  window.__API_SIGNATURE_SECRET__ || API_AUTH_TOKEN;

const ENDPOINTS = {
  health: `${API_BASE_URL}/health`,
  metrics: `${API_BASE_URL}/metrics`
};

function buildAuthHeaders(extra = {}) {
  const headers = { ...extra };
  if (API_AUTH_TOKEN) {
    headers["X-Client-Token"] = API_AUTH_TOKEN;
  }
  return headers;
}

/** Render load-balancer probe — intentionally NO X-Client-Token. */
async function fetchHealth() {
  const response = await fetch(ENDPOINTS.health, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Health check failed (${response.status})`);
  }
  return response.json();
}

async function fetchWithAuth(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: buildAuthHeaders(options.headers || {}),
  });
  if (!response.ok) {
    throw new Error(`Request failed ${path} (${response.status})`);
  }
  return response.json();
}

async function fetchMetrics() {
  const payload = await fetchWithAuth("/metrics");
  return normalizeMetricsRounds(payload.rounds || []);
}

/**
 * Merge metrics by round_number (matches core/metrics_tracker.update_round).
 */
function normalizeMetricsRounds(rows) {
  const byRound = new Map();
  for (const row of rows) {
    const roundNumber = parseInt(row.round_number, 10);
    if (Number.isNaN(roundNumber)) continue;
    
    const normalizedRow = {
      ...row,
      round_number: roundNumber,
      accuracy: parseFloat(row.accuracy) || 0,
      loss: parseFloat(row.loss) || 0,
      noise_budget: parseFloat(row.noise_budget) || 0,
      bandwidth_kb: parseFloat(row.bandwidth_kb) || 0
    };
    
    const existing = byRound.get(roundNumber) || {};
    byRound.set(roundNumber, { ...existing, ...normalizedRow });
  }
  return [...byRound.values()].sort(
    (left, right) => parseInt(left.round_number, 10) - parseInt(right.round_number, 10),
  );
}

async function fetchLocalArtifact(filename) {
  try {
    const url = `${API_BASE_URL}/${filename}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

window.PqcApi = {
  API_BASE_URL,
  API_AUTH_TOKEN,
  ENDPOINTS,
  fetchHealth,
  fetchMetrics,
  fetchLocalArtifact,
  normalizeMetricsRounds,
};
