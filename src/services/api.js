const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api` : "/api";
const TOKEN_KEY = "certifypro-token";

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(path, options = {}) {
  const token = authStorage.getToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

export const api = {
  health: () => request("/health"),

  register: (details) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(details),
    }),

  login: async (credentials) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (data.token) authStorage.setToken(data.token);
    return data;
  },

  logout: () => authStorage.clearToken(),

  me: () => request("/auth/me"),

  getTemplates: () => request("/certificates"),

  createTemplate: (template) =>
    request("/certificates", {
      method: "POST",
      body: JSON.stringify(template),
    }),

  updateTemplate: (id, changes) =>
    request(`/certificates/${id}`, {
      method: "PUT",
      body: JSON.stringify(changes),
    }),

  deleteTemplate: (id) =>
    request(`/certificates/${id}`, { method: "DELETE" }),

  getRecipients: () => request("/recipients"),

  createRecipient: (recipient) =>
    request("/recipients", {
      method: "POST",
      body: JSON.stringify(recipient),
    }),

  bulkCreateRecipients: (recipients) =>
    request("/recipients/bulk", {
      method: "POST",
      body: JSON.stringify({ recipients }),
    }),

  updateRecipient: (id, changes) =>
    request(`/recipients/${id}`, {
      method: "PUT",
      body: JSON.stringify(changes),
    }),

  deleteRecipient: (id) =>
    request(`/recipients/${id}`, { method: "DELETE" }),

  getIssuedCertificates: () => request("/issued-certificates"),

  issueCertificate: (templateId, recipientId, options = {}) =>
    request("/issued-certificates/issue", {
      method: "POST",
      body: JSON.stringify({ templateId, recipientId, ...options }),
    }),

  setCertificateExpiry: (certificateId, expiresAt) =>
    request(`/issued-certificates/${encodeURIComponent(certificateId)}/expiry`, {
      method: "PATCH",
      body: JSON.stringify({ expiresAt }),
    }),

  resendCertificateEmail: (certificateId) =>
    request(`/issued-certificates/${encodeURIComponent(certificateId)}/email`, {
      method: "POST",
    }),

  verifyCertificate: (certificateId) =>
    request(`/issued-certificates/verify/${encodeURIComponent(certificateId)}`),

  revokeCertificate: (certificateId) =>
    request(`/issued-certificates/${encodeURIComponent(certificateId)}/revoke`, {
      method: "PATCH",
    }),
};
