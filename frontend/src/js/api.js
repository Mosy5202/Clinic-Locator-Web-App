// Shared API helper. Keep endpoint paths and response fields aligned with docs/api-contract.md.
const API_BASE_URL = "http://127.0.0.1:5000";

async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `API request failed (${response.status})`);
  }
  return response.json();
}
