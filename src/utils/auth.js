const TOKEN_KEY = "lancherix_token";

// The card app's own backend (NOT the Auth backend) — set per environment.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? "https://lancherixcard-backend.onrender.com";

// Where LancherixAuth's login page lives for this app specifically —
// resolves to https://auth.lancherix.com/login/card?app=card
const AUTH_LOGIN_BASE = "https://auth.lancherix.com/login";

// Must match the key `LoginPage.jsx` reads via `params.get("app")` and looks
// up in its `redirects` map — that map currently only has studio/labs/card,
// so no change needed there as long as this stays "card".
const APP_ID = "card";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

// Sends the user back to the shared login page, tagged so it knows to
// redirect back here (to /auth/callback) once they're logged in.
export function redirectToLogin() {
  window.location.href = `${AUTH_LOGIN_BASE}/${APP_ID}?app=${APP_ID}`;
}

export function logout() {
  clearToken();
  redirectToLogin();
}

// Use this for every call to the card app's backend instead of raw fetch.
// Attaches the token, and on a 401 (expired/invalid token) clears it and
// bounces the user back to login instead of leaving the app in a broken state.
export async function apiFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    clearToken();
    redirectToLogin();
    throw new Error("Not authenticated");
  }

  return res;
}