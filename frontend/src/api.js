export const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://gpaget-front.onrender.com";

function authHeaders() {
  const token = localStorage.getItem("jwt_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest(path, method = "GET", body = null, isForm = false) {
  const headers = isForm
    ? { ...authHeaders() }
    : { "Content-Type": "application/json", ...authHeaders() };

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : null,
  });

  if (response.status === 401) {
    localStorage.removeItem("jwt_token");
  }

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(data.message || "API Error");
  }

  return data;
}
