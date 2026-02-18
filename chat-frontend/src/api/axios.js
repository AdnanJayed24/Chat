import axios from "axios";

const trimTrailingSlash = (value = "") => value.replace(/\/$/, "");

const configuredApiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");
const inferredProdApiBaseUrl =
  typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

const apiBaseUrl = configuredApiBaseUrl ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : inferredProdApiBaseUrl);

const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
