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
  metrics: `${API_BASE_URL}/metrics`,
  globalModel: `${API_BASE_URL}/global_model`,
  sharedContext: `${API_BASE_URL}/api/shared_context`,
  submitUpdate: `${API_BASE_URL}/submit_update`,
  dashboard: `${API_BASE_URL}/`,
};

function canonicalStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalStringify(item)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  const body = keys
    .map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`)
    .join(",");
  return `{${body}}`;
}

async function hmacSha256Hex(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

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

async function fetchGlobalModel() {
  return fetchWithAuth("/global_model");
}

async function fetchSharedContext() {
  return fetchWithAuth("/api/shared_context");
}

async function submitUpdate(updatePayload) {
  const body = canonicalStringify(updatePayload);
  const signature = await hmacSha256Hex(API_SIGNATURE_SECRET, body);
  const response = await fetch(ENDPOINTS.submitUpdate, {
    method: "POST",
    cache: "no-store",
    headers: buildAuthHeaders({
      "Content-Type": "application/json",
      "X-Client-Signature": signature,
    }),
    body,
  });
  if (!response.ok) {
    throw new Error(`submit_update failed (${response.status})`);
  }
  return response.json();
}

/**
 * Merge metrics by round_number (matches core/metrics_tracker.update_round).
 */
function normalizeMetricsRounds(rows) {
  const byRound = new Map();
  for (const row of rows) {
    const roundNumber = Number(row.round_number);
    if (Number.isNaN(roundNumber)) continue;
    const existing = byRound.get(roundNumber) || {};
    byRound.set(roundNumber, { ...existing, ...row, round_number: roundNumber });
  }
  return [...byRound.values()].sort(
    (left, right) => Number(left.round_number) - Number(right.round_number),
  );
}

async function fetchLocalArtifact(filename) {
  try {
    const response = await fetch(filename, { cache: "no-store" });
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
  fetchGlobalModel,
  fetchSharedContext,
  submitUpdate,
  fetchLocalArtifact,
  normalizeMetricsRounds,
  canonicalStringify,
};
