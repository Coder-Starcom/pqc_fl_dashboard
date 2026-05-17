/**
 * Hardened Production Environment Injector Config
 * Enforces strict isolation of backend cryptographic signing keys from client-side assets.
 */

// 1. Production API Base Routing Hook
window.__API_BASE_URL__ =
  window.__API_BASE_URL__ || "https://pq-federated-coordinator-v3.onrender.com";

// 2. Production Metrics Read Token Hook
window.__API_AUTH_TOKEN__ = window.__API_AUTH_TOKEN__ || "pq-fed-auth-token";

/**
 * ARCHITECTURAL COMPLIANCE FIX:
 * Removed window.__API_SIGNATURE_SECRET__.
 * The HMAC signing key belongs exclusively to headless Python client environments
 * and backend verification routers. Exposing it to browser script runtimes
 * compromises system-wide non-repudiation and integrity boundaries.
 */
Object.freeze(window.__API_BASE_URL__);
