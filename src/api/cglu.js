const API_HOST = import.meta.env.VITE_CGLU_API_HOST || 'http://localhost:8080';
const API_KEY = import.meta.env.VITE_CGLU_API_KEY || 'd43e513379c365af78e976901043d0852e6fbb74';
const AIRA_HOST = import.meta.env.VITE_AIRA_HOST || 'http://localhost:2100';

const headers = () => ({
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
});

async function request(url, options = {}) {
  const res = await fetch(url, { headers: headers(), ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// ── Campaigns ───────────────────────────────────
export async function listCampaigns() {
  return request(`${API_HOST}/campaigns/v1/internal/campaigns/list`);
}

export async function getCampaign(campaignId) {
  return request(`${API_HOST}/campaigns/v1/internal/campaigns/${campaignId}`);
}

export async function createCampaign(payload) {
  return request(`${API_HOST}/campaigns/v1/internal/campaigns/new`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCampaign(campaignId, patch) {
  return request(`${API_HOST}/campaigns/v1/internal/campaigns/${campaignId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

// ── Layouts / FragmentMaps ──────────────────────
export async function getFragmentMap(fragmentMapId) {
  return request(`${API_HOST}/campaigns/v1/internal/fragmentmap/${fragmentMapId}`);
}

export async function createFragmentMap(payload) {
  return request(`${API_HOST}/campaigns/v1/internal/fragmentmap/add`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateFragmentMap(fragmentMapId, patch) {
  return request(`${API_HOST}/campaigns/v1/internal/fragmentmap/${fragmentMapId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function upsertLayout(payload) {
  return request(`${API_HOST}/campaigns/v1/internal/layout`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── Theme ───────────────────────────────────────
export async function getThemeConfig() {
  return request(`${API_HOST}/campaigns/v1/internal/theme`);
}

// ── Preview ─────────────────────────────────────
export async function getPreviewLink(campaignId) {
  const PAINT_HOST = import.meta.env.VITE_PAINT_API_HOST || 'http://localhost:8081';
  return request(`${PAINT_HOST}/reward/v1.1/campaigns/${campaignId}/previewLink`);
}

// ── Aira Integration ────────────────────────────
export async function askAira(sessionId, message) {
  const res = await fetch(`${AIRA_HOST}/ask-aira/copilot/session/${sessionId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

export async function createAiraSession() {
  const res = await fetch(`${AIRA_HOST}/ask-aira/copilot/session/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstMessage: 'Layout editor session' }),
  });
  return res.json();
}
