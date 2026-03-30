import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Base API
export const API = `${BACKEND_URL}/api`;

// ── Auth helpers (SEM SLUG) ──

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = () => {
  const token = localStorage.getItem("token");
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return token;
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const logout = () => {
  setAuthToken(null);
};

// Inicializa token ao carregar
getAuthToken();

export default axios;
